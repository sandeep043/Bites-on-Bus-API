const Restaurant = require('../model/restaurantModel');
const mongoose = require('mongoose');

const addRestaurant = async (req, res) => {
    try {
        const restaurantData = req.body;

        // Validate location coordinates
        if (!restaurantData.location || !restaurantData.location.coordinates) {
            return res.status(400).json({ message: "Location coordinates are required" });
        }

        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();
        res.status(201).json({ message: "Restaurant Created Successfully", restaurant });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.status(200).json({ restaurants });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

const getRestaurantById = async (req, res) => {
    try {
        const restaurantId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant Not Found" });
        }

        res.status(200).json({ restaurant });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

const updateRestaurant = async (req, res) => {
    try {
        const restaurantId = req.params.id;
        const updatedData = req.body;

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            updatedData,
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant Not Found" });
        }

        res.status(200).json({ message: "Restaurant Updated Successfully", restaurant });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

const deleteRestaurant = async (req, res) => {
    try {
        const restaurantId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        const restaurant = await Restaurant.findByIdAndDelete(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant Not Found" });
        }

        res.status(200).json({ message: "Restaurant Deleted Successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Additional specialized controller for geo queries
const getNearbyRestaurants = async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 5000 } = req.query; // default 5km radius

        if (!longitude || !latitude) {
            return res.status(400).json({ message: "Longitude and latitude are required" });
        }

        const restaurants = await Restaurant.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        });

        res.status(200).json({ restaurants });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

module.exports = {
    addRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant,
    getNearbyRestaurants
};