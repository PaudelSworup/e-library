const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const notificationSchema = new mongoose.Schema({
  book: {
    type: ObjectId,
    required: true,
    ref: "Books",
  },

  user: {
    type: ObjectId,
    ref: "Readers",
  },

  returnDate: {
    type: Date,
  },

  sendAll: {
    type: Boolean,
    default: false,
  },

  notificationStatus: {
    type: Boolean,
    default: false,
  },

  messageNotification: {
    type: String,
  },

  date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("notifications", notificationSchema);
