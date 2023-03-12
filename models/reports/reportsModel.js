const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const reportsSchema = new mongoose.Schema({
  books_id: {
    type: ObjectId,
    required: true,
    ref: "Books",
  },

  user_id: {
    type: ObjectId,
    ref: "Readers",
  },

  issueDate: {
    type: Date,
  },

  issueStatus: {
    type: Number,
    default: 0,
  },

  returnDate: {
    type: Date,
    default: Date.now(),
  },

  returnStatus: {
    type: Number,
    default: 0,
  },

  userReturnedDate: {
    type: Date,
  },

  penalty: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Reports", reportsSchema);
