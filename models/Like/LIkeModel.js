const mongoose = require("mongoose")

const { ObjectId } = mongoose.Schema;

const likeSchema = new mongoose.Schema({
    book:{
        type:ObjectId,
        required:true,
        ref:"Books"
    },

    user:{
        type:ObjectId,
        required:true,
        ref:"Readers"
    },

    likedStatus:{
        type:Boolean,
        default:false
    }
})

module.exports = mongoose.model("like", likeSchema)