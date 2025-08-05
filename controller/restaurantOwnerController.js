const RestaurantOwner = require('../models/restaurantOwnerModel');
const Restaurant = require('../models/restaurantModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Helper: Generate JWT Token
const signToken = (id) => {
    return jwt.sign({ id }, "mysecretkey", {
        expiresIn: '1h'
    });
};

// 1. REGISTER OWNER
const registerOwner = async (req, res) => {
    try {
        const { name, email, password, phone, govtId } = req.body;

        // Check if owner exists
        const existingOwner = await RestaurantOwner.findOne({ email });
        if (existingOwner) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Create new owner
        const newOwner = await RestaurantOwner.create({
            name,
            email,
            password,
            phone,
            govtId
        });
        await newOwner.save();
        // Generate token
        const token = signToken(newOwner._id);

        // Remove password from output
        newOwner.password = undefined;

        res.status(201).json({
            status: 'success',
            token,
            data: newOwner
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. LOGIN OWNER
const loginOwner = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email/password exists
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // Check if owner exists
        const owner = await RestaurantOwner.findOne({ email }).select('+password');
        if (!owner || !(await owner.correctPassword(password, owner.password))) {
            return res.status(401).json({ message: "Incorrect email or password" });
        }

        // Generate token
        const token = signToken(owner._id);
        owner.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: owner
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. PROTECT MIDDLEWARE (Add to routes that need auth)
const protect = async (req, res, next) => {
    try {
        // 1) Get token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: "You are not logged in!" });
        }

        // 2) Verify token
        const decoded = jwt.verify(token, "mysecretkey");

        // 3) Check if owner exists
        const currentOwner = await RestaurantOwner.findById(decoded.id);
        if (!currentOwner) {
            return res.status(401).json({ message: "Owner no longer exists" });
        }

        // Grant access
        req.owner = currentOwner;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
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

module.exports = {
    registerOwner,
    loginOwner,
    protect,
    getOwnerProfile,
    updateOwnerProfile,
    deleteOwnerAccount,
    addRestaurant
};