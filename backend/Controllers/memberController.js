const Member = require("../Models/member");
const { sendOtp } = require("../otpService"); // Your Twilio function

const otpStore = {};

function maskString(str, visibleStart = 3, visibleEnd = 2) {
  if (!str) return "N/A";
  if (str.length <= visibleStart + visibleEnd) return str; // too short
  return str.substring(0, visibleStart) + "*".repeat(str.length - (visibleStart + visibleEnd)) + str.substring(str.length - visibleEnd);
}

exports.addMember = async (req, res) => {
  try {
    const { flatNumber, ownerName, coOwnerName, phoneNumber, email } = req.body;

    // Check if member already exists by flat number
    const existing = await Member.findOne({ flatNumber });
    if (existing) {
      return res.status(400).json({ message: "Member already exists." });
    }

    const newMember = new Member({
      flatNumber,
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
      ownerNameMasked: maskString(member.ownerName, 3, 2),
      coOwnerNameMasked: member.coOwnerName ? maskString(member.coOwnerName, 3, 2) : "N/A",
      phoneNumberMasked: maskString(member.phoneNumber, 2, 2), // show first 2 and last 2 digits
      emailMasked: member.email ? maskString(member.email.split("@")[0], 3, 0) + "@" + member.email.split("@")[1] : "N/A",
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

    res.json({ exists: true, message: "Phone number verified.", member });
  } catch (error) {
    console.error("Error verifying phone number:", error);
    res.status(500).json({ message: "Server error." });
  }
};
