import { useEffect, useState } from "react";
import axios from "axios";

export default function CertificatePage() {
  // --- State ---
  const [flatNumber, setFlatNumber] = useState("");
  const [memberData, setMemberData] = useState(null);
  const [errorData, setErrorData] = useState(null);

  const [phoneInput, setPhoneInput] = useState("");
  const [numberError, setNumberError] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // --- Update Form States ---
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatedOwner, setUpdatedOwner] = useState("");
  const [updatedCoOwner, setUpdatedCoOwner] = useState("");
  const [updatedPhone, setUpdatedPhone] = useState("");
  const [updatedEmail, setUpdatedEmail] = useState("");

  // Loader and transitions
  const [isLoading, setIsLoading] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);

  useEffect(() => {
    setAnimateForm(true);
  },[])

  // --- Flat Number Handlers ---
  const handleFlatNumberChange = (e) => {
    let v = e.target.value.toUpperCase();
    v = v.replace(/[^A-Z0-9-]/g, ""); // Allow letters, digits, dash
    setFlatNumber(v);
  };

  const formatFlatNumber = (flatNumber) => {
    if (!flatNumber) return;
    const m = flatNumber.match(/^([A-Z])[-]?(\d{0,4})$/);
    if (!m) return;
    const letter = m[1];
    const digits = (m[2] || "").padStart(4, "0");
    return `${letter}-${digits}`;
  };

  // --- Submit Flat Number to get member details ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorData(null);
    setMemberData(null);
    setIsLoading(true);

    const formattedFlatNumber = formatFlatNumber(flatNumber);
    setFlatNumber(formattedFlatNumber);

    try {
      const res = await axios.post("https://aoa-certificate.onrender.com/find-member", { flatNumber: formattedFlatNumber });
      setMemberData(res.data);
    } catch (err) {
      setErrorData(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-poppins">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Great Value Sharanam</h1>
        <div className="space-x-6 mr-10">
          <a href="https://www.sharanamaoa.in" className="underline-slide font-bold">
            Home
          </a>
          <a href="mailto:aoa-support@email.com" className="underline-slide font-bold">
            Contact
          </a>
        </div>
      </nav>

      {/* Main Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className={`bg-white shadow-lg rounded-2xl p-8 w-full max-w-md transform transition-all duration-700 ease-out ${animateForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-100px]"}`}>
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
                // pattern="[A-Z]-\d{4}"
              />
            </div>

            <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition">
              Check Details
            </button>
          </form>

          {isLoading && (
            <div className="mt-6 p-4 border rounded-lg bg-yellow-50 text-yellow-800 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-3"></div>
              <p>Waking up the server... this may take 30–60 seconds ⏳</p>
            </div>
          )}

          {errorData && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <p>{errorData}</p>
            </div>
          )}

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

              {/* Update Button */}
              <button onClick={() => setShowUpdateForm((prev) => !prev)} className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg">
                {showUpdateForm ? "Cancel Update" : "Update Details"}
              </button>

              {/* Update Form */}
              {showUpdateForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await axios.put("https://aoa-certificate.onrender.com/update-member", {
                        flatNumber,
                        ownerName: updatedOwner,
                        coOwnerName: updatedCoOwner,
                        phoneNumber: updatedPhone,
                        email: updatedEmail,
                      });
                      alert("Details updated successfully!");
                      setShowUpdateForm(false);
                      handleSubmit(new Event("submit")); // refresh memberData
                      // eslint-disable-next-line no-unused-vars
                    } catch (err) {
                      alert("Error updating details");
                    }
                  }}
                  className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Owner Name"
                    value={updatedOwner}
                    onChange={(e) => setUpdatedOwner(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Co-Owner Name"
                    value={updatedCoOwner}
                    onChange={(e) => setUpdatedCoOwner(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={updatedPhone}
                    onChange={(e) => setUpdatedPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={updatedEmail}
                    onChange={(e) => setUpdatedEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />

                  <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg">
                    Save Changes
                  </button>
                </form>
              )}

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
