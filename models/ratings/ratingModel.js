const mongoose  = require("mongoose")

const { ObjectId } = mongoose.Schema;


const ratingSchema = new mongoose.Schema({
    rating:{
        type:Number,
        require:true,
        trim:true,
    },

    book:{
        type:ObjectId,
        required:true,
        ref:"Books"
    },

    user:{
        type:ObjectId,
        required:true,
        ref:"Readers"
    }
})


module.exports = mongoose.model("rating", ratingSchema)