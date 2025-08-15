const express = require('express');
const router = express.Router();
const { registerAgent, loginAgent, getAgentProfile, updateAgentProfile, deleteAgentAccount, updateAgentAvailavelity, getAgentOrdersById, getCompletedDeliveriesByAgentId } = require('../controller/agentController');
const authenticate = require('../middleware/authenticate');
const roleMiddleware = require('../middleware/authMiddleware');

// Register agent
router.post('/register', registerAgent);

// Login agent
router.post('/login', loginAgent);

// Get agent profile (protected)
router.get('/profile', authenticate, roleMiddleware('agent'), getAgentProfile);

// Update agent profile (protected)
router.put('/update', authenticate, roleMiddleware('agent'), updateAgentProfile);

// Delete agent account (protected)
router.delete('/delete', authenticate, roleMiddleware('agent'), deleteAgentAccount);

// Update agent availabelity by agentId (protected)
router.patch('/availabelity/:agentId', updateAgentAvailavelity);

router.get('/orders/:agentId', getAgentOrdersById);

// Get all completed deliveries by agent ID
router.get('/completed-deliveries/:agentId', getCompletedDeliveriesByAgentId);

module.exports = router;