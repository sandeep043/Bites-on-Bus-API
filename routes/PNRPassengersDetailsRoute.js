const express = require('express');
const router = express.Router();
const { getAllPNRPassengersDetails, getPNRPassengersDetailsByPNR, createPNRPassengerDetail, updatePNRPassengerDetail, deletePNRPassengerDetail } = require('../controller/PNRPassengersDetailsController');

// Fetch all passenger details
router.get('/', getAllPNRPassengersDetails);

// Fetch passenger details by PNR
router.get('/:pnr', getPNRPassengersDetailsByPNR);

// Create new passenger detail
router.post('/', createPNRPassengerDetail);

// Update passenger detail by PNR
router.put('/:pnr', updatePNRPassengerDetail);

// Delete passenger detail by PNR
router.delete('/:pnr', deletePNRPassengerDetail);

module.exports = router;
