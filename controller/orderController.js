const Order = require('../models/orderModel');
const Restaurant = require('../models/restaurantModel');
const BusTrip = require('../models/busTripModel');
const PNRPassengerDetails = require('../models/pnrPassengerModel');
const mongoose = require('mongoose');

// 1. CREATE NEW ORDER
const createOrder = async (req, res) => {
    try {
        const { pnr, restaurantId, items, deliveryStopId, paymentMethod } = req.body;

        // Validate required fields
        if (!pnr || !restaurantId || !items || !deliveryStopId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if PNR exists and get trip details
        const passengerDetails = await PNRPassengerDetails.findOne({ pnr });
        if (!passengerDetails) {
            return res.status(404).json({ message: "PNR not found" });
        }

        // Get bus trip details
        const busTrip = await BusTrip.findOne({ pnr });
        if (!busTrip) {
            return res.status(404).json({ message: "Bus trip not found for this PNR" });
        }

        // Verify delivery stop exists in trip
        const deliveryStop = busTrip.intermediateStops.find(
            stop => stop.stopId === deliveryStopId
        );
        if (!deliveryStop) {
            return res.status(400).json({ message: "Invalid delivery stop for this trip" });
        }

        // Get restaurant details
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Calculate total amount and prepare order items
        let totalAmount = 0;
        const orderItems = items.map(item => {
            const menuItem = restaurant.menu.find(menu => menu.itemId === item.itemId);
            if (!menuItem) {
                throw new Error(`Item ${item.itemId} not found in menu`);
            }
            totalAmount += menuItem.price * item.quantity;
            return {
                itemId: item.itemId,
                name: menuItem.name,
                quantity: item.quantity,
                unitPrice: menuItem.price
            };
        });

        // Create order
        const newOrder = await Order.create({
            pnr,
            busId: busTrip.busId,
            restaurantId,
            passengerId: req.user?._id || null, // Optional if user is logged in
            items: orderItems,
            totalAmount,
            deliveryStopId,
            deliveryLocation: deliveryStop.location,
            estimatedDeliveryTime: deliveryStop.estimatedArrival,
            paymentMethod,
            status: 'pending'
        });

        res.status(201).json({
            status: 'success',
            data: newOrder
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create order",
            error: error.message
        });
    }
};

// 2. GET ORDER BY ID
const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const order = await Order.findById(orderId)
            .populate('restaurantId', 'name cuisineType')
            .populate('busId', 'busNumber');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Only allow order owner or admin to view
        if (order.passengerId && order.passengerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        res.status(200).json({
            status: 'success',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch order",
            error: error.message
        });
    }
};

// 3. GET ORDERS BY PNR
const getOrdersByPnr = async (req, res) => {
    try {
        const pnr = req.params.pnr;

        const orders = await Order.find({ pnr })
            .populate('restaurantId', 'name cuisineType')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

// 4. UPDATE ORDER STATUS (Admin/Restaurant Owner)
// 4. UPDATE ORDER STATUS (Agent)
const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status, otp } = req.body;

        // Validate inputs
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify agent is assigned to this order
        if (order.agentId.toString() !== req.agent._id.toString()) {
            return res.status(403).json({ message: "Not assigned to this order" });
        }

        // Status transition logic
        switch (status) {
            case 'picked_up':
                if (order.deliveryStatus !== 'assigned') {
                    return res.status(400).json({ message: "Order must be assigned first" });
                }
                order.deliveryStatus = 'picked_up';
                break;

            case 'delivered':
                if (order.deliveryStatus !== 'picked_up') {
                    return res.status(400).json({ message: "Order must be picked up first" });
                }
                // Verify OTP
                if (otp !== order.otp) {
                    return res.status(401).json({ message: "Invalid OTP" });
                }
                order.deliveryStatus = 'delivered';
                order.isOtpVerified = true;
                order.deliveredAt = Date.now();

                // Mark agent as available
                await Agent.findByIdAndUpdate(req.agent._id, {
                    $pull: { assignedOrders: orderId },
                    isAvailable: true
                });
                break;

            default:
                return res.status(400).json({ message: "Invalid status" });
        }

        const updatedOrder = await order.save();

        res.status(200).json({
            status: 'success',
            data: updatedOrder
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update order status",
            error: error.message
        });
    }
};

// 7. ASSIGN ORDER TO AGENT (Admin)
const assignOrderToAgent = async (req, res) => {
    try {
        const { orderId, agentId } = req.body;

        // Verify order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify agent exists and is available
        const agent = await Agent.findOne({
            _id: agentId,
            isAvailable: true
        });
        if (!agent) {
            return res.status(400).json({ message: "Agent not available" });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Update order
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                agentId,
                deliveryStatus: 'assigned',
                otp
            },
            { new: true }
        );

        // Update agent
        await Agent.findByIdAndUpdate(agentId, {
            $push: { assignedOrders: orderId },
            isAvailable: false
        });

        res.status(200).json({
            status: 'success',
            data: updatedOrder
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to assign order",
            error: error.message
        });
    }
};

// 8. GET AGENT ORDERS
const getAgentOrders = async (req, res) => {
    try {
        const agentId = req.agent._id;
        const { status } = req.query;

        const filter = { agentId };
        if (status) filter.deliveryStatus = status;

        const orders = await Order.find(filter)
            .populate('restaurantId', 'name location')
            .populate('pnr', 'passengers')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch agent orders",
            error: error.message
        });
    }
};

// 5. CANCEL ORDER (User)
const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Only allow cancellation by order owner
        if (order.passengerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to cancel this order" });
        }

        // Only allow cancellation if order isn't already preparing or later
        if (['preparing', 'ready', 'dispatched', 'delivered'].includes(order.status)) {
            return res.status(400).json({
                message: `Cannot cancel order in ${order.status} status`
            });
        }

        const cancelledOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: 'cancelled' },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: cancelledOrder
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to cancel order",
            error: error.message
        });
    }
};

// 6. GET ORDERS FOR RESTAURANT (Owner)
const getRestaurantOrders = async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        const { status } = req.query;

        // Verify restaurant belongs to requesting owner
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const filter = { restaurantId };
        if (status) filter.status = status;

        const orders = await Order.find(filter)
            .populate('pnr', 'passengers')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch restaurant orders",
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    getOrderById,
    getOrdersByPnr,
    updateOrderStatus,
    cancelOrder,
    getRestaurantOrders
};