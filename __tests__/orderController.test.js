const orderController = require('../controller/orderController');
const Order = require('../model/orderModel');
const Restaurant = require('../model/restaurantModel');
const mongoose = require('mongoose');

jest.mock('../model/orderModel');
jest.mock('../model/restaurantModel');
jest.mock('mongoose', () => ({
    ...jest.requireActual('mongoose'),
    Types: {
        ObjectId: {
            isValid: jest.fn()
        }
    }
}));

describe('orderController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {}, user: {}, agent: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getOrdersByPnr', () => {
        it('should return orders by pnr', async () => {
            req.params.pnr = 'PNR123';
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ pnr: 'PNR123' }])
            });
            await orderController.getOrdersByPnr(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: 1,
                data: [{ pnr: 'PNR123' }]
            });
        });

        it('should handle errors', async () => {
            req.params.pnr = 'PNR123';
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('fail'))
            });
            await orderController.getOrdersByPnr(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to fetch orders",
                error: expect.any(String)
            });
        });
    });

    describe('cancelOrder', () => {
        it('should cancel order if owner and status is valid', async () => {
            req.params.id = 'orderId';
            req.user = { _id: 'userId' };
            const order = {
                _id: 'orderId',
                passengerId: 'userId',
                status: 'pending',
                save: jest.fn()
            };
            Order.findById.mockResolvedValue(order);
            Order.findByIdAndUpdate.mockResolvedValue({ status: 'cancelled' });
            await orderController.cancelOrder(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: { status: 'cancelled' }
            });
        });

        it('should return 404 if order not found', async () => {
            req.params.id = 'orderId';
            Order.findById.mockResolvedValue(null);
            await orderController.cancelOrder(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
        });

        it('should return 403 if not owner', async () => {
            req.params.id = 'orderId';
            req.user = { _id: 'userId' };
            Order.findById.mockResolvedValue({ passengerId: 'otherId', status: 'pending' });
            await orderController.cancelOrder(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized to cancel this order" });
        });

        it('should return 400 if status not cancellable', async () => {
            req.params.id = 'orderId';
            req.user = { _id: 'userId' };
            Order.findById.mockResolvedValue({ passengerId: 'userId', status: 'preparing' });
            await orderController.cancelOrder(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Cannot cancel order in preparing status"
            });
        });

        it('should handle errors', async () => {
            req.params.id = 'orderId';
            Order.findById.mockRejectedValue(new Error('fail'));
            await orderController.cancelOrder(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to cancel order",
                error: expect.any(String)
            });
        });
    });

    describe('getRestaurantOrders', () => {
        it('should return orders for restaurant if owner', async () => {
            req.params.restaurantId = 'restId';
            req.user = { _id: 'ownerId' };
            Restaurant.findById.mockResolvedValue({ owner: 'ownerId' });
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ restaurantId: 'restId' }])
            });
            await orderController.getRestaurantOrders(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: 1,
                data: [{ restaurantId: 'restId' }]
            });
        });

        it('should return 403 if not owner', async () => {
            req.params.restaurantId = 'restId';
            req.user = { _id: 'ownerId' };
            Restaurant.findById.mockResolvedValue({ owner: 'otherId' });
            await orderController.getRestaurantOrders(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized access" });
        });

        it('should handle errors', async () => {
            req.params.restaurantId = 'restId';
            Restaurant.findById.mockRejectedValue(new Error('fail'));
            await orderController.getRestaurantOrders(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to fetch restaurant orders",
                error: expect.any(String)
            });
        });
    });

    describe('getAllOrders', () => {
        it('should return all orders', async () => {
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ _id: 'orderId' }])
            });
            await orderController.getAllOrders(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: 1,
                data: [{ _id: 'orderId' }]
            });
        });

        it('should handle errors', async () => {
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('fail'))
            });
            await orderController.getAllOrders(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error", error: expect.anything() });
        });
    });

    describe('getActiveOrdersByRestaurant', () => {
        it('should return active orders for restaurant', async () => {
            req.params.restaurantId = 'restId';
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ restaurantId: 'restId', status: 'pending' }])
            });
            await orderController.getActiveOrdersByRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: 1,
                data: [{ restaurantId: 'restId', status: 'pending' }]
            });
        });

        it('should return 400 if restaurantId missing', async () => {
            req.params.restaurantId = undefined;
            await orderController.getActiveOrdersByRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "restaurantId is required" });
        });

        it('should handle errors', async () => {
            req.params.restaurantId = 'restId';
            Order.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('fail'))
            });
            await orderController.getActiveOrdersByRestaurant(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to fetch active orders",
                error: expect.any(String)
            });
        });
    });

    describe('updateOrderStatusById', () => {
        it('should update order status', async () => {
            req.params.orderId = 'orderId';
            req.body.status = 'Delivered';
            const order = { _id: 'orderId', status: 'pending', save: jest.fn() };
            Order.findById.mockResolvedValue(order);
            await orderController.updateOrderStatusById(req, res);
            expect(order.status).toBe('Delivered');
            expect(order.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: order
            });
        });

        it('should return 400 if missing params', async () => {
            req.params.orderId = undefined;
            req.body.status = undefined;
            await orderController.updateOrderStatusById(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "orderId and status are required" });
        });

        it('should return 404 if order not found', async () => {
            req.params.orderId = 'orderId';
            req.body.status = 'Delivered';
            Order.findById.mockResolvedValue(null);
            await orderController.updateOrderStatusById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
        });

        it('should handle errors', async () => {
            req.params.orderId = 'orderId';
            req.body.status = 'Delivered';
            Order.findById.mockRejectedValue(new Error('fail'));
            await orderController.updateOrderStatusById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to update order status",
                error: expect.any(String)
            });
        });
    });

    describe('getReadyToPickupOrdersByLocation', () => {
        it('should return ready to pickup orders for location', async () => {
            req.query = { stop: 'stop', city: 'city' };
            Order.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([{ stop: 'stop', city: 'city', status: 'Ready' }])
            });
            await orderController.getReadyToPickupOrdersByLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: 1,
                data: [{ stop: 'stop', city: 'city', status: 'Ready' }]
            });
        });

        it('should return 400 if stop or city missing', async () => {
            req.query = { stop: '', city: '' };
            await orderController.getReadyToPickupOrdersByLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "stop and city are required" });
        });

        it('should handle errors', async () => {
            req.query = { stop: 'stop', city: 'city' };
            Order.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('fail'))
            });
            await orderController.getReadyToPickupOrdersByLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch ready to pickup orders" });
        });
    });

    describe('acceptOrderForDelivery', () => {
        it('should assign order to agent', async () => {
            req.body = { orderId: 'orderId', agentId: 'agentId' };
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            const order = { _id: 'orderId', deliveryStatus: 'pending', status: 'Ready to pickup', save: jest.fn() };
            Order.findById.mockResolvedValue(order);
            await orderController.acceptOrderForDelivery(req, res);
            expect(order.agentId).toBe('agentId');
            expect(order.deliveryStatus).toBe('Assigned');
            expect(order.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Order assigned to agent',
                data: order
            });
        });

        it('should return 400 if missing params or invalid id', async () => {
            req.body = { orderId: undefined, agentId: undefined };
            mongoose.Types.ObjectId.isValid.mockReturnValue(false);
            await orderController.acceptOrderForDelivery(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Valid orderId and agentId are required" });
        });

        it('should return 404 if order not found', async () => {
            req.body = { orderId: 'orderId', agentId: 'agentId' };
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Order.findById.mockResolvedValue(null);
            await orderController.acceptOrderForDelivery(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
        });

        it('should handle errors', async () => {
            req.body = { orderId: 'orderId', agentId: 'agentId' };
            mongoose.Types.ObjectId.isValid.mockReturnValue(true);
            Order.findById.mockRejectedValue(new Error('fail'));
            await orderController.acceptOrderForDelivery(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to accept order for delivery",
                error: expect.any(String)
            });
        });
    });

    describe('getOrderDetailsById', () => {
        it('should return order details by id', async () => {
            req.params.orderId = 'orderId';
            // Mock the chain: Order.findById().populate().populate().then(...)
            const mockPopulate2 = jest.fn().mockResolvedValue({ _id: 'orderId' });
            const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
            Order.findById.mockReturnValue({ populate: mockPopulate1 });
            await orderController.getOrderDetailsById(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: { _id: 'orderId' }
            });
        });

        it('should return 400 if orderId missing', async () => {
            req.params.orderId = undefined;
            await orderController.getOrderDetailsById(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "orderId is required" });
        });



        it('should handle errors', async () => {
            req.params.orderId = 'orderId';
            const mockPopulate = jest.fn().mockReturnThis();
            const mockRejectedValue = jest.fn().mockRejectedValue(new Error('fail'));
            Order.findById.mockReturnValue({
                populate: mockPopulate,
                populate: function () { return { mockRejectedValue }; }
            });
            await orderController.getOrderDetailsById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to fetch order details",
                error: expect.any(String)
            });
        });
    });
});
        