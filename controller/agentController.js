const Agent = require('../model/agentModel');
const Order = require('../model/orderModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Generate JWT Token
const signToken = (id) => {
    // Accepts agent object, returns JWT with role
    return jwt.sign({ id: id._id || id, role: id.role || 'agent' }, process.env.JWT_SECRET || "mysecretkey", {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
};

// 1. AGENT REGISTRATION
const registerAgent = async (req, res) => {
    try {
        const { name, email, password, phone, vehicleNumber, vehicleType } = req.body;

        // Check if agent exists
        const existingAgent = await Agent.findOne({ email });
        if (existingAgent) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Create new agent
        const newAgent = await Agent.create({
            name,
            email,
            password,
            phone,
            vehicleNumber,
            vehicleType
        });

        // Generate token
        const token = signToken(newAgent);

        // Remove password from output
        newAgent.password = undefined;

        res.status(201).json({
            status: 'success',
            token,
            data: newAgent
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to register agent",
            error: error.message
        });
    }
};

// 2. AGENT LOGIN
const loginAgent = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // Check if agent exists and password is correct
        const agent = await Agent.findOne({ email }).select('+password');
        if (!agent || !(await agent.correctPassword(password, agent.password))) {
            return res.status(401).json({ message: "Incorrect email or password" });
        }

        // Generate token
        const token = signToken(agent);
        agent.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: agent
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to login agent",
            error: error.message
        });
    }
};

// 3. PROTECT MIDDLEWARE
const protect = async (req, res, next) => {
    try {
        // 1) Get token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: "You are not logged in!" });
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if agent exists
        const currentAgent = await Agent.findById(decoded.id);
        if (!currentAgent) {
            return res.status(401).json({ message: "Agent no longer exists" });
        }

        // Grant access
        req.agent = currentAgent;
        next();
    } catch (error) {
        res.status(500).json({
            message: "Authentication failed",
            error: error.message
        });
    }
};

// 4. GET AGENT PROFILE
const getAgentProfile = async (req, res) => {
    try {
        const agent = await Agent.findById(req.agent._id)
            .populate({
                path: 'assignedOrders',
                select: 'pnr deliveryStatus restaurantId',
                populate: {
                    path: 'restaurantId',
                    select: 'name location'
                }
            });

        res.status(200).json({
            status: 'success',
            data: agent
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch agent profile",
            error: error.message
        });
    }
};

// 5. UPDATE AGENT LOCATION
const updateAgentLocation = async (req, res) => {
    try {
        const { longitude, latitude } = req.body;

        if (!longitude || !latitude) {
            return res.status(400).json({ message: "Please provide coordinates" });
        }

        const updatedAgent = await Agent.findByIdAndUpdate(
            req.agent._id,
            {
                currentLocation: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                }
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: updatedAgent
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update location",
            error: error.message
        });
    }
};

// 6. UPDATE ORDER STATUS (with OTP verification)
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

// 7. GET AGENT ASSIGNED ORDERS
const getAssignedOrders = async (req, res) => {
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
            message: "Failed to fetch assigned orders",
            error: error.message
        });
    }
};

// 8. UPDATE AGENT AVAILABILITY
const updateAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body;

        const updatedAgent = await Agent.findByIdAndUpdate(
            req.agent._id,
            { isAvailable },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: updatedAgent
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update availability",
            error: error.message
        });
    }
};

module.exports = {
    registerAgent,
    loginAgent,
    protect,
    getAgentProfile,
    updateAgentLocation,
    updateOrderStatus,
    getAssignedOrders,
    updateAvailability
};