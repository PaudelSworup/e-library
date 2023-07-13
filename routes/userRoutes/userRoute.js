const express = require("express");
const {
  postUser, getUser, postEmailVerification, signIn, forgotPassword,
} = require("../../controllers/readersController/readersController");
const {readersValidation, validators, loginValidation, forgotValidation } = require("../../utils/validators");

const router = express.Router();

router.post("/users", readersValidation, validators, postUser);
router.get("/users" , getUser)
router.post("/confirmation/:token", postEmailVerification)
router.post("/login", loginValidation, validators, signIn )
router.post("/forgot", forgotValidation, validators,  forgotPassword)

module.exports = router;
