
const PNRPassengersDetails = require('../model/PNRPassengersDetails');

// Fetch all passenger details
const getAllPNRPassengersDetails = async (req, res) => {
    try {
        const passengers = await PNRPassengersDetails.find();
        res.status(200).json(passengers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching passenger details', error });
    }
};

// Fetch passenger details by PNR
const getPNRPassengersDetailsByPNR = async (req, res) => {
    const { pnr } = req.params;
    try {
        const passenger = await PNRPassengersDetails.findOne({ pnr });
        if (!passenger) {
            return res.status(404).json({ message: 'Passenger not found for given PNR' });
        }
        res.status(200).json(passenger);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching passenger by PNR', error });
    }
};

// Create new passenger detail
const createPNRPassengerDetail = async (req, res) => {
    try {
        const newPassenger = new PNRPassengersDetails(req.body);
        await newPassenger.save();
        res.status(201).json(newPassenger);
    } catch (error) {
        res.status(500).json({ message: 'Error creating passenger detail', error });
    }
};

// Update passenger detail by PNR
const updatePNRPassengerDetail = async (req, res) => {
    const { pnr } = req.params;
    try {
        const updatedPassenger = await PNRPassengersDetails.findOneAndUpdate(
            { pnr },
            req.body,
            { new: true }
        );
        if (!updatedPassenger) {
            return res.status(404).json({ message: 'Passenger not found for given PNR' });
        }
        res.status(200).json(updatedPassenger);
    } catch (error) {
        res.status(500).json({ message: 'Error updating passenger detail', error });
    }
};

// Delete passenger detail by PNR
const deletePNRPassengerDetail = async (req, res) => {
    const { pnr } = req.params;
    try {
        const deletedPassenger = await PNRPassengersDetails.findOneAndDelete({ pnr });
        if (!deletedPassenger) {
            return res.status(404).json({ message: 'Passenger not found for given PNR' });
        }
        res.status(200).json({ message: 'Passenger deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting passenger detail', error });
    }
};

module.exports = {
    getAllPNRPassengersDetails,
    getPNRPassengersDetailsByPNR,
    createPNRPassengerDetail,
    updatePNRPassengerDetail,
    deletePNRPassengerDetail
};
