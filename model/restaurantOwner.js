const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const restaurantOwnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    govtId: {
        type: String,
        required: true
    },
    ownedRestaurants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Password hashing middleware
restaurantOwnerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Password verification method
restaurantOwnerSchema.methods.correctPassword = async function (
    candidatePassword,
    ownerPassword
) {
    return await bcrypt.compare(candidatePassword, ownerPassword);
};

const RestaurantOwner = mongoose.model('RestaurantOwner', restaurantOwnerSchema);
module.exports = RestaurantOwner;