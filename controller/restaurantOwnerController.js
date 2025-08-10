const RestaurantOwner = require('../model/restaurantOwnerModel'); // Fix import path

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Helper: Generate JWT Token
const signToken = (id) => {
    // Accepts owner object, returns JWT with role
    return jwt.sign({ id: id._id || id, role: id.role || 'owner' }, "mysecretkey", {
        expiresIn: '1h'
    });
};

// 1. REGISTER OWNER
const registerOwner = async (req, res) => {
    try {
        const { name, email, phone, password, govtId, restaurant } = req.body;
        // Check if owner email already exists
        const existingOwner = await RestaurantOwner.findOne({ email });
        if (existingOwner) {
            return res.status(400).json({ message: "Owner Already Exists" });
        }
        // Create owner first (without ownedRestaurant)
        const owner = new RestaurantOwner({ name, email, phone, password, govtId });
        await owner.save();
        let restaurantId = null;
        // Create restaurant if restaurant details provided
        if (restaurant) {
            const Restaurant = require('../model/restaurantModel');
            // Check if restaurant name already exists
            const existingRestaurant = await Restaurant.findOne({ name: restaurant.name });
            if (existingRestaurant) {
                return res.status(400).json({ message: "Restaurant name already registered, try new" });
            }
            // Create restaurant and link owner
            const newRestaurant = new Restaurant({
                ...restaurant,
                owner: owner._id
            });
            await newRestaurant.save();
            restaurantId = newRestaurant._id;
            // Update owner with ownedRestaurant
            owner.ownedRestaurant = restaurantId;
            await owner.save();
        }
        res.status(201).json({ message: restaurant ? "Owner and Restaurant Created Successfully" : "Owner Created Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};
const addOwner = async (req, res) => {
    try {
        const ownerData = req.body;
        const existingOwner = await RestaurantOwner.findOne({ email: ownerData.email });
        if (existingOwner) {
            return res.status(400).json({ message: "owner Already Exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ownerData.password, salt);

        ownerData.password = hashedPassword;
        const Owner = new RestaurantOwner(ownerData);
        await Owner.save();
        res.status(201).json({ message: "User Created Successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


//2. LOGIN OWNER
const loginOwner = async (req, res) => {
    try {
        const { email, password } = req.body;
        const owner = await RestaurantOwner.findOne({ email });
        if (!owner) {
            return res.status(401).json({ message: 'Invalid email' });
        }

        const isMatch = await bcrypt.compare(password, owner.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: owner._id, email: owner.email, role: owner.role },
            "mysecretkey",
            { expiresIn: '1h' }
        );
        res.status(200).json({
            message: 'login successful',
            token: token,
            owner: owner
        });
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.message });
    }
};



// 4. GET OWNER PROFILE
const getOwnerProfile = async (req, res) => {
    try {
        const owner = await RestaurantOwner.findById(req.owner._id)
            .populate({
                path: 'ownedRestaurants',
                select: 'name cuisineType rating'
            });

        res.status(200).json({
            status: 'success',
            data: owner
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. UPDATE OWNER PROFILE
const updateOwnerProfile = async (req, res) => {
    try {
        // Filter unwanted fields
        const filteredBody = {};
        const allowedFields = ['name', 'email', 'phone', 'address'];
        Object.keys(req.body).forEach(el => {
            if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
        });

        const updatedOwner = await RestaurantOwner.findByIdAndUpdate(
            req.owner._id,
            filteredBody,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            data: updatedOwner
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. DELETE OWNER ACCOUNT
const deleteOwnerAccount = async (req, res) => {
    try {
        // 1) Find all restaurants owned by this user
        const restaurants = await Restaurant.find({ owner: req.owner._id });

        // 2) Mark restaurants as inactive
        await Restaurant.updateMany(
            { owner: req.owner._id },
            { isActive: false }
        );

        // 3) Delete owner account
        await RestaurantOwner.findByIdAndDelete(req.owner._id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. ADD NEW RESTAURANT (Owner Only)
const addRestaurant = async (req, res) => {
    try {
        // Attach owner ID from protected route
        req.body.owner = req.owner._id;

        const newRestaurant = await Restaurant.create(req.body);

        // Update owner's restaurants array
        await RestaurantOwner.findByIdAndUpdate(
            req.owner._id,
            { $push: { ownedRestaurants: newRestaurant._id } }
        );

        res.status(201).json({
            status: 'success',
            data: newRestaurant
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// 8. GET ALL OWNERS 
const getAllOwners = async (req, res) => {
    try {
        const owners = await RestaurantOwner.find();
        res.status(200).json({
            status: 'success',
            data: owners
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerOwner,
    loginOwner,
    getOwnerProfile,
    updateOwnerProfile,
    deleteOwnerAccount,
    addRestaurant,
    addOwner,
    getAllOwners
};