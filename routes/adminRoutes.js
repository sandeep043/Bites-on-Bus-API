const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin } = require('../controller/adminController');
const authenticate = require('../middleware/authenticate');
const roleMiddleware = require('../middleware/authMiddleware');
const { getAllOwners } = require('../controller/restaurantOwnerController');
const { getAllAgents } = require('../controller/agentController');
const { getAllUsers } = require('../controller/userController');
const { getAllRestaurants } = require('../controller/restaurantController');
const { getAllOrders } = require('../controller/orderController');
const { registerOwner } = require('../controller/restaurantOwnerController');
const { registerAgent } = require('../controller/agentController');

// Register admin
router.post('/register', registerAdmin);

// Login admin
router.post('/login', loginAdmin);
router.get('/restaurants', getAllRestaurants);

// Get all admins (protected, admin only)
router.get('/', authenticate, roleMiddleware('admin'), getAllAdmins);

// Get admin by ID (protected, admin only)
router.get('/:id', authenticate, roleMiddleware('admin'), getAdminById);

// Update admin (protected, admin only)
router.put('/:id', authenticate, roleMiddleware('admin'), updateAdmin);

// Delete admin (protected, admin only)
router.delete('/:id', authenticate, roleMiddleware('admin'), deleteAdmin);




// Add any additional admin-specific routes here

//get all agents (protected, admin only)
router.get('/agents', authenticate, roleMiddleware('admin'), getAllAgents);

//get all users (protected, admin only)
router.get('/users', authenticate, roleMiddleware('admin'), getAllUsers);

//get all restaurantowners (protected, admin only)
router.get('/owners', authenticate, roleMiddleware('admin'), getAllOwners);

//get all restaurants (protected, admin only)
//router.get('/restaurants', authenticate, roleMiddleware('admin'), getAllRestaurants);


//get all orders (protected, admin only)
router.get('/orders', authenticate, roleMiddleware('admin'), getAllOrders);


//register owner  
// router.post('/register-owner', authenticate, roleMiddleware('admin'), registerOwner);
router.post('/register-owner', registerOwner);

//register agent
// router.post('/register-agent', authenticate, roleMiddleware('admin'), registerAgent);
router.post('/register-agent', registerAgent);





module.exports = router;
