const mongoose = require("mongoose");

const CycleonLocationSchema = new mongoose.Schema({
  locationName: {
    type: String,
    required: true,
    unique: true,
  },
  coordinates: {
    type: String,
    required: true,
    unique: true,
  },
  bikes: {
    type: Array,
    required: true,
  },
});

module.exports = CycleonLocation = mongoose.model(
  "CycleonLocation",
  CycleonLocationSchema
);
