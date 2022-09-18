const mongoose = require("mongoose");

const PasswordResetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  resetString: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

module.exports = PasswordReset = mongoose.model(
  "PasswordReset",
  PasswordResetSchema
);
