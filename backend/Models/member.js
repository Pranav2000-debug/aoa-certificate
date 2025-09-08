const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  flatNumber: {
    type: String,
    required: true,
    unique: true,
  },
  membershipId: {
    type: String,
    required: true,
    unique: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  coOwnerName: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  otpVerification: {
    verificationId: String, // temporary storage
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
