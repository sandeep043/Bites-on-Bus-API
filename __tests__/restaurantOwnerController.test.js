const restaurantOwnerController = require('../controller/restaurantOwnerController');
const RestaurantOwner = require('../model/restaurantOwnerModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock Restaurant model methods for controller tests
const Restaurant = require('../model/restaurantModel');
Restaurant.create = jest.fn();
Restaurant.updateMany = jest.fn();
Restaurant.find = jest.fn();

jest.mock('../model/restaurantOwnerModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('restaurantOwnerController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('addOwner', () => {
        let saveSpy;
        beforeEach(() => {
            saveSpy = jest.spyOn(RestaurantOwner.prototype, 'save').mockResolvedValue({});
        });
        afterEach(() => {
            saveSpy.mockRestore();
        });

        it('should create a new owner if email does not exist', async () => {
            req.body = { email: 'owner@example.com', password: 'pass123' };
            RestaurantOwner.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedpass');
            await restaurantOwnerController.addOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "User Created Successfully" });
        });

        it('should return 400 if owner already exists', async () => {
            req.body = { email: 'owner@example.com', password: 'pass123' };
            RestaurantOwner.findOne.mockResolvedValue({ email: 'owner@example.com' });
            await restaurantOwnerController.addOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "owner Already Exists" });
        });
    });

    describe('loginOwner', () => {
        it('should login owner with correct credentials', async () => {
            req.body = { email: 'owner@example.com', password: 'pass123' };
            const owner = { _id: '1', email: 'owner@example.com', password: 'hashedpass', role: 'owner' };
            RestaurantOwner.findOne.mockResolvedValue(owner);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');
            // Mock populate to return ownerWithRestaurant
            const ownerWithRestaurant = { _id: '1', email: 'owner@example.com', role: 'owner', ownedRestaurant: { name: 'Rest' } };
            const populateMock = jest.fn().mockResolvedValue(ownerWithRestaurant);
            RestaurantOwner.findById = jest.fn().mockReturnValue({ populate: populateMock });
            await restaurantOwnerController.loginOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'login successful', token: 'token', owner: ownerWithRestaurant });
        });

        it('should return 401 for invalid email', async () => {
            req.body = { email: 'wrong@example.com', password: 'pass123' };
            RestaurantOwner.findOne.mockResolvedValue(null);
            await restaurantOwnerController.loginOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email' });
        });

        it('should return 401 for invalid password', async () => {
            req.body = { email: 'owner@example.com', password: 'wrongpass' };
            RestaurantOwner.findOne.mockResolvedValue({ password: 'hashedpass' });
            bcrypt.compare.mockResolvedValue(false);
            await restaurantOwnerController.loginOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });
    });

    describe('getAllOwners', () => {
        it('should return all owners', async () => {
            RestaurantOwner.find.mockResolvedValue([{ email: 'a' }, { email: 'b' }]);
            await restaurantOwnerController.getAllOwners(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: [{ email: 'a' }, { email: 'b' }]
            });
        });
    });

    describe('addRestaurant', () => {

        it('should handle errors', async () => {
            req.owner = { _id: 'ownerId' };
            req.body = { name: 'Test Restaurant' };
            Restaurant.create.mockRejectedValue(new Error('fail'));
            await restaurantOwnerController.addRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });

    describe('updateOwnerProfile', () => {
        it('should update owner profile with allowed fields', async () => {
            req.owner = { _id: 'ownerId' };
            req.body = { name: 'New Name', email: 'new@email.com', phone: '123', address: 'addr', extra: 'ignore' };
            const updatedOwner = { _id: 'ownerId', name: 'New Name' };
            RestaurantOwner.findByIdAndUpdate.mockResolvedValue(updatedOwner);
            await restaurantOwnerController.updateOwnerProfile(req, res);
            expect(RestaurantOwner.findByIdAndUpdate).toHaveBeenCalledWith(
                'ownerId',
                { name: 'New Name', email: 'new@email.com', phone: '123', address: 'addr' },
                { new: true, runValidators: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: updatedOwner
            });
        });

        it('should handle errors', async () => {
            req.owner = { _id: 'ownerId' };
            req.body = { name: 'New Name' };
            RestaurantOwner.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
            await restaurantOwnerController.updateOwnerProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });

    describe('deleteOwnerAccount', () => {

        it('should handle errors', async () => {
            req.params.id = { id: 'ownerId' };
            Restaurant.find.mockRejectedValue(new Error('fail'));
            await restaurantOwnerController.deleteOwnerAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });

    describe('getOwnerProfile', () => {
        it('should return owner profile with populated restaurants', async () => {
            req.owner = { _id: 'ownerId' };
            const ownerData = { _id: 'ownerId', ownedRestaurants: [{ name: 'Rest' }] };
            const populateMock = jest.fn().mockResolvedValue(ownerData);
            RestaurantOwner.findById.mockReturnValue({ populate: populateMock });
            await restaurantOwnerController.getOwnerProfile(req, res);
            expect(RestaurantOwner.findById).toHaveBeenCalledWith('ownerId');
            expect(populateMock).toHaveBeenCalledWith({
                path: 'ownedRestaurants',
                select: 'name cuisineType rating'
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: ownerData
            });
        });

        it('should handle errors', async () => {
            req.owner = { _id: 'ownerId' };
            const populateMock = jest.fn().mockRejectedValue(new Error('fail'));
            RestaurantOwner.findById.mockReturnValue({ populate: populateMock });
            await restaurantOwnerController.getOwnerProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });

    describe('registerOwner', () => {
        let saveSpy, Restaurant;
        beforeEach(() => {
            saveSpy = jest.spyOn(require('../model/restaurantOwnerModel').prototype, 'save').mockResolvedValue({});
            Restaurant = require('../model/restaurantModel');
            Restaurant.findOne = jest.fn();
            Restaurant.prototype.save = jest.fn().mockResolvedValue({});
        });
        afterEach(() => {
            saveSpy.mockRestore();
        });

        it('should create owner if email does not exist and no restaurant', async () => {
            req.body = { name: 'Owner', email: 'owner@email.com', phone: '123', password: 'pass', govtId: 'id' };
            require('../model/restaurantOwnerModel').findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedpass');
            await restaurantOwnerController.registerOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "Owner Created Successfully" });
        });

        it('should return 400 if owner already exists', async () => {
            req.body = { email: 'owner@email.com' };
            require('../model/restaurantOwnerModel').findOne.mockResolvedValue({ email: 'owner@email.com' });
            await restaurantOwnerController.registerOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Owner Already Exists" });
        });

        it('should create owner and restaurant if restaurant details provided', async () => {
            req.body = {
                name: 'Owner',
                email: 'owner@email.com',
                phone: '123',
                password: 'pass',
                govtId: 'id',
                restaurant: { name: 'Rest', cuisineType: 'type', location: { stop: 'stop', city: 'city' }, contactNumber: '123', openingHours: { open: '08:00', close: '22:00' }, menu: [] }
            };
            require('../model/restaurantOwnerModel').findOne.mockResolvedValue(null);
            Restaurant.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedpass');
            await restaurantOwnerController.registerOwner(req, res);
            expect(Restaurant.findOne).toHaveBeenCalledWith({ name: 'Rest' });
            expect(Restaurant.prototype.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "Owner and Restaurant Created Successfully" });
        });

        it('should return 400 if restaurant name already exists', async () => {
            req.body = {
                name: 'Owner',
                email: 'owner@email.com',
                phone: '123',
                password: 'pass',
                govtId: 'id',
                restaurant: { name: 'Rest' }
            };
            require('../model/restaurantOwnerModel').findOne.mockResolvedValue(null);
            Restaurant.findOne.mockResolvedValue({ name: 'Rest' });
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedpass');
            await restaurantOwnerController.registerOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant name already registered, try new" });
        });

        it('should handle errors', async () => {
            req.body = { email: 'owner@email.com' };
            require('../model/restaurantOwnerModel').findOne.mockRejectedValue(new Error('fail'));
            await restaurantOwnerController.registerOwner(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

});

