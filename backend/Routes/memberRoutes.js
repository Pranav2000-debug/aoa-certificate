const express = require("express");
const { addMember, getMemberByFlatNumber, verifyPhoneNumber, updateMemberDetails} = require("../Controllers/memberController");
// const { verifyApiKey } = require("../middleware/auth");
const memberRoutes = express.Router();

// working from google apps scripts
memberRoutes.post("/add-member", addMember);

// working from node controllers
memberRoutes.post("/find-member", getMemberByFlatNumber);
memberRoutes.post("/verify-phone", verifyPhoneNumber);
memberRoutes.put("/updat-member", updateMemberDetails);

module.exports = memberRoutes;
