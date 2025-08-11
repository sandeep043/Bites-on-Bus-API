const express = require('express');
const router = express.Router();
const { addRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant,
    getRestaurantsByLocation } = require('../controller/restaurantController')

const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', addRestaurant);

router.get('/location', getRestaurantsByLocation)

router.get('/getall', authMiddleware, getAllRestaurants);
router.get('/:id', getRestaurantById);
router.put('/update/:id', authMiddleware, updateRestaurant);
router.delete('/delete/:id', authMiddleware, deleteRestaurant);

module.exports = router;
