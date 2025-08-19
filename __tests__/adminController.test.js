const adminController = require('../controller/adminController');
const Admin = require('../model/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../model/adminModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('adminController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('registerAdmin', () => {
        let saveSpy;
        beforeEach(() => {
            saveSpy = jest.spyOn(Admin.prototype, 'save').mockResolvedValue({});
        });
        afterEach(() => {
            saveSpy.mockRestore();
        });

        it('should create a new admin if email does not exist', async () => {
            req.body = { email: 'admin@example.com', password: 'pass123' };
            Admin.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedpass');
            await adminController.registerAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "Admin Created Successfully" });
        });

        it('should return 400 if admin already exists', async () => {
            req.body = { email: 'admin@example.com', password: 'pass123' };
            Admin.findOne.mockResolvedValue({ email: 'admin@example.com' });
            await adminController.registerAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Admin Already Exists" });
        });

        it('should handle errors', async () => {
            req.body = { email: 'admin@example.com', password: 'pass123' };
            Admin.findOne.mockRejectedValue(new Error('fail'));
            await adminController.registerAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('getAllAdmins', () => {
        it('should return all admins', async () => {
            Admin.find.mockResolvedValue([{ email: 'a' }, { email: 'b' }]);
            await adminController.getAllAdmins(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ admins: [{ email: 'a' }, { email: 'b' }] });
        });

        it('should handle errors', async () => {
            Admin.find.mockRejectedValue(new Error('fail'));
            await adminController.getAllAdmins(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('getAdminById', () => {
        it('should return admin if found', async () => {
            req.params.id = '1';
            Admin.findById.mockResolvedValue({ _id: '1', email: 'a' });
            await adminController.getAdminById(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ admin: { _id: '1', email: 'a' } });
        });

        it('should return 404 if admin not found', async () => {
            req.params.id = '1';
            Admin.findById.mockResolvedValue(null);
            await adminController.getAdminById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Admin Not Found" });
        });

        it('should handle errors', async () => {
            req.params.id = '1';
            Admin.findById.mockRejectedValue(new Error('fail'));
            await adminController.getAdminById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('updateAdmin', () => {
        it('should update admin if found', async () => {
            req.params.id = '1';
            req.body = { email: 'updated@example.com' };
            Admin.findByIdAndUpdate.mockResolvedValue({ _id: '1', email: 'updated@example.com' });
            await adminController.updateAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ admin: { _id: '1', email: 'updated@example.com' } });
        });

        it('should return 404 if admin not found', async () => {
            req.params.id = '1';
            Admin.findByIdAndUpdate.mockResolvedValue(null);
            await adminController.updateAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Admin Not Found" });
        });

        it('should handle errors', async () => {
            req.params.id = '1';
            Admin.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
            await adminController.updateAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('deleteAdmin', () => {
        it('should delete admin if found', async () => {
            req.params.id = '1';
            Admin.findByIdAndDelete.mockResolvedValue({ _id: '1', email: 'deleted@example.com' });
            await adminController.deleteAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ admin: { _id: '1', email: 'deleted@example.com' } });
        });

        it('should return 404 if admin not found', async () => {
            req.params.id = '1';
            Admin.findByIdAndDelete.mockResolvedValue(null);
            await adminController.deleteAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Admin Not Found" });
        });

        it('should handle errors', async () => {
            req.params.id = '1';
            Admin.findByIdAndDelete.mockRejectedValue(new Error('fail'));
            await adminController.deleteAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('loginAdmin', () => {
        it('should login admin with correct credentials', async () => {
            req.body = { email: 'admin@example.com', password: 'pass123' };
            const admin = { _id: '1', email: 'admin@example.com', password: 'hashedpass', role: 'admin' };
            Admin.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(admin) });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');
            await adminController.loginAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'login successful', token: 'token', admin });
        });

        it('should return 401 for invalid email', async () => {
            req.body = { email: 'wrong@example.com', password: 'pass123' };
            Admin.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
            await adminController.loginAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email' });
        });

        it('should return 401 for invalid password', async () => {
            req.body = { email: 'admin@example.com', password: 'wrongpass' };
            Admin.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ password: 'hashedpass' }) });
            bcrypt.compare.mockResolvedValue(false);
            await adminController.loginAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('should handle errors', async () => {
            req.body = { email: 'admin@example.com', password: 'pass123' };
            Admin.findOne.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('fail')) });
            await adminController.loginAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });
});
