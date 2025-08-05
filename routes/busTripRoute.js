const express = require('express');
const router = express.Router();
const { addBusTrip,
    getAllBusTrips,
    getBusTripById,
    getBusTripByPnr,
    updateBusTrip,
    deleteBusTrip,
    getTripsByBusId } = require('../controller/busTipController')

const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', addBusTrip);

router.get('/getall', authMiddleware, getAllBusTrips);
router.get('/:id', authMiddleware, getBusTripById);
router.get('/by-pnr/:pnr', authMiddleware, getBusTripByPnr);
router.put('/update/:id', authMiddleware, updateBusTrip);
router.delete('/delete/:id', authMiddleware, deleteBusTrip);
router.get('/by-bus/:busId', authMiddleware, getTripsByBusId);

module.exports = router;
