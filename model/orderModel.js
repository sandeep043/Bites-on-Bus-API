const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    stopId: { type: String, required: true },
    items: [{
        foodItemId: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Placed', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'],
        default: 'Placed'
    },
    otp: { type: String, required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    createdAt: { type: Date, default: Date.now },

    isOtpVerified: {
        type: Boolean,
        default: false
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent'
    },
    deliveryStatus: {
        type: String,
        enum: ['pending', 'assigned', 'picked_up', 'delivered', 'cancelled'],
        default: 'pending'
    }
});


const Order = mongoose.model('Order', orderSchema);
module.exports = Order;