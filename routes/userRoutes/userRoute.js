const express = require("express");
const {
  postUser, getUser, postEmailVerification, signIn,
} = require("../../controllers/readersController/readersController");
const {readersValidation, validators, loginValidation } = require("../../utils/validators");

const router = express.Router();

router.post("/users", readersValidation, validators, postUser);
router.get("/users" , getUser)
router.post("/confirmation/:token", postEmailVerification)
router.post("/login", loginValidation, validators, signIn )

module.exports = router;
