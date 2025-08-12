const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    txnid: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    productinfo: { type: String },
    firstname: { type: String },
    email: { type: String },
    phone: { type: String },
    status: { type: String },
    mode: { type: String },
    error_Message: { type: String },
    addedon: { type: Date },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
