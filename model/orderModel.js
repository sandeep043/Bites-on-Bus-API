const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    PNR: { type: mongoose.Schema.Types.ObjectId, ref: 'PNRPassengersDetails', required: true },

    stop: { type: String },
    city: { type: String },
    orderTimeandDate: { type: Date, default: Date.now },
    customerDetails: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        seatNo: { type: String, required: true }
    },
    Orderitems: [{}],

    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Placed', 'Ready', 'Ready to pickup','Picked-up', 'In-transit', 'Delivered', 'Cancelled'],
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
        enum: ['pending', 'Assigned','assigned', 'Picked-up', 'Delivered', 'In-transit', 'Cancelled'],
        default: 'pending'
    },
    deliveryTime: { type: Date }
});


const Order = mongoose.model('Order', orderSchema);
module.exports = Order;