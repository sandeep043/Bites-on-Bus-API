const express = require('express');
const router = express.Router();
const { addUser, getAllUsers, getUserById, updateUser, deleteUser, loginUser } = require('../controller/userController');
const authenticate = require('../middleware/authenticate');
const roleMiddleware = require('../middleware/authMiddleware');


router.post('/register', addUser);
router.post('/login', loginUser);

router.get('/getall', authenticate, roleMiddleware('user'), getAllUsers);
router.get('/:id', authenticate, roleMiddleware('user'), getUserById);
router.put('/update/:id', authenticate, roleMiddleware('user'), updateUser);
router.delete('/delete/:id', authenticate, roleMiddleware('user'), deleteUser);

module.exports = router;
