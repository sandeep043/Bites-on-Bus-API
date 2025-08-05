const mongoose = require('mongoose');

const busDetailsSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true
    },
    busType: {
        type: String,
        enum: ['AC', 'Non-AC', 'Sleeper', 'Seater'],
        required: true
    },
    operator: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    totalSeats: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const BusDetails = mongoose.model('BusDetails', busDetailsSchema);
module.exports = BusDetails;