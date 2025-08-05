const express = require("express");
const dotenv = require('dotenv');
const connectDB = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const login = require('./routes/login');
const restaurantRoutes = require('./routes/restaurantRoutes');
const busTripRoutes = require('./routes/busTripRoute');
const cors = require('cors');


// connect to mongoDB
connectDB();

const app = express();
app.use(express.json());












// //middleware

// //routes  

app.use('/api', login);
app.use('/api/user', userRoutes);
app.use('/api/restaurant', restaurantRoutes)
app.use('/api/busTrip', busTripRoutes);
app.use(cors());



app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
}); 
