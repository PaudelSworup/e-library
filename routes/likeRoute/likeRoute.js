const express = require("express")
const { postLikes, getLikes } = require("../../controllers/likeController/likeController")
const router = express.Router()


router.post("/like" , postLikes)
router.get("/like" , getLikes)

module.exports = router