import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI, userAPI } from "../../utils/api";

const CARD_GLASS_ACTIVE =
  "bg-white/20 backdrop-blur-lg border border-white/30 text-white shadow-xl";
const BUTTON_GLASS_ACTIVE_SOLID =
  "bg-white text-black text-base font-medium border border-white/40 shadow-lg transition duration-200 hover:bg-gray-100";
const INPUT_GLASS =
  "w-full p-4 rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/20 placeholder-white/60 focus:ring-1 focus:ring-white focus:border-white transition";
const CARD_BODY_INACTIVE = "text-white/80";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // 'email' | 'otp'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  // Timer for resend OTP
  React.useEffect(() => {
    if (step === "otp" && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [step, resendTimer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authAPI.sendEmailOTP(email);
      setStep("otp");
      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Verify OTP - returns token and user data on success
      const response = await authAPI.verifyEmailOTP(email, otp);
      // Get user profile to determine where to navigate
      const userData = response.user || await userAPI.getProfile();
      if (userData.approval && userData.onboardingComplete) {
        navigate("/home");
        return;
      }
      // If not approved and not onboarding complete, go to user-info (new user)
      if (!userData.approval && !userData.onboardingComplete) {
        navigate("/user-info");
        return;
      }
      // If not approved but onboarding complete, go to waitlist status
      if (!userData.approval && userData.onboardingComplete) {
        navigate("/waitlist-status");
        return;
      }
      // If approved but onboarding not complete, go to user-intent
      if (userData.approval && !userData.onboardingComplete) {
        navigate("/user-intent");
        return;
      }
      // Default fallback
      navigate("/waitlist-status");
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    try {
      await authAPI.resendEmailOTP(email);
      setResendTimer(30);
      setCanResend(false);
      setOtp("");
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center relative px-6">
      <div
        className="absolute inset-0 bg-black/40 z-0"
        style={{
          backgroundImage: `url('/bgs/bg-verification.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
        }}
      ></div>
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      <div className="absolute top-10 w-full text-center text-white text-2xl font-semibold z-10">
        Sundate
      </div>
      <div className={`relative z-10 w-full max-w-sm p-6 pt-10 pb-8 rounded-3xl ${CARD_GLASS_ACTIVE} flex flex-col items-center mt-28`}>
        {step === "email" && (
          <form className="w-full space-y-4" onSubmit={handleSendOTP}>
            <h2 className="text-white text-2xl font-bold mb-6 text-center">Sign In</h2>
            <input
              type="email"
              placeholder="Email"
              className={INPUT_GLASS}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <div className="text-red-300 text-sm">{error}</div>}
            <button
              type="submit"
              className={BUTTON_GLASS_ACTIVE_SOLID + " w-full py-4 rounded-xl mt-6"}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            <div className="pt-4 text-center text-sm">
              <span className={CARD_BODY_INACTIVE}>Don&apos;t have an account?</span>
              <Link
                to="/signup"
                className="text-white font-medium hover:text-white/80 transition ml-1"
              >
                Sign Up
              </Link>
            </div>
          </form>
        )}
        {step === "otp" && (
          <form className="w-full space-y-4" onSubmit={handleVerifyOTP}>
            <h2 className="text-white text-2xl font-bold mb-6 text-center">Enter OTP</h2>
            <div className="text-white/80 text-sm mb-2 text-center">Enter the 6-digit code sent to {email}</div>
            <input
              type="text"
              maxLength={6}
              placeholder="6-digit OTP"
              className={INPUT_GLASS}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              required
            />
            <div className="text-white/60 text-xs mb-2 text-center">
              {canResend ? (
                <button type="button" onClick={handleResendOTP} className="text-white underline hover:text-white/80">Resend OTP</button>
              ) : (
                <span>Resend in {resendTimer}s</span>
              )}
            </div>
            {error && <div className="text-red-300 text-sm">{error}</div>}
            <button
              type="submit"
              className={BUTTON_GLASS_ACTIVE_SOLID + " w-full py-4 rounded-xl mt-6"}
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <div className="pt-4 text-center text-sm">
              <span className={CARD_BODY_INACTIVE}>Entered wrong email?</span>
              <button type="button" className="text-white font-medium hover:text-white/80 transition ml-1" onClick={() => { setStep("email"); setOtp(""); setError(""); }}>
                Go Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
