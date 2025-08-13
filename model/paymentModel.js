const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    txnid: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productinfo: { type: String },
    firstname: { type: String },
    email: { type: String },
    phone: { type: String },
    status: { type: String },
    mode: { type: String },
    error_Message: { type: String },
    orderItems: [{}],
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'restaurant' },
    addedon: { type: Date },
    orderTimeandDate: { type: Date },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
