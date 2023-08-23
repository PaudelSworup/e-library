const mongoose = require("mongoose")
const { ObjectId } = mongoose.Schema;
const otpSchema = new mongoose.Schema({
    otp: {
      type: String,
      required: true,
    },
  
    userId: {
      type: ObjectId,
      ref: "Readers",
      required: true,
    },
  
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  
    expiresIn: {
      type: Date,
      default: Date.now(),
    },
  });

  module.exports = mongoose.model("Otp" , otpSchema)
