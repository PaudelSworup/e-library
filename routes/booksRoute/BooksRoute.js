const express = require("express")
const { postBooks, getBooks, deleteBooks, getBookByCategory, getSingleBook } = require("../../controllers/booksController/booksController")
const { returnBooks } = require("../../controllers/reportsController/reportsController")
const { booksValidation, validators } = require("../../utils/validators")

const router = express.Router()

const upload = require("../../middlewares/file-upload")






// routes
router.post('/books', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), booksValidation, validators, postBooks);
router.get("/books",getBooks)
router.get("/single/:id", getSingleBook)
router.post("/returnbooks",returnBooks)
router.get("/books/:category", getBookByCategory)
router.delete("/books/:id", deleteBooks)


module.exports = router