const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const {
    getOrderById,
    getOrdersByPnr,
    cancelOrder,
    getRestaurantOrders,
    getAllOrders,
    getActiveOrdersByRestaurant,
    updateOrderStatusById,
    getReadyToPickupOrdersByLocation,
    acceptOrderForDelivery } = require('../controller/orderController');

// Create a new order


// Get order by ID
// router.get('/:id', getOrderById);

// Get orders by PNR
router.get('/pnr/:pnr', getOrdersByPnr);


// Update order status by orderId (generic)
router.patch('/update-status/:orderId', updateOrderStatusById);

// Cancel order (user)
router.patch('/cancel/:id', cancelOrder);

// Get all orders for a restaurant (owner)
router.get('/restaurant/:restaurantId', getRestaurantOrders);

// Get all active (not delivered) orders for a restaurant
router.get('/restaurant/:restaurantId/active', getActiveOrdersByRestaurant);



// Get all orders (admin)
router.get('/', getAllOrders);
// New routes for delivery agent workflow
router.get('/ready-to-pickup', getReadyToPickupOrdersByLocation);

router.post('/accept-order', acceptOrderForDelivery);

module.exports = router;
