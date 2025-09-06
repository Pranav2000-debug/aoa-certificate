const twilio = require("twilio");
const Member = require("../Models/member");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendOtpSms = async (req, res) => {
  try {
    const { flatNumber } = req.body;

    // 1. Find member
    const member = await Member.findOne({ flatNumber });
    if (!member) {
      return res.status(404).json({ message: "No member found with this flat number" });
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 3. Save OTP temporarily in DB
    member.otp = otp;
    await member.save();

    // 4. Send OTP via SMS
    const message = await client.messages.create({
      from: "+19016609825", // Your US Twilio number
      to: `+91${member.phoneNumber}`,        // Member's phone number with country code
      body: `Your OTP is ${otp}`,
    });

    console.log("Twilio SID:", message.sid);
    res.json({ success: true, message: "OTP sent via SMS" });
  } catch (err) {
    console.error("Twilio SMS error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { flatNumber, otp } = req.body;

    const member = await Member.findOne({ flatNumber });
    if (!member || String(member.otp) !== String(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Clear OTP after successful verification
    member.otp = null;
    await member.save();

    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
