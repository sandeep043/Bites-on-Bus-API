const Admin = require('../model/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new admin
const registerAdmin = async (req, res) => {
    try {
        const adminData = req.body;
        const existingAdmin = await Admin.findOne({ email: adminData.email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin Already Exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);
        adminData.password = hashedPassword;
        const admin = new Admin(adminData);
        await admin.save();
        res.status(201).json({ message: "Admin Created Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Get all admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find();
        res.status(200).json({ admins });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Get admin by ID
const getAdminById = async (req, res) => {
    try {
        const adminId = req.params.id;
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: "Admin Not Found" });
        }
        res.status(200).json({ admin });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Update admin
const updateAdmin = async (req, res) => {
    try {
        const adminId = req.params.id;
        const updatedData = req.body;
        const admin = await Admin.findByIdAndUpdate(adminId, updatedData, { new: true });
        if (!admin) {
            return res.status(404).json({ message: "Admin Not Found" });
        }
        res.status(200).json({ admin });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Delete admin
const deleteAdmin = async (req, res) => {
    try {
        const adminId = req.params.id;
        const admin = await Admin.findByIdAndDelete(adminId);
        if (!admin) {
            return res.status(404).json({ message: "Admin Not Found" });
        }
        res.status(200).json({ admin });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) {
            return res.status(401).json({ message: 'Invalid email' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            "mysecretkey",
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: 'login successful', token, admin });
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.message });
    }
};

module.exports = {
    registerAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    loginAdmin
};
