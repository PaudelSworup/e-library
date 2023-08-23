const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const detectSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
    ref: "Readers",
  },

  userAgents:{
    type:[String],
  }
});

const reconizeDevice = mongoose.model("device",detectSchema)
module.exports = reconizeDevice
