const express = require("express")

const router = express.Router()

const profile = require("../../middlewares/profile-upload")
const { uploadProfile, getProfile } = require("../../controllers/Profile/profileController")

router.post("/profile" , profile.single("image"),uploadProfile)
router.get("/profile" , getProfile )


module.exports = router