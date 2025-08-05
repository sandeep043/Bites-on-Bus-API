const mongoose = require('mongoose');



const busTripSchema = new mongoose.Schema({
  pnr: {
    type: String,
    ref: 'PNRPassengerDetails',
    required: true,
    unique: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusDetails',
    required: true
  },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  stops: [{
    stopId: { type: String, required: true },
    name: { type: String, required: true },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    estimatedArrival: { type: Date, required: true }
  }]
});



const BusTrip = mongoose.model('BusTrip', busTripSchema);
module.exports = BusTrip;