const express = require('express');
const router = express.Router();
const {
    registerOwner,
    loginOwner,
    getOwnerProfile,
    updateOwnerProfile,
    deleteOwnerAccount,
    addRestaurant, addOwner
} = require('../controller/restaurantOwnerController');
const authenticate = require('../middleware/authenticate');
const roleMiddleware = require('../middleware/authMiddleware');

// Register owner
router.post('/register', addOwner);

// Login owner
router.post('/login', loginOwner);

// Protected routes (require authentication and owner role)
router.get('/profile', authenticate, roleMiddleware('owner'), getOwnerProfile);
router.put('/update', authenticate, roleMiddleware('owner'), updateOwnerProfile);
router.delete('/delete', authenticate, roleMiddleware('owner'), deleteOwnerAccount);

// Add new restaurant (owner only)
router.post('/add-restaurant', authenticate, roleMiddleware('owner'), addRestaurant);

module.exports = router;
