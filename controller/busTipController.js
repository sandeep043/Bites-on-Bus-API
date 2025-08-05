const BusTrip = require('../model/busTripModel');
const mongoose = require('mongoose');

// Create a new bus trip
const addBusTrip = async (req, res) => {
    try {
        const tripData = req.body;

        // Validate required fields
        if (!tripData.pnr || !tripData.busId || !tripData.stops) {
            return res.status(400).json({ message: "PNR, busId, and stops are required" });
        }

        // Validate each stop has required fields
        for (const stop of tripData.stops) {
            if (!stop.stopId || !stop.name || !stop.location || !stop.estimatedArrival) {
                return res.status(400).json({
                    message: "Each stop requires stopId, name, location, and estimatedArrival"
                });
            }
        }

        const newTrip = new BusTrip(tripData);
        await newTrip.save();

        res.status(201).json({
            message: "Bus trip created successfully",
            trip: newTrip
        });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ message: "PNR already exists" });
        }
        res.status(500).json({
            message: "Failed to create bus trip",
            error: error.message
        });
    }
};

// Get all bus trips
const getAllBusTrips = async (req, res) => {
    try {
        const trips = await BusTrip.find();
        res.status(200).json({ trips });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch bus trips",
            error: error.message
        });
    }
};

// Get bus trip by ID
const getBusTripById = async (req, res) => {
    try {
        const tripId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({ message: "Invalid trip ID" });
        }

        const trip = await BusTrip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ message: "Bus trip not found" });
        }

        res.status(200).json({ trip });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch bus trip",
            error: error.message
        });
    }
};

// Get bus trip by PNR
const getBusTripByPnr = async (req, res) => {
    try {
        const pnr = req.params.pnr;
        const trip = await BusTrip.findOne({ pnr });

        if (!trip) {
            return res.status(404).json({ message: "Bus trip not found for this PNR" });
        }

        res.status(200).json({ trip });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch bus trip by PNR",
            error: error.message
        });
    }
};

// Update bus trip
const updateBusTrip = async (req, res) => {
    try {
        const tripId = req.params.id;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({ message: "Invalid trip ID" });
        }

        const updatedTrip = await BusTrip.findByIdAndUpdate(
            tripId,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedTrip) {
            return res.status(404).json({ message: "Bus trip not found" });
        }

        res.status(200).json({
            message: "Bus trip updated successfully",
            trip: updatedTrip
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to update bus trip",
            error: error.message
        });
    }
};

// Delete bus trip
const deleteBusTrip = async (req, res) => {
    try {
        const tripId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({ message: "Invalid trip ID" });
        }

        const deletedTrip = await BusTrip.findByIdAndDelete(tripId);

        if (!deletedTrip) {
            return res.status(404).json({ message: "Bus trip not found" });
        }

        res.status(200).json({
            message: "Bus trip deleted successfully",
            trip: deletedTrip
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete bus trip",
            error: error.message
        });
    }
};

// Get trips by busId
const getTripsByBusId = async (req, res) => {
    try {
        const busId = req.params.busId;
        const trips = await BusTrip.find({ busId });

        if (!trips || trips.length === 0) {
            return res.status(404).json({
                message: "No trips found for this bus ID"
            });
        }

        res.status(200).json({ trips });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch trips by bus ID",
            error: error.message
        });
    }
};

module.exports = {
    addBusTrip,
    getAllBusTrips,
    getBusTripById,
    getBusTripByPnr,
    updateBusTrip,
    deleteBusTrip,
    getTripsByBusId
};