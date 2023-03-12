const mongoose = require("mongoose")

mongoose.set('strictQuery' , true)
mongoose.connect(process.env.DATABASE,{
    useNewUrlParser :true,
    useUnifiedTopology : true,
})
.then(()=>console.log("DB Connected"))
.catch((err)=>console.error(err))
