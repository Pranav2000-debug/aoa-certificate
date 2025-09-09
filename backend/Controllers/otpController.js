const Member = require("../Models/member");
const axios = require("axios");

exports.sendOtpSms = async (req, res) => {
  try {
    const { flatNumber } = req.body;

    // 1. Find member
    const member = await Member.findOne({ flatNumber });
    if (!member) {
      return res.status(404).json({ message: "No member found with this flat number" });
    }

    /* ===========================
       TEST MODE SHORT-CIRCUIT (INJECTED)
       If TEST_MODE=true in env, simulate provider response here
       so we DON'T call the real SMS provider during load/testing.
       This block should be placed BEFORE any external request.
       =========================== */
    if (process.env.TEST_MODE === "true") {
      member.otpVerification = { verificationId: "TEST-VERIF-ID" };
      await member.save();
      console.log(`TEST_MODE: simulated OTP send for ${member.flatNumber}`);
      return res.json({ success: true, message: "OTP send simulated (TEST_MODE)" });
    }
    /* ===========================
       END TEST MODE SHORT-CIRCUIT
       =========================== */

    const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=${process.env.MESSAGECENTRAL_CUSTOMER_ID}&flowType=SMS&mobileNumber=${member.phoneNumber}`;

    // Message central method
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          authToken: process.env.MESSAGECENTRAL_AUTH_TOKEN,
        },
      }
    );

    const { verificationId } = response.data?.data || {};

    if (!verificationId) {
      return res.status(500).json({ message: "Failed to get verificationId from provider" });
    }

    // 3. Save verificationId in DB temporarily
    member.otpVerification = { verificationId };
    await member.save();

    console.log(`Message Central response:`, response.data);

    // 4. Respond to frontend
    res.json({ success: true, message: "OTP sent via SMS" });
  } catch (err) {
    console.error("Message Central server error SMS error:", err.response?.data || err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { flatNumber, otp } = req.body;

    const member = await Member.findOne({ flatNumber });
    if (!member || !member.otpVerification?.verificationId) {
      return res.status(400).json({ message: "No OTP request found for this member" });
    }


     /* ===========================
       TEST MODE VERIFY (INJECTED)
       If TEST_MODE=true and we previously set TEST-VERIF-ID,
       accept verification without calling provider.
       This lets verify flow succeed during testing.
       =========================== */
    if (process.env.TEST_MODE === "true" && member.otpVerification?.verificationId === "TEST-VERIF-ID") {
      member.otpVerification = { verificationId: null };
      await member.save();
      console.log(`TEST_MODE: simulated OTP verify for ${member.flatNumber}`);
      return res.json({ success: true, message: "OTP verified (TEST_MODE)" });
    }
    /* ===========================
       END TEST MODE VERIFY
       =========================== */

    const verificationId = member.otpVerification.verificationId;
    console.log(verificationId);

    const url = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${member.phoneNumber}&verificationId=${verificationId}&customerId=${process.env.MESSAGECENTRAL_CUSTOMER_ID}&code=${otp}`;

    const response = await axios.get(url, {
      headers: {
        authToken: process.env.MESSAGECENTRAL_AUTH_TOKEN,
      },
    });

    const data = response.data?.data;

    if (data && data.verificationStatus === "VERIFICATION_COMPLETED") {
      member.otpVerification = { verificationId: null };
      await member.save();
      return res.json({ success: true, message: "OTP verified" });
    } else {
      return res.status(400).json({
        success: false,
        message: data?.errorMessage || "Invalid OTP",
      });
    }
  } catch (err) {
    console.error("Verify OTP Error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Server error" });
  }
};
