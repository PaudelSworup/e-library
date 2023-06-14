const mongoose = require("mongoose")

const { ObjectId } = mongoose.Schema;

const notificationSchema = new mongoose.Schema({
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

    returnDate:{
        type:Date,
        required:true
    },

    notificationStatus:{
        type:Boolean,
        default:false
    },

    date:{
        type:Date,
        default:Date.now()
    }
})

module.exports = mongoose.model("notifications" , notificationSchema)