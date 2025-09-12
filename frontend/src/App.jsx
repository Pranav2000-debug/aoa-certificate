// src/App.jsx (or CertificatePage.jsx)
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import logoImg from "../src/assets/IMG-20250619-WA0013.jpg";
import { generateCertificatePdf } from "./util/generateCertificate";

export default function CertificatePage() {
  // --- State ---
  const [flatNumber, setFlatNumber] = useState("");
  const [memberData, setMemberData] = useState(null);
  const [errorData, setErrorData] = useState(null);

  const [phoneInput, setPhoneInput] = useState("");
  const [numberError, setNumberError] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]); // 4-digit OTP array
  const [otpError, setOtpError] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);

  // OTP resend cooldown (30s for resend)
  const [otpCooldown, setOtpCooldown] = useState(0); // seconds remaining
  const otpTimerRef = useRef(null);

  // --- Update Form States ---
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Loader and transitions
  const [isLoading, setIsLoading] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);
  const [showServerWakeupMessage, setShowServerWakeupMessage] = useState(false);

  useEffect(() => {
    setAnimateForm(true);
  }, []);

  // Cleanup OTP timer on unmount
  useEffect(() => {
    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
    };
  }, []);

  // function for putting AOA at the end
  function changeMemberId(str) {
    const [first, ...rest] = str.split("/");
    return [...rest, first].join("/");
  }
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

  const fetchMember = async (flatNum) => {
    setErrorData(null);
    setMemberData(null);

    setIsPhoneVerified(false);
    setPhoneInput("");
    setOtpDigits(["", "", "", ""]);
    setOtpSent(false);
    setIsOtpVerified(false);
    setIsLoading(true);

    try {
      const res = await axios.post("https://aoa-certificate.onrender.com/find-member", { flatNumber: flatNum });

      setMemberData(res.data);
    } catch (err) {
      setErrorData(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Submit Flat Number to get member details ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const serverDelayTime = Date.now();
    const formattedFlatNumber = formatFlatNumber(flatNumber) || flatNumber;
    setFlatNumber(formattedFlatNumber);

    const timeoutId = setTimeout(() => {
      setShowServerWakeupMessage(true);
      console.log("ran");
    }, 4500);

    await fetchMember(formattedFlatNumber);
    clearTimeout(timeoutId);
    setShowServerWakeupMessage(false);

    const timeElapsed = (Date.now() - serverDelayTime) / 1000;
    console.log(timeElapsed);
  };

  // --- Verify Phone Number ---
  const handleVerifyPhone = async () => {
    setNumberError("");

    if (phoneInput.length !== 10) {
      setNumberError("Invalid phone number (check length) or empty field ");
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
      setMemberData(response.data.unmaskedMemberData);
      if (response.data.exists) {
        setIsPhoneVerified(true);
      } else {
        setNumberError(response.data.message);
        setIsPhoneVerified(false);
      }
    } catch (err) {
      console.log(err);
      setNumberError("Phone number does not match the above shown number");
      setIsPhoneVerified(false);
    }
  };

  // --- Send OTP (first-time send, no cooldown) ---
  const handleSendOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await axios.post("https://aoa-certificate.onrender.com/send-otp", { flatNumber });
      console.log(res.data);
      setOtpSent(true);
      // don't start cooldown here — allow immediate resend link to appear (resend handler manages cooldown)
    } catch (err) {
      console.error(err);
    } finally {
      setOtpLoading(false);
    }
  };

  // --- Resend OTP (30s cooldown) ---
  const handleResendOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await axios.post("https://aoa-certificate.onrender.com/send-otp", { flatNumber });
      console.log("Resent OTP:", res.data);

      // start 30s cooldown
      if (!otpTimerRef.current) {
        setOtpCooldown(30);
        otpTimerRef.current = setInterval(() => {
          setOtpCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(otpTimerRef.current);
              otpTimerRef.current = null;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error("Resend OTP failed", err);
    } finally {
      setOtpLoading(false);
    }
  };

  // --- Handle OTP input change ---
  const handleOtpChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ""); // Only digits
    if (!val) return;

    setOtpDigits((prev) => prev.map((d, i) => (i === index ? val[0] : d)));

    // Auto-focus next input
    if (index < 3) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  // --- Handle OTP backspace ---
  const handleOtpBackspace = (e, index) => {
    if (e.key === "Backspace") {
      setOtpDigits((prev) => prev.map((d, i) => (i === index ? "" : d)));
      if (index > 0) {
        const prevEl = document.getElementById(`otp-${index - 1}`);
        if (prevEl) prevEl.focus();
      }
    }
  };

  // --- Verify OTP ---
  const handleVerifyOtp = async () => {
    setOtpError("");
    setVerifyOtpLoading(true);

    const otpValue = otpDigits.join("");
    if (otpValue.length !== 4) {
      setOtpError("Please enter the 4-digit OTP");
      setVerifyOtpLoading(false);
      return;
    }

    try {
      const res = await axios.post("https://aoa-certificate.onrender.com/verify-otp", {
        flatNumber,
        otp: otpValue,
      });

      if (res.data.success) {
        setIsOtpVerified(true);
      } else {
        setOtpError(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      console.log(err);
      setOtpError("Invalid OTP");
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-poppins">
      {/* Navbar */}
      <div className="w-full bg-blue-900">
        <nav className="bg-blue-900 w-full text-white px-10 py-4 shadow flex flex-col gap-2 sm:flex-row items-center justify-between">
          <div className="w-[240px] flex gap-2 pl-2">
            <img width="40px" src={logoImg} alt="logo" />
            <h1 className="text-sm font-poppins font-bold self-end text-white">Great Value Sharanam</h1>
          </div>
          <div className="flex flex-row space-x-5 justify-center md:flex-row md:space-x-6 items-center text-center">
            <a href="https://www.sharanamaoa.in" className="underline-slide font-bold">
              Home
            </a>
            <a href="https://sharanamaoa.in/contact/" target="_blank" className="underline-slide font-bold" rel="noreferrer">
              Contact Page
            </a>
            <a href="mailto:aoa.gvs@gmail.com" className="underline-slide font-bold">
              Mail
            </a>
          </div>
        </nav>
      </div>
      {/* Update form modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowUpdateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-lg w-[90%] p-6 z-60">
            <h3 className="text-lg font-semibold mb-3">Request to update member details</h3>
            <p className="text-sm mb-4">
              Please send the following details along with a **proof of ownership** to <span className="font-medium">aoa.gvs@gmail.com</span>. We will
              confirm the update within <strong>3–5 working days</strong> via email — then you can come back and download your certificate.
            </p>

            <ul className="list-disc list-inside text-sm mb-4 space-y-1">
              <li>Full name of owner (and co-owner if any)</li>
              <li>Flat number</li>
              <li>Contact number</li>
              <li>Proof of ownership</li>
            </ul>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText("aoa.gvs@gmail.com");
                  alert("Email address copied to clipboard");
                }}
                className="px-3 py-2 bg-gray-100 rounded-md text-sm">
                Copy email
              </button>

              <a href="mailto:aoa.gvs@gmail.com" className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
                Open mail
              </a>

              <button onClick={() => setShowUpdateModal(false)} className="px-3 py-2 bg-white border rounded-md text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Main Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div
          className={`bg-white shadow-lg rounded-2xl p-8 w-full max-w-md transform transition-all duration-700 ease-out ${
            animateForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-100px]"
          }`}>
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
                maxLength={7}
              />
            </div>

            <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition">
              Check Details
            </button>
          </form>

          {isLoading && (
            <div className="mt-6 p-4 border rounded-lg bg-yellow-50 text-yellow-800 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-3"></div>
              {showServerWakeupMessage ? <p>Waking up the server... this may take 10–15 seconds ⏳</p> : <p>Loading...</p>}
            </div>
          )}

          {errorData && (
            <div className="p-4 mb-4 mt-2 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <p>Flat number {flatNumber} is not registered as a flat owner as per our records.</p>
              <p>
                Please "
                <a href="https://forms.gle/yNuHstwnP9ThGW9u9" target="blank" className="text-blue-900 font-bold hover:underline hover:text-blue-600">
                  Click Here
                </a>
                " to submit a your member details.
              </p>
            </div>
          )}

          {memberData && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-100">
              <div c>
                <h2 className="text-lg font-semibold mb-2 text-center underline">Member Details</h2>
                <p>
                  <strong>Flat Number:</strong> {memberData.flatNumber}
                </p>
                <p>
                  <strong>membershipId:</strong> {changeMemberId(memberData.membershipId)}
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
              </div>

              {/* Update Button (opens modal with instructions) */}
              <button onClick={() => setShowUpdateModal(true)} className="mt-3 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg">
                Update Details
              </button>

              {/* Phone Verification */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Use the phone number <b>shown above</b> (first number on record) to verify your account. To update your details click on{" "}
                  <b>Update Details.</b>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter full phone number"
                  disabled={isPhoneVerified}
                  maxLength={10}
                />
              </div>

              {numberError && <p className="text-red-600 mt-2">{numberError}</p>}

              {!isPhoneVerified ? (
                <button onClick={handleVerifyPhone} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg">
                  Verify Phone Number
                </button>
              ) : (
                <>
                  <p className="text-white mt-2 bg-green-500 px-3 py-1 rounded-lg text-sm">
                    Phone number matches the apartment owner's phone number.
                  </p>

                  {/* First-time Send OTP button (shown only until otpSent) */}
                  {!otpSent && (
                    <button
                      onClick={handleSendOtp}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center"
                      disabled={otpLoading}>
                      {otpLoading ? (
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      ) : null}
                      {otpLoading ? "Sending OTP..." : "Send OTP"}
                    </button>
                  )}

                  {/* After OTP sent: show inputs */}
                  {otpSent && (
                    <>
                      <div className="mt-4 flex gap-2 justify-center">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e, idx)}
                            onKeyDown={(e) => handleOtpBackspace(e, idx)}
                            className="w-12 h-12 text-center border rounded-lg text-lg"
                            disabled={isOtpVerified}
                          />
                        ))}
                      </div>

                      {otpError && <p className="text-red-600 mt-2 text-center">{otpError}</p>}

                      {!isOtpVerified && (
                        <div className="flex flex-col items-center">
                          <button
                            onClick={handleVerifyOtp}
                            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center justify-center mx-auto"
                            disabled={verifyOtpLoading}>
                            {verifyOtpLoading ? (
                              <svg
                                className="animate-spin h-5 w-5 mr-2 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                              </svg>
                            ) : null}
                            {verifyOtpLoading ? "Verifying..." : "Verify OTP"}
                          </button>

                          {/* Resend OTP small link with 30s cooldown */}
                          <div className="mt-2">
                            <button
                              onClick={handleResendOtp}
                              className="text-blue-600 text-sm underline disabled:opacity-50"
                              disabled={otpCooldown > 0 || otpLoading}>
                              {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : "Resend OTP"}
                            </button>
                          </div>
                        </div>
                      )}

                      {isOtpVerified && (
                        <div className="mt-4 text-center">
                          <p className="text-green-600 mt-2">✅ OTP verified successfully!</p>
                          <button
                            onClick={() => generateCertificatePdf(memberData).catch(() => alert("Failed to generate certificate. Please try again."))}
                            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                            Download your certificate
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 mt-8">© {new Date().getFullYear()} Great Value Sharanam AOA</footer>
    </div>
  );
}
