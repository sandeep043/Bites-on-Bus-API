const express = require('express');
const router = express.Router();
const { registerAgent, loginAgent, getAgentProfile, updateAgentProfile, deleteAgentAccount } = require('../controller/agentController');
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

module.exports = router;