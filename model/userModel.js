const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    loyaltyPoints: { type: Number, default: 0 },
    orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    createdAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['user'], default: 'user' }
});


const User = mongoose.model('User', userSchema);
module.exports = User;