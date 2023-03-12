const express = require("express")
const { provideRating, getratingsDetails, recommendedBooks } = require("../../controllers/ratingControllers/ratingController")


const router = express.Router()

router.post("/rate" ,provideRating )
router.get("/rate" , getratingsDetails)
router.get("/recommend/:id" , recommendedBooks)


module.exports = router