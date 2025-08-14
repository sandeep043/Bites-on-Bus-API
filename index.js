const express = require("express");
require("colors")
require("dotenv").config({
    path: './.env'
})
const connectDB = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const restaurantOwnerRoutes = require('./routes/restaurantOwnerRoutes');
const agentRoutes = require('./routes/agentRoute');
const adminRoutes = require('./routes/adminRoutes');
const PNRPassengersDetailsRoute = require('./routes/PNRPassengersDetailsRoute');
const paymentRoutes = require('./routes/paymentRoute');
const orderRoutes = require('./routes/orderRoute');



const restaurantRoutes = require('./routes/restaurantRoutes');
const busTripRoutes = require('./routes/busTripRoute');
const cors = require('cors');
const path = require('path');


// connect to mongoDB
connectDB();

const app = express();
app.use(express.json());


app.use(cors({
    origin: '*', // Allow all origins
    credentials: true
}));









// //middleware

// //routes  


app.use('/api/user', userRoutes);
app.use('/api/owner', restaurantOwnerRoutes);
app.use('/api/restaurant', restaurantRoutes)
app.use('/api/busTrip', busTripRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pnr', PNRPassengersDetailsRoute);
app.use('/api/payment', paymentRoutes);
app.use('/api/order', orderRoutes);




app.listen(4000, () => {
    console.log(`Server is running on port ${4000}`);
}); 
