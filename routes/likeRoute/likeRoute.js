const express = require("express")
const { postLikes, getLikes, getLikedCount } = require("../../controllers/likeController/likeController")
const router = express.Router()


router.post("/like" , postLikes)
router.get("/like" , getLikes)
router.get("/like/:book" , getLikedCount)

module.exports = router