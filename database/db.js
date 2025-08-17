const mongoose = require('mongoose');
const dotenv = require('dotenv');


const connectDB = async () => {
    try {
        await mongoose.connect(`mongodb+srv://sandeep0399:Bablu%400399@cluster0.buljbly.mongodb.net/ `);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

module.exports = connectDB;