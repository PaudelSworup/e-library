const express = require("express")
const { provideRating, getratingsDetails, recommendedBooks, recommendByCategory, browse, listBooks, getSingle, getKnnRecommendation  } = require("../../controllers/ratingControllers/ratingController")


const router = express.Router()

router.post("/rate" ,provideRating )
router.get("/rate" , getratingsDetails)
router.get("/rate/check/:bookId", getSingle)
router.get("/recommend/:id" , recommendedBooks)
router.get("/categoryrecommendation/:id", recommendByCategory)
router.get("/browse/:name",browse)
router.get("/listcatbooks/:id" , listBooks)
router.get("/knn" , getKnnRecommendation )



module.exports = router