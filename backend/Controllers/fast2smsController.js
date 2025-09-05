const axios = require("axios");
const Member = require("../Models/member");

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

    // if (process.env.MOCK_SMS === "true") {
    //   console.log(`MOCK SMS: OTP ${otp} sent to ${member.phoneNumber}`);
    //   return res.json({ success: true, message: "OTP sent (mocked)", otp });
    //   // include otp in response ONLY for testing
    // }

    // 4. Call Fast2SMS API
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp,
        route: "otp",
        numbers: member.phoneNumber, // 10-digit number
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Fast2SMS Status:", {
      return: response.data.return,
      request_id: response.data.request_id, // track delivery request
    });

    if (response.data.return === true) {
      res.json({ success: true, message: "OTP sent via SMS" });
    } else {
      res.status(500).json({ success: false, message: "Failed to send OTP", details: response.data });
    }
  } catch (err) {
    console.error("Fast2SMS Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Server error while sending OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { flatNumber, otp } = req.body;

    const member = await Member.findOne({ flatNumber });
    if (!member || String(member.otp) !== String(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Clear OTP after success
    member.otp = null;
    await member.save();

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
