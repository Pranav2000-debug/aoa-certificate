const express = require("express");
const { sendOtpSms, verifyOtp } = require("../Controllers/otpController");

const otpRoutes = express.Router();

// Send OTP via SMS
otpRoutes.post("/send-otp", sendOtpSms);

// Verify OTP
otpRoutes.post("/verify-otp", verifyOtp);

module.exports = otpRoutes;
