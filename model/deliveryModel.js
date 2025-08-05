const mongoose = require('mongoose');


const deliverySchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    agentId: { type: String, required: true },
    status: {
        type: String,
        enum: ['Assigned', 'Dispatched', 'Delivered', 'Failed'],
        default: 'Assigned'
    },
    otpVerified: { type: Boolean, default: false },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date }
});

const Delivery = mongoose.model('Delivery', deliverySchema);
module.exports = Delivery;