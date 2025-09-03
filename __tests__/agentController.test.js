const agentController = require('../controller/agentController');
const Agent = require('../model/agentModel');
const Order = require('../model/orderModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

jest.mock('../model/agentModel');
jest.mock('../model/orderModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('mongoose', () => ({
    ...jest.requireActual('mongoose'),
    Types: {
        ObjectId: {
            isValid: jest.fn()
        }
    }
}));

describe('agentController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, agent: {}, user: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('registerAgent', () => {
        let saveSpy;
        beforeEach(() => {
            saveSpy = jest.spyOn(Agent.prototype, 'save').mockResolvedValue({});
        });
        afterEach(() => {
            saveSpy.mockRestore();
        });

        it('should create a new agent if email does not exist', async () => {
            req.body = { email: 'agent@example.com', password: 'pass123' };
            Agent.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedpass');
            await agentController.registerAgent(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "Agent Created Successfully" });
        });

        it('should return 400 if agent already exists', async () => {
            req.body = { email: 'agent@example.com', password: 'pass123' };
            Agent.findOne.mockResolvedValue({ email: 'agent@example.com' });
            await agentController.registerAgent(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Agent Already Exists" });
        });

        it('should handle errors', async () => {
            req.body = { email: 'agent@example.com', password: 'pass123' };
            Agent.findOne.mockRejectedValue(new Error('fail'));
            await agentController.registerAgent(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('loginAgent', () => {
        it('should login agent with correct credentials', async () => {
            req.body = { email: 'agent@example.com', password: 'pass123' };
            const agent = { _id: '1', email: 'agent@example.com', password: 'hashedpass', role: 'agent' };
            Agent.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(agent) });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');
            await agentController.loginAgent(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'login successful', token: 'token', agent });
        });

        it('should return 401 for invalid email', async () => {
            req.body = { email: 'wrong@example.com', password: 'pass123' };
            Agent.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
            await agentController.loginAgent(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email' });
        });

        it('should return 401 for invalid password', async () => {
            req.body = { email: 'agent@example.com', password: 'wrongpass' };
            Agent.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ password: 'hashedpass' }) });
            bcrypt.compare.mockResolvedValue(false);
            await agentController.loginAgent(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('should handle errors', async () => {
            req.body = { email: 'agent@example.com', password: 'pass123' };
            Agent.findOne.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('fail')) });
            await agentController.loginAgent(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });

    describe('getAgentProfile', () => {
        it('should return agent profile', async () => {
            req.agent = { _id: 'agentId' };
            Agent.findById.mockResolvedValue({ _id: 'agentId', name: 'Agent' });
            await agentController.getAgentProfile(req, res);
            expect(Agent.findById).toHaveBeenCalledWith('agentId');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { _id: 'agentId', name: 'Agent' } });
        });

        it('should handle errors', async () => {
            req.agent = { _id: 'agentId' };
            Agent.findById.mockRejectedValue(new Error('fail'));
            await agentController.getAgentProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });

    describe('updateAgentProfile', () => {
    it('should update agent profile with valid data', async () => {
        req.params = { id: 'validAgentId' };
        req.body = { name: 'New Name', email: 'new@email.com', phone: '123' };
        const updatedAgent = { _id: 'validAgentId', name: 'New Name', email: 'new@email.com', phone: '123' };
        
        Agent.findByIdAndUpdate.mockResolvedValue(updatedAgent);
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);
        
        await agentController.updateAgent(req, res);
        
        expect(Agent.findByIdAndUpdate).toHaveBeenCalledWith(
            'validAgentId',
            { name: 'New Name', email: 'new@email.com', phone: '123' },
            { new: true, runValidators: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Agent Updated Successfully', agent: updatedAgent });
    });

    it('should return 400 for invalid agent ID', async () => {
        req.params = { id: 'invalidId' };
        mongoose.Types.ObjectId.isValid.mockReturnValue(false);
        
        await agentController.updateAgent(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Agent ID' });
    });

    it('should return 404 when agent not found', async () => {
        req.params = { id: 'nonExistentAgentId' };
        req.body = { name: 'New Name' };
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);
        Agent.findByIdAndUpdate.mockResolvedValue(null);
        
        await agentController.updateAgent(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Agent Not Found' });
    });

    it('should handle errors', async () => {
        req.params = { id: 'validAgentId' };
        req.body = { name: 'New Name' };
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);
        Agent.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));
        
        await agentController.updateAgent(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error', error: expect.any(Error) });
    });
});


    describe('deleteAgentAccount', () => {
    it('should delete agent account with valid ID', async () => {
        req.params = { id: 'validAgentId' };
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);
        Agent.findByIdAndDelete.mockResolvedValue({});
        
        await agentController.deleteAgentAccount(req, res);
        
        expect(Agent.findByIdAndDelete).toHaveBeenCalledWith('validAgentId');
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.json).toHaveBeenCalledWith({ status: 'success', data: null });
    });

    it('should return 400 for invalid agent ID', async () => {
        req.params = { id: 'invalidId' };
        mongoose.Types.ObjectId.isValid.mockReturnValue(false);
        
        await agentController.deleteAgentAccount(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid owner ID' });
    });

    it('should handle errors', async () => {
        req.params = { id: 'validAgentId' };
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);
        Agent.findByIdAndDelete.mockRejectedValue(new Error('Database error'));
        
        await agentController.deleteAgentAccount(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
    });
});

    describe('getAllAgents', () => {
        it('should return all agents', async () => {
            Agent.find.mockResolvedValue([{ email: 'a' }, { email: 'b' }]);
            await agentController.getAllAgents(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ status: 'success', data: [{ email: 'a' }, { email: 'b' }] });
        });

        it('should handle errors', async () => {
            Agent.find.mockRejectedValue(new Error('fail'));
            await agentController.getAllAgents(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });

    describe('updateAgentAvailavelity', () => {
        it('should update agent availabelity if valid', async () => {
            req.params.agentId = 'agentId';
            req.body.availabelity = 'online';
            Agent.findByIdAndUpdate.mockResolvedValue({ _id: 'agentId', availabelity: 'online' });
            await agentController.updateAgentAvailavelity(req, res);
            expect(Agent.findByIdAndUpdate).toHaveBeenCalledWith(
                'agentId',
                { availabelity: 'online' },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { _id: 'agentId', availabelity: 'online' } });
        });

        it('should return 400 for invalid params', async () => {
            req.params.agentId = undefined;
            req.body.availabelity = undefined;
            await agentController.updateAgentAvailavelity(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "agentId and valid availabelity ('online' or 'offline') are required" });
        });

        it('should return 404 if agent not found', async () => {
            req.params.agentId = 'agentId';
            req.body.availabelity = 'online';
            Agent.findByIdAndUpdate.mockResolvedValue(null);
            await agentController.updateAgentAvailavelity(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Agent not found" });
        });

        it('should handle errors', async () => {
            req.params.agentId = 'agentId';
            req.body.availabelity = 'online';
            Agent.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
            await agentController.updateAgentAvailavelity(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });

    describe('getAgentOrdersById', () => {
        it('should return agent orders if valid', async () => {
            req.params.agentId = 'agentId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ agentId: 'agentId' }])
            });
            await agentController.getAgentOrdersById(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: 1,
                data: [{ agentId: 'agentId' }]
            });
        });

        it('should return 400 for invalid agentId', async () => {
            req.params.agentId = undefined;
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await agentController.getAgentOrdersById(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Valid agentId is required" });
        });

        it('should handle errors', async () => {
            req.params.agentId = 'agentId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('fail'))
            });
            await agentController.getAgentOrdersById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to fetch agent orders",
                error: expect.any(String)
            });
        });
    });

    describe('getCompletedDeliveriesByAgentId', () => {
        it('should return completed deliveries for agent', async () => {
            req.params.agentId = 'agentId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ agentId: 'agentId', status: 'Delivered' }])
            });
            await agentController.getCompletedDeliveriesByAgentId(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: 1,
                data: [{ agentId: 'agentId', status: 'Delivered' }]
            });
        });

        it('should return 400 for invalid agentId', async () => {
            req.params.agentId = undefined;
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await agentController.getCompletedDeliveriesByAgentId(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Valid agentId is required" });
        });

        it('should handle errors', async () => {
            req.params.agentId = 'agentId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('fail'))
            });
            await agentController.getCompletedDeliveriesByAgentId(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to fetch completed deliveries",
                error: expect.any(String)
            });
        });
    });
});
