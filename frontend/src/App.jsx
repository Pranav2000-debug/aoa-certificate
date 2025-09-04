import { useState } from "react";
import axios from "axios";

export default function CertificatePage() {
  // --- State ---
  const [flatNumber, setFlatNumber] = useState("");
  const [memberData, setMemberData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [errorData, setErrorData] = useState(null);

  const [phoneInput, setPhoneInput] = useState("");
  const [numberError, setNumberError] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // --- Flat Number Handlers ---
  const handleFlatNumberChange = (e) => {
    let v = e.target.value.toUpperCase();
    v = v.replace(/[^A-Z0-9-]/g, ""); // Allow letters, digits, dash
    setFlatNumber(v);
  };

  const handleFlatNumberBlur = () => {
    if (!flatNumber) return;
    const m = flatNumber.match(/^([A-Z])[-]?(\d{0,4})$/);
    if (!m) return;
    const letter = m[1];
    const digits = (m[2] || "").padStart(4, "0");
    setFlatNumber(`${letter}-${digits}`);
  };

  // --- Submit Flat Number to get member details ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorData("");
    setMemberData(null);

    try {
      const res = await axios.post("https://aoa-certificate.onrender.com/find-member", { flatNumber });
      setMemberData(res.data);
    } catch (err) {
      setErrorData(err.response?.data?.message || "Something went wrong");
    }
  };

  // --- Verify Phone Number ---
  const handleVerifyPhone = async () => {
    setNumberError("");

    if (phoneInput.length !== 10) {
      setNumberError("Invalid phone number (check length)");
      return;
    }
    if (!flatNumber) {
      setNumberError("Flat number is required");
      return;
    }

    try {
      const response = await axios.post("https://aoa-certificate.onrender.com/verify-phone", {
        flatNumber,
        phoneNumber: phoneInput,
      });

      if (response.data.exists) {
        setIsPhoneVerified(true);
      } else {
        setNumberError(response.data.message);
        setIsPhoneVerified(false);
      }
    } catch (err) {
      console.log(err);
      setNumberError("Server error while verifying phone number");
      setIsPhoneVerified(false);
    }
  };

  // --- Send OTP ---
  const handleSendOtp = async () => {
    try {
      const res = await axios.post("https://aoa-certificate.onrender.com/send-otp", {
        flatNumber,
      });
      console.log(res.data);
      setOtpSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Verify OTP ---
  const handleVerifyOtp = async () => {
    setOtpError("");

    if (!otpInput) {
      setOtpError("Please enter the OTP");
      return;
    }

    try {
      const res = await axios.post("https://aoa-certificate.onrender.com/verify-otp", {
        flatNumber,
        otp: otpInput,
      });

      if (res.data.success) {
        setIsOtpVerified(true);
      } else {
        setOtpError(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      console.log(err);
      setOtpError("Server error while verifying OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white px-6 py-3 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Society AOA</h1>
        <div className="space-x-6">
          <a href="https://www.sharanamaoa.in" className="hover:underline">
            Home
          </a>
          <a href="mailto:aoa-support@email.com" className="hover:underline">
            Contact
          </a>
        </div>
      </nav>

      {/* Main Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Download Your Membership Certificate</h2>

          {/* Flat Number Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="flatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Flat Number
              </label>
              <input
                id="flatNumber"
                type="text"
                placeholder="E.g A-0001, A-0103, A-2001"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                value={flatNumber}
                onChange={handleFlatNumberChange}
                onBlur={handleFlatNumberBlur}
                pattern="[A-Z]-\d{4}"
              />
            </div>

            <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition">
              Check Details
            </button>
          </form>

          {memberData && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-100">
              <h2 className="text-lg font-semibold mb-2">Member Details</h2>
              <p>
                <strong>Flat Number:</strong> {memberData.flatNumber}
              </p>
              <p>
                <strong>Owner Name:</strong> {memberData.ownerNameMasked}
              </p>
              <p>
                <strong>Co-Owner Name:</strong> {memberData.coOwnerNameMasked}
              </p>
              <p>
                <strong>Phone Number:</strong> {memberData.phoneNumberMasked}
              </p>
              <p>
                <strong>Email:</strong> {memberData.emailMasked}
              </p>

              {/* Phone Verification */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter your full phone number to proceed</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter full phone number"
                  disabled={isPhoneVerified}
                />
              </div>

              {numberError && <p className="text-red-600 mt-2">{numberError}</p>}

              {!isPhoneVerified ? (
                <button onClick={handleVerifyPhone} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg">
                  Verify Phone Number
                </button>
              ) : (
                <>
                  <p className="text-green-600 mt-2">Phone number matches the apartment owner's phone number.</p>
                  {!otpSent ? (
                    <button onClick={handleSendOtp} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
                      Send OTP
                    </button>
                  ) : (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Enter OTP"
                        disabled={isOtpVerified}
                      />
                      {otpError && <p className="text-red-600 mt-2">{otpError}</p>}

                      {!isOtpVerified ? (
                        <button onClick={handleVerifyOtp} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg">
                          Verify OTP
                        </button>
                      ) : (
                        <p className="text-green-600 mt-2">✅ OTP verified successfully!</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600">© {new Date().getFullYear()} Great Value Sharanam AOA</footer>
    </div>
  );
}
