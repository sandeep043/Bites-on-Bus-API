const Agent = require('../model/agentModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
















module.exports = {
    registerAgent,
    loginAgent,
    getAgentProfile,
    updateAgentProfile,
    deleteAgentAccount,
    getAllAgents
};