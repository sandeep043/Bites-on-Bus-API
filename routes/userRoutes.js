const express = require('express');
const router = express.Router();
const { addUser, getAllUsers, getUserById, updateUser, deleteUser } = require('../controller/userController')

const authMiddleware = require('../middleware/authMiddleware');

router.post('/resgister', addUser);

router.get('/getall', authMiddleware, getAllUsers);
router.get('/:id', authMiddleware, getUserById);
router.put('/update/:id', authMiddleware, updateUser);
router.delete('/delete/:id', authMiddleware, deleteUser);

module.exports = router;
