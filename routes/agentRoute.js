const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

// Public routes
router.post('/register', agentController.registerAgent);
router.post('/login', agentController.loginAgent);

// Protected routes
router.use(agentController.protect);

router.get('/me', agentController.getAgentProfile);
router.patch('/location', agentController.updateAgentLocation);
router.patch('/availability', agentController.updateAvailability);
router.get('/orders', agentController.getAssignedOrders);
router.patch('/orders/:id/status', agentController.updateOrderStatus);

module.exports = router;