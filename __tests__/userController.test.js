const userController = require('../controller/userController');
const User = require('../model/userModel');
const Order = require('../model/orderModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../model/userModel');
jest.mock('../model/orderModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('userController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('addUser', () => {
        it('should create a new user if email does not exist', async () => {
            req.body = { email: 'test@example.com', password: 'pass123' };
            User.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedpass');
            User.prototype.save = jest.fn().mockResolvedValue({});
            await userController.addUser(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "User Created Successfully" });
        });

        it('should return 400 if user already exists', async () => {
            req.body = { email: 'test@example.com', password: 'pass123' };
            User.findOne.mockResolvedValue({ email: 'test@example.com' });
            await userController.addUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "User Already Exists with the Email" });
        });
    });

    describe('loginUser', () => {
        it('should login user with correct credentials', async () => {
            req.body = { email: 'test@example.com', password: 'pass123' };
            const user = { _id: '1', email: 'test@example.com', password: 'hashedpass', role: 'user' };
            User.findOne.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');
            await userController.loginUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'login successful', token: 'token', user });
        });

        it('should return 401 for invalid email', async () => {
            req.body = { email: 'wrong@example.com', password: 'pass123' };
            User.findOne.mockResolvedValue(null);
            await userController.loginUser(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email' });
        });

        it('should return 401 for invalid password', async () => {
            req.body = { email: 'test@example.com', password: 'wrongpass' };
            User.findOne.mockResolvedValue({ password: 'hashedpass' });
            bcrypt.compare.mockResolvedValue(false);
            await userController.loginUser(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            User.find.mockResolvedValue([{ email: 'a' }, { email: 'b' }]);
            await userController.getAllUsers(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ users: [{ email: 'a' }, { email: 'b' }] });
        });
    });

    describe('getUserById', () => {
        it('should return user if found', async () => {
            req.params.id = '1';
            User.findById.mockResolvedValue({ _id: '1', email: 'a' });
            await userController.getUserById(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ user: { _id: '1', email: 'a' } });
        });

        it('should return 404 if user not found', async () => {
            req.params.id = '1';
            User.findById.mockResolvedValue(null);
            await userController.getUserById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User Not Found" });
        });
    });

    describe('updateUser', () => {
        it('should update user if found', async () => {
            req.params.id = '1';
            req.body = { email: 'updated@example.com' };
            User.findByIdAndUpdate.mockResolvedValue({ _id: '1', email: 'updated@example.com' });
            await userController.updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ user: { _id: '1', email: 'updated@example.com' } });
        });

        it('should return 404 if user not found', async () => {
            req.params.id = '1';
            User.findByIdAndUpdate.mockResolvedValue(null);
            await userController.updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User Not Found" });
        });
    });

    describe('deleteUser', () => {
        it('should delete user if found', async () => {
            req.params.id = '1';
            User.findByIdAndDelete.mockResolvedValue({ _id: '1', email: 'deleted@example.com' });
            await userController.deleteUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ user: { _id: '1', email: 'deleted@example.com' } });
        });

        it('should return 404 if user not found', async () => {
            req.params.id = '1';
            User.findByIdAndDelete.mockResolvedValue(null);
            await userController.deleteUser(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User Not Found" });
        });
    });

    describe('getUserOrdersWithDetails', () => {
        it('should return orders for user', async () => {
            req.params.id = '1';
            const orders = [{ _id: 'order1' }, { _id: 'order2' }];
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(orders)
            });
            await userController.getUserOrdersWithDetails(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: orders.length,
                data: orders
            });
        });

        it('should return 400 if userId not provided', async () => {
            req.params.id = undefined;
            await userController.getUserOrdersWithDetails(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "userId is required" });
        });
    });
});
