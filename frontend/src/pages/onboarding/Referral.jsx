import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Referral() {
  // State management for component's flow and data
  const [step, setStep] = useState(1); // Controls the current step in the referral process
  const [referralCode, setReferralCode] = useState(['', '', '', '', '', '']); // Stores the referral code digits (unused in current flow)
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Stores the OTP digits for verification
  const inputRefs = useRef([]); // Ref for referral code input fields (unused in current flow)
  const otpInputRefs = useRef([]); // Ref for OTP input fields
  const navigate = useNavigate(); // Hook for navigation between routes

  // UI state for modals and timers
  const [showInvalidCodeModal, setShowInvalidCodeModal] = useState(false); // Controls visibility of the invalid code/OTP modal
  const [showContactPermissionModal, setShowContactPermissionModal] = useState(false); // Controls visibility of the contact permission modal
  const [resendTimer, setResendTimer] = useState(60); // Countdown for OTP resend
  const [canResendOtp, setCanResendOtp] = useState(false); // Flag to enable/disable resend OTP button

  // Progress bar calculation
  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  // --- Referral Code Handlers (Currently not actively used in the visible flow but kept for potential re-introduction) ---
  const handleReferralCodeChange = (e, index) => {
    const { value } = e.target;
    const newCode = [...referralCode];

    // Handle single digit input and focus management
    if (value.length === 1 && /^\d$/.test(value)) {
      newCode[index] = value;
      setReferralCode(newCode);
      if (index < referralCode.length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    } else if (value.length === 0) {
      // Handle backspace to clear and move focus back
      newCode[index] = '';
      setReferralCode(newCode);
      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleReferralCodeKeyDown = (e, index) => {
    if (e.key === 'Backspace' && referralCode[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // --- OTP Handlers (for Step 2: OTP Verification) ---
  const handleOtpChange = (e, index) => {
    const { value } = e.target;
    const newOtp = [...otp];

    // Handle single digit input for OTP and manage focus
    if (value.length === 1 && /^\d$/.test(value)) {
      newOtp[index] = value;
      setOtp(newOtp);
      if (index < otp.length - 1 && otpInputRefs.current[index + 1]) {
        otpInputRefs.current[index + 1].focus();
      }
    } else if (value.length === 0) {
      // Handle backspace to clear OTP digit and move focus back
      newOtp[index] = '';
      setOtp(newOtp);
      if (index > 0 && otpInputRefs.current[index - 1]) {
        otpInputRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  // Check if all OTP digits are filled and are valid numbers
  const isOtpComplete = otp.every(digit => digit !== '' && /^\d$/.test(digit));

  // Function to handle OTP submission
  const handleSubmitOtp = () => {
    const fullOtp = otp.join('');
    // Validate for a 6-digit numeric OTP
    if (fullOtp.length === 6 && /^\d{6}$/.test(fullOtp)) {
      console.log("OTP Submitted:", fullOtp);
      // Since the request is to allow any 6-digit code, we directly navigate
      navigate('/application-status'); // Navigate on successful verification
    } else {
      // If the code is not 6 digits or contains non-numeric characters, show invalid modal
      setShowInvalidCodeModal(true);
    }
  };

  // --- Resend OTP Timer Effect ---
  useEffect(() => {
    let timer;
    // Start timer only for step 2 and if timer is greater than 0
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prevTime => prevTime - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      // Enable resend button when timer runs out
      setCanResendOtp(true);
    }
    // Cleanup interval on component unmount or when dependencies change
    return () => clearInterval(timer);
  }, [step, resendTimer]); // Dependencies: step and resendTimer

  // Formats remaining seconds into MM:SS format
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handles resending OTP
  const handleResendOtp = () => {
    setResendTimer(60); // Reset timer
    setCanResendOtp(false); // Disable resend button
    setOtp(['', '', '', '', '', '']); // Clear current OTP input fields
    otpInputRefs.current[0]?.focus(); // Focus on the first OTP input field
    console.log("Resending OTP...");
    // TODO: Add actual API call to resend OTP here
  };

  // Handles navigation back to previous step or route
  const handleBack = () => {
    if (step === 1) {
      navigate(-1); // Go back in browser history
    } else if (step === 2) {
      setStep(1); // Go back to step 1
    }
  };

  // Handles moving to the next step, specifically showing the contact permission modal
  const handleNext = () => {
    setShowContactPermissionModal(true);
  };

  // Handles actions taken within the contact permission modal (Allow/Deny)
  const handleContactModalAction = (action) => {
    setShowContactPermissionModal(false); // Close the modal
    setStep(2); // Proceed to step 2 regardless of allowance
    // Reset OTP state and timer when moving to step 2
    setOtp(['', '', '', '', '', '']);
    setResendTimer(60);
    setCanResendOtp(false);

    // Log user's choice for debugging/analytics
    if (action === 'allow') {
      console.log('User allowed contact access.');
      // TODO: Potentially trigger native contact permission request here
    } else {
      console.log('User denied contact access.');
    }
  };

  // Handles closing the invalid code/OTP modal
  const handleCloseInvalidCodeModal = () => {
    setShowInvalidCodeModal(false);
  };

  return (
    <div className="h-screen bg-white px-6 py-6 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="w-6 h-6 flex items-center justify-center"
        >
          <img src="/backarrow.svg" alt="Back" width={24} height={24} />
        </button>
        <div className="text-gray-400 text-[14px] font-semibold mx-auto">
          ThursDate.
        </div>
        <div style={{ width: 24 }}></div> {/* Spacer to balance header */}
      </div>

      {/* Top Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
        <div
          className="bg-[#222222] h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Step 1: Add Referrals Introduction */}
      {step === 1 && (
        <>
          <div className="flex flex-col items-center justify-center flex-1">
            <img src="/referral.png" alt="Referral Icon" className="h-32 mb-4" />
            <h1 className="text-xl font-semibold text-black mb-2 text-center">
              Add your referrals
            </h1>
            <p className="text-center text-gray-500 text-sm max-w-md">
              You’re not getting in alone. Drop a name,
            </p>
            <p className="text-center text-gray-500 text-sm max-w-md mb-6">
              get their nod, and we’ll hold the door.
            </p>
          </div>

          {/* CTA Button for Step 1 */}
          <div className="w-full mb-10">
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-xl bg-[#222222] text-white text-sm font-medium hover:bg-[#333333] transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Step 2: Enter OTP Verification */}
      {step === 2 && (
        <div className="flex flex-col flex-1">
          <h1 className="text-xl font-semibold mb-1">Verify referral code</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your 6-digit referral code below</p>

          {/* OTP input fields */}
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric" // Suggest numeric keyboard on mobile
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(e, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                ref={el => otpInputRefs.current[index] = el}
                className="w-12 h-16 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          {/* Next button for Step 2 */}
          <button
            disabled={!isOtpComplete} // Disable button if OTP is not complete
            onClick={handleSubmitOtp}
            className={`w-full py-4 rounded-xl text-white font-medium text-sm ${
              isOtpComplete ? "bg-black" : "bg-gray-300 cursor-not-allowed" // Dynamic styling
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* --- Modals --- */}
      {/* Simulated iOS-style Invalid Code/OTP Modal */}
      {showInvalidCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full text-center">
            <p className="text-lg font-semibold mb-2">Invalid Code</p>
            <p className="text-gray-600 text-sm mb-6">
              Please enter a valid 6-digit code.
            </p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleCloseInvalidCodeModal}
                className="w-full py-3 rounded-lg text-blue-600 font-bold border-t border-gray-200 pt-3"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Simulated iOS-style Contact Permission Modal */}
      {showContactPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#515151] rounded-xl shadow-lg w-72 text-center overflow-hidden">
            <div className="p-4 pt-5">
              <p className="text-white text-[17px] font-semibold mb-1">
                "ThursDate" would like to access your contacts
              </p>
              <p className="text-[#D0D0D0] text-[13px] leading-tight px-2">
                To better understand your connection to our community, we recommend allowing full access on the next steps
              </p>
            </div>
            <div className="flex border-t border-[#636363]">
              <button
                onClick={() => handleContactModalAction('deny')}
                className="flex-1 py-2 text-blue-400 font-normal text-[17px] border-r border-[#636363]"
              >
                Don't allow
              </button>
              <button
                onClick={() => handleContactModalAction('allow')}
                className="flex-1 py-2 text-blue-400 font-normal tsext-[17px]"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
