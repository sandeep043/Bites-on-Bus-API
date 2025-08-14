const Order = require('../model/orderModel');
const Restaurant = require('../model/restaurantModel');
const BusTrip = require('../model/busTripModel');
const PNRPassengerDetails = require('../model/PNRPassengersDetails');
const mongoose = require('mongoose');


// 2. GET ORDER BY ID
// const getOrderById = async (req, res) => {
//     try {
//         const orderId = req.params.id;

//         if (!mongoose.Types.ObjectId.isValid(orderId)) {
//             return res.status(400).json({ message: "Invalid order ID" });
//         }

//         const order = await Order.findById(orderId)
//             .populate('restaurantId', 'name cuisineType')
//             .populate('busId', 'busNumber');

//         if (!order) {
//             return res.status(404).json({ message: "Order not found" });
//         }

//         // Only allow order owner or admin to view
//         if (order.passengerId && order.passengerId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: "Unauthorized access" });
//         }

//         res.status(200).json({
//             status: 'success',
//             data: order
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: "Failed to fetch order",
//             error: error.message
//         });
//     }
// };

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



// Update order status by orderId
const updateOrderStatusById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ message: "orderId and status are required" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            status: 'success',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update order status",
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

// Get all active (not delivered) orders for a restaurant
const getActiveOrdersByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        if (!restaurantId) {
            return res.status(400).json({ message: "restaurantId is required" });
        }
        const activeOrders = await Order.find({
            restaurantId: restaurantId,
            status: { $ne: 'Delivered' }
        }).sort('-createdAt');
        res.status(200).json({
            status: 'success',
            results: activeOrders.length,
            data: activeOrders
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch active orders",
            error: error.message
        });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('restaurantId', 'name cuisineType')
            .populate('busId', 'busNumber')
            .sort('-createdAt');
        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: orders
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
}

// Get all "Ready to pickup" orders for a given location (stop/city)
const getReadyToPickupOrdersByLocation = async (req, res) => {
    try {
        const { stop, city } = req.query;
        if (!stop || !city) {
            return res.status(400).json({ message: "stop and city are required" });
        }
        const orders = await Order.find({
            status: { $in: ["Ready", "Ready to pickup"] },
            stop: stop,
            city: city,
            deliveryStatus: "pending"
        }).sort('-createdAt');
        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch ready to pickup orders"
        });
    }
};

// Agent accepts an order for delivery
const acceptOrderForDelivery = async (req, res) => {
    try {
        const { orderId, agentId } = req.body;
        // assuming agent is authenticated and agentId is available

        // Validate orderId
        if (!orderId || !agentId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Valid orderId and agentId are required" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.deliveryStatus !== 'pending' || order.status !== 'Ready to pickup') {
            return res.status(400).json({ message: "Order is not available for assignment" });
        }

        order.agentId = agentId;
        order.deliveryStatus = 'assigned';
        await order.save();

        res.status(200).json({
            status: 'success',
            message: 'Order assigned to agent',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to accept order for delivery",
            error: error.message
        });
    }
};

module.exports = {

    getOrdersByPnr,
    cancelOrder,
    getRestaurantOrders,
    getAllOrders,
    getActiveOrdersByRestaurant,
    updateOrderStatusById,
    getReadyToPickupOrdersByLocation,
    acceptOrderForDelivery
};