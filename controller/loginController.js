
const User = require('../model/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const login = async (req, res) => {
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
            { id: user._id, email: user.emailId },
            "mysecretkey",
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: 'login successful', token: token });


    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.message });
    }
};

module.exports = {
    login
};