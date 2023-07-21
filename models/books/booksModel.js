const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const booksSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim:true,
    },

    isbn: {
      type: Number,
      required: true,
      trim:true,
    },

    price: {
      type: Number,
      required: true,
      trim:true,
    },

    category: {
      type: ObjectId,
      required: true,
      ref: "booksCat",
    },

    publisher: {
      type: String,
      required: true,
      trim:true,
    },

    desc: {
      type: String,
    },

    stock: {
      type: Number,
      required: true,
    },

    image:{
      type:String,
      required:true,
      trim:true,
    },

    pdf:{
      type:String,
      required:true,
      trim:true,
    },

    yearofpublication: {
      type: Date,
      required: true,
      trim:true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Books", booksSchema);
