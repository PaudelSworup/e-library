const express = require("express")
const app = express()
require("dotenv").config()
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
require("./database/DB_Connection")


const morgan  = require("morgan")
const cors = require("cors")


const categoryRoute = require("./routes/categoryRoute/CategoryRoute")
const bookRoute = require("./routes/booksRoute/BooksRoute")
const userRoute = require("./routes/userRoutes/userRoute")
const requestRoute = require("./routes/reportsRoute/reportRoute")
const ratingRoute = require("./routes/ratingsRoute/ratingRoute")
const profileRoute = require("./routes/profileRoute/profileRoutes")
const likeRoute = require("./routes/likeRoute/likeRoute")
const notificationRoute = require("./routes/notificationRoutes/notificationRoute")





// middlewares
app.use(bodyParser.json())
app.use(morgan("dev"))
app.use("/public/uploads", express.static("public/uploads"));
app.use("/public/profile", express.static("public/profile"))
app.use("/public/pdfs", express.static("public/pdfs"))
app.use(cookieParser())
app.use(cors())

// routes middllware
app.use("/api",categoryRoute)
app.use("/api",bookRoute)
app.use("/api" , userRoute)
app.use("/api", requestRoute)
app.use("/api" , ratingRoute)
app.use("/api" , profileRoute)
app.use("/api" , likeRoute)
app.use("/api" , notificationRoute)

// multer middlwware




// server start code
const port = process.env.PORT || 3002
app.listen(port, ()=>{
    console.log(`Server running at port ${port}`)
})