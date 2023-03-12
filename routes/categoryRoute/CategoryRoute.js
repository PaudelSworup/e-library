const express = require("express")
const router = express.Router()

const { registerCatgory, getCategory } = require("../../controllers/categoryControllers/categoryController")

router.post("/category", registerCatgory )
router.get("/category",getCategory )


module.exports = router