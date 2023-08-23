const express = require("express");
const { validateOTP } = require("../../controllers/OTPController/otpController");
const router = express.Router();
router.post("/validateotp",validateOTP)

module.exports = router;
