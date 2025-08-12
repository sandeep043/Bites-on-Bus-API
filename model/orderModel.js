const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    PNR: { type: mongoose.Schema.Types.ObjectId, ref: 'PNRPassengersDetails', type: String, required: true },
    DeliveryLocation: {
        stop: { type: String, required: true },
        city: { type: String, required: true }
    },
    orderTimeandDate: { type: Date, default: Date.now },
    customerDetails: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        PNR: { type: String, required: true },
        seatNo: { type: String, required: true }
    },
    Orderitems: [{
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
    otp: { type: String },
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