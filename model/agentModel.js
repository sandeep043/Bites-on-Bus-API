const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    idNumber: {
        type: String,
        required: true
    },
    vehicleType: {
        type: String,
        enum: ['motorcycle', 'eBike', 'Scooter'],
        required: true
    },
    licensePlate: { type: String, required: true },
    zone: {
        stop: { type: String, required: true },
        city: { type: String, required: true }
    },
    // Add other agent-specific fields here
    createdAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['agent'], default: 'agent' }
});

const Agent = mongoose.model('Agent', agentSchema);
module.exports = Agent;
