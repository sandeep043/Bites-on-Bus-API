const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { string } = require('joi');

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
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: { type: String, enum: ['owner'], default: 'owner' }
});



const RestaurantOwner = mongoose.model('RestaurantOwner', restaurantOwnerSchema);
module.exports = RestaurantOwner;