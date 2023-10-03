const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: ObjectId,
      ref: "Readers",
      required: true,
    },

    expiresIn: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);
