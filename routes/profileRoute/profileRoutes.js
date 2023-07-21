const express = require("express")

const router = express.Router()

const profile = require("../../middlewares/profile-upload")
const { uploadProfile, getProfile, downloadProfile } = require("../../controllers/Profile/profileController")

router.post("/profile" , profile.single("image"),uploadProfile)
router.get("/profile" , getProfile )
router.get("/download",downloadProfile)


module.exports = router