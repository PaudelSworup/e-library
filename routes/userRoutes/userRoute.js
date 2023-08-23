const express = require("express");
const {
  postUser, getUser, postEmailVerification, signIn, forgotPassword, resendVerification, updateUserDetails, changePassword, resetPassword, deleteUsers,
} = require("../../controllers/readersController/readersController");
const {readersValidation, validators, loginValidation, forgotValidation } = require("../../utils/validators");

const router = express.Router();

router.post("/users", readersValidation, validators, postUser);
router.put("/users/:id",  updateUserDetails)
router.get("/users" , getUser)
router.post("/confirmation/:token", postEmailVerification)
router.post("/login", loginValidation, validators, signIn )
router.post("/forgot", forgotValidation, validators,  forgotPassword)
router.post("/resend", forgotValidation,validators,resendVerification)
router.put("/changepassword/:id", changePassword)
router.put("/resetpassword/:token", resetPassword)
router.delete("/removeuser/:id",deleteUsers,)

module.exports = router;
