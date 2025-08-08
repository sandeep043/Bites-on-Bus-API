const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RestaurantOwner'
    },
    cuisineType: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    contactNumber: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    openingHours: {
        open: { type: String, required: true }, // "08:00"
        close: { type: String, required: true } // "22:00"
    },
    menu: [{
        itemId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        prepTime: { type: Number, required: true }, // in minutes
        dietaryTags: [{ type: String }],
        isAvailable: { type: Boolean, default: true }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
});

restaurantSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Restaurant', restaurantSchema);