const restaurantController = require('../controller/restaurantController');
const Restaurant = require('../model/restaurantModel');
const mongoose = require('mongoose');

jest.mock('../model/restaurantModel');
jest.mock('mongoose', () => ({
    ...jest.requireActual('mongoose'),
    Types: {
        ObjectId: {
            isValid: jest.fn()
        }
    }
}));

describe('restaurantController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('addRestaurant', () => {
        it('should create restaurant if location coordinates are present', async () => {
            req.body = { name: 'Rest', location: { coordinates: [1, 2] } };
            Restaurant.prototype.save = jest.fn().mockResolvedValue({});
            await restaurantController.addRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant Created Successfully", restaurant: expect.any(Object) });
        });

        it('should return 400 if location coordinates missing', async () => {
            req.body = { name: 'Rest', location: {} };
            await restaurantController.addRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Location coordinates are required" });
        });

        it('should handle errors', async () => {
            req.body = { name: 'Rest', location: { coordinates: [1, 2] } };
            Restaurant.prototype.save = jest.fn().mockRejectedValue(new Error('fail'));
            await restaurantController.addRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('getAllRestaurants', () => {
        it('should return all restaurants', async () => {
            Restaurant.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([{ name: 'Rest' }]) });
            await restaurantController.getAllRestaurants(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ restaurants: [{ name: 'Rest' }] });
        });

        it('should return 404 if no restaurants found', async () => {
            Restaurant.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });
            await restaurantController.getAllRestaurants(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No Restaurants Found" });
        });

        it('should handle errors', async () => {
            Restaurant.find.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error('fail')) });
            await restaurantController.getAllRestaurants(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('getRestaurantById', () => {
        it('should return restaurant if found', async () => {
            req.params.id = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findById.mockResolvedValue({ name: 'Rest' });
            await restaurantController.getRestaurantById(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ restaurant: { name: 'Rest' } });
        });

        it('should return 400 for invalid id', async () => {
            req.params.id = 'badId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await restaurantController.getRestaurantById(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid Restaurant ID" });
        });

        it('should return 404 if not found', async () => {
            req.params.id = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findById.mockResolvedValue(null);
            await restaurantController.getRestaurantById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant Not Found" });
        });

        it('should handle errors', async () => {
            req.params.id = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findById.mockRejectedValue(new Error('fail'));
            await restaurantController.getRestaurantById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('updateRestaurant', () => {
        it('should update restaurant if found', async () => {
            req.params.id = 'restId';
            req.body = { name: 'Updated' };
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });
            await restaurantController.updateRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant Updated Successfully", restaurant: { name: 'Updated' } });
        });

        it('should return 400 for invalid id', async () => {
            req.params.id = 'badId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await restaurantController.updateRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid Restaurant ID" });
        });

        it('should return 404 if not found', async () => {
            req.params.id = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndUpdate.mockResolvedValue(null);
            await restaurantController.updateRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant Not Found" });
        });

        it('should handle errors', async () => {
            req.params.id = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
            await restaurantController.updateRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('deleteRestaurant', () => {
        it('should delete restaurant if found', async () => {
            req.params.id = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndDelete.mockResolvedValue({ name: 'Rest' });
            await restaurantController.deleteRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant Deleted Successfully" });
        });

        it('should return 400 for invalid id', async () => {
            req.params.id = 'badId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await restaurantController.deleteRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid Restaurant ID" });
        });

        it('should return 404 if not found', async () => {
            req.params.id = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndDelete.mockResolvedValue(null);
            await restaurantController.deleteRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant Not Found" });
        });

        it('should handle errors', async () => {
            req.params.id = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndDelete.mockRejectedValue(new Error('fail'));
            await restaurantController.deleteRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('getRestaurantsByLocation', () => {
        it('should return restaurants for valid stop and city', async () => {
            req.query = { stop: 'stop', city: 'city' };
            Restaurant.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([{ name: 'Rest' }]) });
            await restaurantController.getRestaurantsByLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ restaurants: [{ name: 'Rest' }] });
        });

        it('should return 400 if stop or city missing', async () => {
            req.query = { stop: '', city: '' };
            await restaurantController.getRestaurantsByLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Stop and city are required" });
        });

        it('should return 404 if no restaurants found', async () => {
            req.query = { stop: 'stop', city: 'city' };
            Restaurant.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });
            await restaurantController.getRestaurantsByLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No Restaurants Found for the given location" });
        });

        it('should handle errors', async () => {
            req.query = { stop: 'stop', city: 'city' };
            Restaurant.find.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error('fail')) });
            await restaurantController.getRestaurantsByLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('addMenuItem', () => {
        it('should add menu item if valid', async () => {
            req.params.restaurantId = 'restId';
            req.body = { name: 'Item', price: 10, prepTime: 5 };
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndUpdate.mockResolvedValue({ menu: [{ name: 'Item' }] });
            await restaurantController.addMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Menu item added successfully", restaurant: { menu: [{ name: 'Item' }] } });
        });

        it('should return 400 if restaurantId missing', async () => {
            req.params.restaurantId = undefined;
            await restaurantController.addMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant ID is required" });
        });

        it('should return 400 for invalid id', async () => {
            req.params.restaurantId = 'badId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await restaurantController.addMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid Restaurant ID" });
        });

        it('should return 400 if required fields missing', async () => {
            req.params.restaurantId = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            req.body = { price: 10, prepTime: 5 };
            await restaurantController.addMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Menu item name is required" });
        });

        it('should return 404 if restaurant not found', async () => {
            req.params.restaurantId = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            req.body = { name: 'Item', price: 10, prepTime: 5 };
            Restaurant.findByIdAndUpdate.mockResolvedValue(null);
            await restaurantController.addMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant Not Found" });
        });

        it('should handle errors', async () => {
            req.params.restaurantId = 'restId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            req.body = { name: 'Item', price: 10, prepTime: 5 };
            Restaurant.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
            await restaurantController.addMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('deleteMenuItem', () => {
        it('should delete menu item if valid', async () => {
            req.params.restaurantId = 'restId';
            req.params.menuItemId = 'itemId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndUpdate.mockResolvedValue({ menu: [] });
            await restaurantController.deleteMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Menu item deleted successfully", restaurant: { menu: [] } });
        });

        it('should return 400 for invalid restaurantId', async () => {
            req.params.restaurantId = 'badId';
            req.params.menuItemId = 'itemId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await restaurantController.deleteMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid Restaurant ID" });
        });

        it('should return 404 if restaurant not found', async () => {
            req.params.restaurantId = 'restId';
            req.params.menuItemId = 'itemId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndUpdate.mockResolvedValue(null);
            await restaurantController.deleteMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant Not Found" });
        });

        it('should handle errors', async () => {
            req.params.restaurantId = 'restId';
            req.params.menuItemId = 'itemId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
            await restaurantController.deleteMenuItem(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('updateMenuItemAvailability', () => {
        it('should update menu item availability if valid', async () => {
            req.params.restaurantId = 'restId';
            req.params.menuItemId = 'itemId';
            req.body = { isAvailable: true };
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findOneAndUpdate.mockResolvedValue({ menu: [{ _id: 'itemId', isAvailable: true }] });
            await restaurantController.updateMenuItemAvailability(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Menu item availability updated successfully", restaurant: { menu: [{ _id: 'itemId', isAvailable: true }] } });
        });

        it('should return 400 if missing params', async () => {
            req.params.restaurantId = undefined;
            req.params.menuItemId = undefined;
            await restaurantController.updateMenuItemAvailability(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Missing restaurantId or menuItemId" });
        });

        it('should return 400 for invalid ids', async () => {
            req.params.restaurantId = 'badId';
            req.params.menuItemId = 'badId';
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await restaurantController.updateMenuItemAvailability(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid Restaurant or Menu Item ID" });
        });

        it('should return 404 if not found', async () => {
            req.params.restaurantId = 'restId';
            req.params.menuItemId = 'itemId';
            req.body = { isAvailable: true };
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findOneAndUpdate.mockResolvedValue(null);
            await restaurantController.updateMenuItemAvailability(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant or Menu Item Not Found" });
        });

        it('should handle errors', async () => {
            req.params.restaurantId = 'restId';
            req.params.menuItemId = 'itemId';
            req.body = { isAvailable: true };
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Restaurant.findOneAndUpdate.mockRejectedValue(new Error('fail'));
            await restaurantController.updateMenuItemAvailability(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });
});
