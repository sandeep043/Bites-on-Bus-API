const User = require('../model/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const addUser = async (req, res) => {
    try {
        const userData = req.body;
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(400).json({ message: "User Already Exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        userData.password = hashedPassword;
        const user = new User(userData);
        await user.save();
        res.status(201).json({ message: "User Created Successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};




const getAllUsers = async (req, res) => {

    try {
        const users = await User.find();
        res.status(200).json({ users: users });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error: error });
    }


}


const getUserById = async (req, res) => {
    try {

        const userId = req.params.id;
        const user = await User.findById({ _id: userId });

        if (!user) {
            res.status(404).json({ message: "User Not Found" });
        }
        else {
            res.status(200).json({ user: user });

        }


    }
    catch {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error: error });
    }
};


const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updatedData = req.body;
        const user = await User.findByIdAndUpdate({ _id: userId }, updatedData, { new: true });
        if (!user) {
            res.status(404).json({ message: "User Not Found" });
        }
        else {
            res.status(200).json({ user: user });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error: error });
    }
};


const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndDelete({ _id: userId });
        if (!user) {
            res.status(404).json({ message: "User Not Found" });
        }
        else {
            res.status(200).json({ user: user });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error: error });
    }

}







const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            "mysecretkey",
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: 'login successful', token: token, user: user });
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.message });
    }
};

module.exports = {
    addUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser
}