const mongoose = require('mongoose');

const pnrPassengerSchema = new mongoose.Schema({
    pnr: {
        type: String,
        required: true,
        unique: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusDetails',
    },
    passengers: [{
        passengerId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        age: {
            type: Number,
            required: true
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other']
        },
        seatNumber: {
            type: String,
            required: true
        },
        fare: {
            type: Number,
            required: true
        }
    }],
    journeyDate: {
        type: Date,
        required: true
    },
    bookingStatus: {
        type: String,
        enum: ['Confirmed', 'Cancelled', 'Pending'],
        default: 'Confirmed'
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusDetails',
        required: true
    },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    stops: [{
        stopId: { type: String, required: true },
        name: { type: String, required: true },
        location: { type: String, required: true },
        estimatedArrival: { type: Date, required: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const PNRPassengerDetails = mongoose.model('PNRPassengerDetails', pnrPassengerSchema);
module.exports = PNRPassengerDetails;