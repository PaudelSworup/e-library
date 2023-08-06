const express = require("express")
const router = express.Router()

const { registerCatgory, getCategory } = require("../../controllers/categoryControllers/categoryController")
const { categoryValidation, validators } = require("../../utils/validators")

router.post("/category", categoryValidation,validators, registerCatgory )
router.get("/category",getCategory )


module.exports = router