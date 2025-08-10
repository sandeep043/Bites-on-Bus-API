const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { string, ref } = require('joi');

const restaurantOwnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    govtId: {
        type: String,
        required: true
    },
    ownedRestaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: { type: String, enum: ['owner'], default: 'owner' }
});



const RestaurantOwner = mongoose.model('RestaurantOwner', restaurantOwnerSchema);
module.exports = RestaurantOwner;