const express = require("express");
const { addMember, getMemberByFlatNumber, verifyPhoneNumber} = require("../Controllers/memberController");
// const { verifyApiKey } = require("../middleware/auth");
const memberRoutes = express.Router();

memberRoutes.post("/add-member", addMember);
memberRoutes.post("/find-member", getMemberByFlatNumber);
memberRoutes.post("/verify-phone", verifyPhoneNumber);

module.exports = memberRoutes;
