const mongoose = require("mongoose")
const { ObjectId } = mongoose.Schema;

const bookmarkSchema = new mongoose.Schema({
    userId:{
        type:ObjectId,
        required:true,
        ref: "Readers",
    },

    book:{
        type: ObjectId,
        required: true,
        ref: "Books",

    }

})

module.exports = mongoose.model("bookmarks", bookmarkSchema);