import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

const BUTTON_SOLID =
  "bg-white text-black text-base font-medium rounded-lg transition duration-200 hover:bg-gray-100 disabled:opacity-60";
const INPUT_CLEAN =
  "w-full p-4 rounded-lg bg-black/40 text-white border border-white/20 placeholder-white/60 focus:ring-1 focus:ring-white focus:border-white transition";

const Header = () => (
  <div className="pt-10 w-full text-center z-10">
    <h1 className="text-white text-base font-semibold">Sundate</h1>
  </div>
);

export default function Verification() {
  const navigate = useNavigate();
  const [step, setStep] = useState("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(120);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleSendOtp = async () => {
    if (mobileNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // For development - log the OTP
      if (data.otp) {
        console.log('Development OTP:', data.otp);
      }

      setTimer(120);
      setStep("otp");
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setStep("success");
    } catch (err) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const MobileStep = (
    <>
      <h2 className="text-white text-lg font-semibold mb-2">
        Verify your number
      </h2>
      <p className="text-white/80 text-sm mb-8">
        Let's get your number verified with an OTP
      </p>

      <input
        type="tel"
        value={mobileNumber}
        onChange={(e) => {
          setMobileNumber(e.target.value.replace(/[^0-9]/g, ''));
          setError("");
        }}
        placeholder="Enter Mobile number"
        className={INPUT_CLEAN + " mb-4"}
        maxLength={10}
      />

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      <button
        onClick={handleSendOtp}
        disabled={loading || mobileNumber.length < 10}
        className={BUTTON_SOLID + " w-full py-4 mt-4"}
      >
        {loading ? 'Sending...' : 'Next'}
      </button>
    </>
  );

  const OtpStep = (
    <>
      <h2 className="text-white text-lg font-semibold mb-2">
        Enter verification code
      </h2>
      <p className="text-white/80 text-sm mb-8">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-white">
          +91 {mobileNumber || "9833540192"}
        </span>
      </p>

      <input
        type="number"
        value={otp}
        onChange={(e) => {
          setOtp(e.target.value.slice(0, 6));
          setError("");
        }}
        placeholder="------"
        className={INPUT_CLEAN + " text-center tracking-widest text-lg mb-4"}
      />

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
      )}

      <div className="w-full mb-10 text-left text-sm">
        {timer > 0 ? (
          <p className="text-white/70">
            {(() => {
              const min = Math.floor(timer / 60);
              const sec = timer % 60;
              return `Resend OTP in ${min}:${sec.toString().padStart(2, "0")}`;
            })()}
          </p>
        ) : (
          <button
            onClick={handleSendOtp}
            className="text-white font-medium hover:text-white/80"
          >
            Resend OTP
          </button>
        )}
      </div>

      <button
        onClick={handleVerifyOtp}
        disabled={loading || otp.length !== 6}
        className={BUTTON_SOLID + " w-full py-4"}
      >
        {loading ? 'Verifying...' : 'Next'}
      </button>
    </>
  );

  const SuccessStep = (
    <div className="flex flex-col items-center text-center py-12">
      <div className="relative w-26 h-26 mb-6 flex items-center justify-center" style={{ width: '104px', height: '104px' }}>
        {/* Three concentric circles behind the tick icon */}
        <span className="absolute rounded-full z-0 verification-pulse" style={{ width: '140px', height: '140px', background: '#4CAF50', opacity: 0.2 }}></span>
        <span className="absolute rounded-full z-0 verification-pulse" style={{ width: '110px', height: '110px', background: '#4CAF50', opacity: 0.4, animationDelay: '0.4s' }}></span>
        <span className="absolute rounded-full z-0" style={{ width: '80px', height: '80px', background: '#4CAF50', opacity: 0.7 }}></span>
        {/* Main success icon */}
        <span className="relative flex items-center justify-center rounded-full z-10" style={{ width: '104px', height: '104px', background: 'rgba(76,175,80,0.12)' }}>
          <img
            src="/verification-tick.svg"
            alt="Success"
            className="w-10 h-10"
            style={{ width: '30px', height: '30px' }}
          />
        </span>
      </div>
      <h2 className="text-white text-lg font-semibold mb-2 pt-4">
        Verification successful
      </h2>
      <p className="text-white/80 text-sm mb-10">
        Start your application process
      </p>
      <button
        onClick={() => navigate("/login")}
        className={BUTTON_SOLID + " w-full py-4"}
      >
        Next
      </button>
    </div>
  );
  // Uses the same pulse animation classes as WaitlistStatus.jsx for reliable movement


  let content;
  if (step === "mobile") content = MobileStep;
  else if (step === "otp") content = OtpStep;
  else content = SuccessStep;

  return (
    <div className="h-screen w-screen flex flex-col items-center relative px-6">
      {/* Background with blur */}
      <div
        className="absolute inset-0 bg-black/40 z-0"
        style={{
          backgroundImage: `url('/bgs/bg-verification.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
        }}
      ></div>

      {/* Foreground overlay for readability */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <Header />

      {/* Content pinned to top, not middle */}
      <div className="relative z-10 w-full max-w-sm mt-12">
        {content}
      </div>
    </div>
  );
}
