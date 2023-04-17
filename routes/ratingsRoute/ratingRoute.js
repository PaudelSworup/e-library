const express = require("express")
const { provideRating, getratingsDetails, recommendedBooks, recommendByCategory, browse } = require("../../controllers/ratingControllers/ratingController")


const router = express.Router()

router.post("/rate" ,provideRating )
router.get("/rate" , getratingsDetails)
router.get("/recommend/:id" , recommendedBooks)
router.get("/categoryrecommendation/:id", recommendByCategory)
router.get("/browse/:name",browse)


module.exports = router