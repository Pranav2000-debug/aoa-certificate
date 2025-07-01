const express = require("express");
const { addMember } = require("../Controllers/memberController");
const { verifyApiKey } = require("../middleware/auth");
const memberRoutes = express.Router();

memberRoutes.post("/add-member", verifyApiKey, addMember);

module.exports = memberRoutes;
