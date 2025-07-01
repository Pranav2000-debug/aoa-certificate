const express = require("express");
const {addMember} = require("../Controllers/memberController");
const memberRoutes = express.Router();

memberRoutes.post("/add-member", addMember);

module.exports = memberRoutes;