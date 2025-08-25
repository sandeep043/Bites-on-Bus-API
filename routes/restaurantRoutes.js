const express = require('express');
const router = express.Router();
const { addRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant,
    getRestaurantsByLocation,
    addMenuItem,
    deleteMenuItem, updateMenuItemAvailability } = require('../controller/restaurantController')
const authenticate = require('../middleware/authenticate');
const roleMiddleware = require('../middleware/authMiddleware');


router.post('/add', addRestaurant);

router.get('/location', getRestaurantsByLocation)

router.get('/getall', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.post('/:restaurantId/menu', authenticate, roleMiddleware('owner'), addMenuItem);
router.delete('/:restaurantId/menu/:menuItemId', authenticate, roleMiddleware('owner'), deleteMenuItem);
router.patch('/:restaurantId/menu/:menuItemId/availability', updateMenuItemAvailability);


router.put('/update/:id', authenticate, roleMiddleware('admin'), updateRestaurant);
router.delete('/delete/:id', authenticate, deleteRestaurant);

module.exports = router;
