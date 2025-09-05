const express = require("express");
const { verifyOtp, sendOtpSms } = require("../Controllers/fast2smsController");

const fastOtpRoutes = express.Router();

fastOtpRoutes.post("/send-otp", sendOtpSms);
fastOtpRoutes.post("/verify-otp", verifyOtp);

module.exports = fastOtpRoutes;