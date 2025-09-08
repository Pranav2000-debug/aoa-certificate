const Member = require("../Models/member");

// Util functions
function maskString(str, visibleStart = 3, visibleEnd = 2) {
  if (!str) return "N/A";
  if (str.length <= visibleStart + visibleEnd) return str; 
  return str.substring(0, visibleStart) + "*".repeat(str.length - (visibleStart + visibleEnd)) + str.substring(str.length - visibleEnd);
}
function maskName(str) {
  if (!str) return "N/A";
  if (str.length <= 2) return str; 
  return str[0] + "*".repeat(str.length - 2) + str[str.length - 1];
}

exports.addMember = async (req, res) => {
  try {
    const { flatNumber, membershipId, ownerName, coOwnerName, phoneNumber, email } = req.body;

    // Check if member already exists by flat number
    const existing = await Member.findOne({ flatNumber });
    if (existing) {
      return res.status(400).json({ message: "Member already exists." });
    }

    const newMember = new Member({
      flatNumber,
      membershipId,
      ownerName,
      coOwnerName,
      phoneNumber,
      email,
    });

    await newMember.save();
    res.status(201).json({ message: "Member added successfully.", newMember });
  } catch (err) {
    console.error("Add Member Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getMemberByFlatNumber = async (req, res) => {
  try {
    const { flatNumber } = req.body;
    if (!flatNumber) {
      return res.status(400).json({ message: "flat number is required" });
    }
    const member = await Member.findOne({ flatNumber });

    if (!member) {
      return res.status(400).json({ message: "No member found with this flat number" });
    }

    const response = {
      flatNumber: member.flatNumber,
      membershipId: member.membershipId,
      ownerNameMasked: maskName(member.ownerName),
      coOwnerNameMasked: member.coOwnerName ? maskName(member.coOwnerName) : "N/A",
      phoneNumberMasked: maskString(member.phoneNumber, 2, 2), // show first 2 and last 2 digits
      emailMasked: member.email ? maskName(member.email.split("@")[0], 3, 0) + "@" + member.email.split("@")[1] : "N/A",
    };
    return res.json(response);
  } catch (err) {
    console.log("error getting member", err);
    res.status(500).json({ message: "server error" });
  }
};

exports.verifyPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber, flatNumber } = req.body;

    if (!phoneNumber || !flatNumber) {
      return res.status(400).json({ message: "Phone number and flat number are required." });
    }

    const member = await Member.findOne({ flatNumber, phoneNumber });

    if (!member) {
      return res.status(404).json({ exists: false, message: "Phone number does not match the flat number." });
    }

    const unmaskedMemberData = {
      flatNumber: member.flatNumber,
      membershipId: member.membershipId,
      ownerNameMasked: member.ownerName, 
      coOwnerNameMasked: member.coOwnerName, 
      phoneNumberMasked: maskString(member.phoneNumber, 2, 2), // keep masked phone
      emailMasked: member.email, 
    };
    res.json({ exists: true, message: "Phone number verified.", unmaskedMemberData });
  } catch (error) {
    console.error("Error verifying phone number:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// controllers/memberController.js
exports.updateMemberDetails = async (req, res) => {
  try {
    const { flatNumber, ownerName, coOwnerName, phoneNumber, email } = req.body;

    if (!flatNumber) {
      return res.status(400).json({ message: "Flat number is required" });
    }

    const member = await Member.findOne({ flatNumber });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Update only provided fields
    if (ownerName) member.ownerName = ownerName;
    if (coOwnerName) member.coOwnerName = coOwnerName;
    if (phoneNumber) member.phoneNumber = phoneNumber;
    if (email) member.email = email;

    await member.save();
    res.json({ message: "Member details updated successfully", member });
  } catch (err) {
    console.error("Update Member Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
