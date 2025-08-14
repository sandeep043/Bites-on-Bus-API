const Agent = require('../model/agentModel');
const Order = require('../model/orderModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Helper: Generate JWT Token
const signToken = (id) => {
    return jwt.sign({ id: id._id || id, role: id.role || 'agent' }, "mysecretkey", {
        expiresIn: '1h'
    });
};

// 1. REGISTER AGENT
const registerAgent = async (req, res) => {
    try {
        const agentData = req.body;
        const existingAgent = await Agent.findOne({ email: agentData.email });
        if (existingAgent) {
            return res.status(400).json({ message: "Agent Already Exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(agentData.password, salt);
        agentData.password = hashedPassword;
        const agent = new Agent(agentData);
        await agent.save();
        res.status(201).json({ message: "Agent Created Successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// 2. LOGIN AGENT
const loginAgent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const agent = await Agent.findOne({ email }).select('+password');
        if (!agent) {
            return res.status(401).json({ message: 'Invalid email' });
        }
        const isMatch = await bcrypt.compare(password, agent.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: agent._id, email: agent.email, role: agent.role },
            "mysecretkey",
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: 'login successful', token: token, agent: agent });
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.message });
    }
};

// 3. GET AGENT PROFILE
const getAgentProfile = async (req, res) => {
    try {
        const agent = await Agent.findById(req.agent._id);
        res.status(200).json({ status: 'success', data: agent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. UPDATE AGENT PROFILE
const updateAgentProfile = async (req, res) => {
    try {
        const filteredBody = {};
        const allowedFields = ['name', 'email', 'phone'];
        Object.keys(req.body).forEach(el => {
            if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
        });
        const updatedAgent = await Agent.findByIdAndUpdate(
            req.agent._id,
            filteredBody,
            { new: true, runValidators: true }
        );
        res.status(200).json({ status: 'success', data: updatedAgent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. DELETE AGENT ACCOUNT
const deleteAgentAccount = async (req, res) => {
    try {
        await Agent.findByIdAndDelete(req.agent._id);
        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. GET ALL AGENTS
const getAllAgents = async (req, res) => {
    try {
        const agents = await Agent.find();
        res.status(200).json({ status: 'success', data: agents });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update agent availabelity by agentId
const updateAgentAvailavelity = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { availabelity } = req.body;

        if (!agentId || !availabelity || !['online', 'offline'].includes(availabelity)) {
            return res.status(400).json({ message: "agentId and valid availabelity ('online' or 'offline') are required" });
        }

        const agent = await Agent.findByIdAndUpdate(
            agentId,
            { availabelity },
            { new: true }
        );

        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }

        res.status(200).json({
            status: 'success',
            data: agent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAgentOrdersById = async (req, res) => {
    try {
        const { agentId } = req.params;
        if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({ message: "Valid agentId is required" });
        }
        const orders = await Order.find({ agentId })
            .populate('restaurantId', 'name location')
            .populate('userId', 'name email')
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

module.exports = {
    registerAgent,
    loginAgent,
    getAgentProfile,
    updateAgentProfile,
    deleteAgentAccount,
    getAllAgents,
    updateAgentAvailavelity,
    getAgentOrdersById
};