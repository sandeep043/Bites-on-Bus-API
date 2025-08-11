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

const deleteMenuItem = async (req, res) => {
    try {
        const { restaurantId, menuItemId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        // Remove menu item by its _id
        const restaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            { $pull: { menu: { _id: menuItemId } } },
            { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant Not Found" });
        }

        res.status(200).json({ message: "Menu item deleted successfully", restaurant });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

const getAllRestaurants = async (req, res) => {
    try {
        //include owner details in response 
        const restaurants = await Restaurant.find().populate('owner', 'name email phone');
        if (!restaurants || restaurants.length === 0) {
            return res.status(404).json({ message: "No Restaurants Found" });
        }
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

const addMenuItem = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const menuItem = req.body;
        if (!restaurantId) {
            return res.status(400).json({ message: "Restaurant ID is required" });
        }
        // Validate restaurantId



        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        // Validate required menu item fields
        const requiredFields = ['name', 'price', 'prepTime'];
        for (const field of requiredFields) {
            if (!menuItem[field]) {
                return res.status(400).json({ message: `Menu item ${field} is required` });
            }
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            { $push: { menu: menuItem } },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant Not Found" });
        }

        res.status(200).json({ message: "Menu item added successfully", restaurant });
    } catch (error) {
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

const getRestaurantsByLocation = async (req, res) => {
    try {
        const { stop, city } = req.query;
        if (!stop || !city) {
            return res.status(400).json({ message: "Stop and city are required" });
        }

        const restaurants = await Restaurant.find({
            'location.stop': stop,
            'location.city': city,
            isActive: true
        }).populate('owner', 'name email phone');

        if (!restaurants || restaurants.length === 0) {
            return res.status(404).json({ message: "No Restaurants Found for the given location" });
        }

        res.status(200).json({ restaurants });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

const updateMenuItemAvailability = async (req, res) => {
    try {
        const { restaurantId, menuItemId } = req.params;
        if (!restaurantId || !menuItemId) {
            return res.status(400).json({ message: "Missing restaurantId or menuItemId" });
        }
        if (!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(menuItemId)) {
            return res.status(400).json({ message: "Invalid Restaurant or Menu Item ID" });
        }
        const { isAvailable } = req.body;

        if (!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(menuItemId)) {
            return res.status(400).json({ message: "Invalid Restaurant or Menu Item ID" });
        }

        // Find the restaurant and update the menu item's isAvailable field
        const restaurant = await Restaurant.findOneAndUpdate(
            { _id: restaurantId, "menu._id": menuItemId },
            { $set: { "menu.$.isAvailable": isAvailable } },
            { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant or Menu Item Not Found" });
        }

        res.status(200).json({ message: "Menu item availability updated successfully", restaurant });
    } catch (error) {
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
    getNearbyRestaurants,
    getRestaurantsByLocation,
    addMenuItem,
    deleteMenuItem,
    updateMenuItemAvailability
};