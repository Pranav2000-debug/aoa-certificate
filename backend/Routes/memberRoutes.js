const express = require("express");
const { addMember, getMemberByFlatNumber } = require("../Controllers/memberController");
// const { verifyApiKey } = require("../middleware/auth");
const memberRoutes = express.Router();

memberRoutes.post("/add-member", addMember);
memberRoutes.post("/find-member", getMemberByFlatNumber);

module.exports = memberRoutes;
