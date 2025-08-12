const express = require('express');
const router = express.Router();
const { getPayment, verifyPayment } = require('../controller/paymentController');

// POST /get-payment
router.post('/get-payment', getPayment);

// POST /verify/:txnid
router.post('/verify/:txnid', verifyPayment);

module.exports = router;
