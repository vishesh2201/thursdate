import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import emailConfirmIcon from "../../../public/email-confirm-icon.svg";
import { userAPI } from '../../utils/api';

export default function SocialPresence() {
    const navigate = useNavigate();

    // === STATES ===
    const [email, setEmail] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState("");
    const [step, setStep] = useState(1);
    const [instagram, setInstagram] = useState(""); // Reused for all inputs
    const [showInstaConfirm, setShowInstaConfirm] = useState(false);
    const [confirmInstagram, setConfirmInstagram] = useState("");
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [instaCode, setInstaCode] = useState("");
    const [codeVerified, setCodeVerified] = useState(false);
    const [showAltVerification, setShowAltVerification] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState("instagram");
    const [showUpload, setShowUpload] = useState(false);
    const [uploadStep, setUploadStep] = useState("front"); // 'front' or 'back'
    const [licenseFrontPreview, setLicenseFrontPreview] = useState(null);
    const [licenseBackPreview, setLicenseBackPreview] = useState(null);
    const [licenseVerified, setLicenseVerified] = useState(false);

    // OTP Timer (Aadhaar only)
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    // === GLASS STYLES ===
    const INPUT_GLASS =
        "bg-white/20 backdrop-blur-sm placeholder-white/80 text-white border-white/30";
    const BUTTON_GLASS_ACTIVE =
        "bg-white/30 backdrop-blur-md text-white border border-white/40 shadow-lg";
    const BUTTON_GLASS_INACTIVE =
        "bg-white/10 text-white/50 cursor-not-allowed border border-white/20";

    // === VALIDATIONS ===
    const isEmailValid = email.trim() && /.+@.+\..+/.test(email);
    const isConfirmValid = confirmEmail.trim() && confirmEmail === email;

    const isInputValid = () => {
        if (!instagram.trim()) return false;
        if (verificationMethod === "aadhaar") return instagram.length === 12;
        if (verificationMethod === "linkedin") return instagram.includes("linkedin.com/in/");
        return true;
    };

    const isConfirmInputValid = confirmInstagram.trim() === instagram;

    // === TIMER LOGIC ===
    useEffect(() => {
        if (showCodeInput && verificationMethod === "aadhaar" && resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
    }, [resendTimer, showCodeInput, verificationMethod]);

    // cleanup object URLs when component unmounts
    useEffect(() => {
        return () => {
            try { if (licenseFrontPreview) URL.revokeObjectURL(licenseFrontPreview); } catch (e) { }
            try { if (licenseBackPreview) URL.revokeObjectURL(licenseBackPreview); } catch (e) { }
        };
    }, [licenseFrontPreview, licenseBackPreview]);

    // === HANDLERS ===
    const handleResendOTP = () => {
        setResendTimer(30);
        setCanResend(false);
        setInstaCode("");
    };

    const handleGetOTP = () => {
        setShowInstaConfirm(true);
        setShowCodeInput(true);
        setResendTimer(30);
        setCanResend(false);
        setInstaCode("");
    };

    const handleStartVerification = () => {
        if (verificationMethod === "instagram" || verificationMethod === "linkedin") {
            setShowInstaConfirm(true);
        } else if (verificationMethod === "aadhaar" && instagram.length === 12) {
            handleGetOTP();
        }
    };

    const handleConfirmAndProceed = () => {
        setShowCodeInput(true);
    };

    const handleVerifyCode = async () => {
        const requiredLength = verificationMethod === "aadhaar" ? 6 : 4;
        if (instaCode.length === requiredLength) {
            setCodeVerified(true);

            // Save Instagram/LinkedIn to database
            if (verificationMethod === "instagram" || verificationMethod === "linkedin") {
                try {
                    const updateData = {};
                    if (verificationMethod === "instagram") {
                        updateData.instagram = instagram.startsWith('@') ? instagram.substring(1) : instagram;
                    } else if (verificationMethod === "linkedin") {
                        updateData.linkedin = instagram; // Full URL or username
                    }
                    await userAPI.updateProfile(updateData);
                } catch (err) {
                    console.error('Failed to save social profile:', err);
                    // Continue anyway - don't block user
                }
            }
        }
    };

    // === RENDER ===
    return (
        <div
            className="h-screen flex flex-col font-sans relative"
            style={{
                backgroundImage: `url('/bgs/socialpresencebg.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            {/* Dim Modal Background */}
            {showAltVerification && (
                <div className="fixed inset-0 bg-black/60 z-30 transition-opacity"></div>
            )}

            {/* Main Content */}
            <div className="relative z-40 p-6 pt-10 flex flex-col flex-grow bg-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div style={{ width: 24 }}></div>
                    <div className="text-white/80 text-[24px] font-semibold mx-auto">
                        Sundate.
                    </div>
                    <div style={{ width: 24 }}></div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/30 rounded-full h-1.5 mb-8">
                    <div
                        className="bg-white h-1.5 rounded-full transition-all duration-300 shadow-md"
                        style={{ width: step === 1 ? "50%" : "100%" }}
                    ></div>
                </div>

                {/* === STEP 1: EMAIL === */}
                {step === 1 && (
                    <div className="flex flex-col flex-grow">
                        <h1 className="text-2xl font-normal mb-6 text-white drop-shadow-md">
                            What's your email?
                        </h1>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className={`w-full px-4 py-4 border rounded-xl text-sm mb-auto transition ${INPUT_GLASS}`}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && isEmailValid) setShowConfirm(true);
                            }}
                        />

                        {!showConfirm && (
                            <button
                                disabled={!isEmailValid}
                                onClick={() => setShowConfirm(true)}
                                className={`w-full py-4 rounded-xl font-medium text-lg mt-8 transition ${!isEmailValid ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                            >
                                Next
                            </button>
                        )}

                        {/* Email Confirm Modal */}
                        {showConfirm && (
                            <div className="fixed left-0 right-0 bottom-0 flex justify-center items-end pb-6 z-50">
                                <div className="w-full max-w-sm mx-auto rounded-3xl bg-white/20 backdrop-blur-lg shadow-2xl p-6 flex flex-col items-center border border-white/30">
                                    <img src={emailConfirmIcon} alt="Email" className="w-14 h-14 mb-4" />
                                    <div className="text-white text-lg font-semibold mb-2">Email Confirmation</div>
                                    <div className="text-white/80 text-sm mb-6 text-center">
                                        Please confirm your email address for verification and account recovery.
                                    </div>
                                    <div className="w-full flex items-center bg-white/10 rounded-xl px-3 py-2 mb-4 border border-white/20">
                                        <input
                                            type="email"
                                            value={confirmEmail}
                                            onChange={(e) => setConfirmEmail(e.target.value)}
                                            placeholder="Confirm your email"
                                            className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-sm"
                                        />
                                        <button
                                            className="ml-2 text-white/70 hover:text-white"
                                            onClick={() => setConfirmEmail("")}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        disabled={!isConfirmValid}
                                        onClick={() => {
                                            setStep(2);
                                            setShowConfirm(false);
                                        }}
                                        className={`w-full py-4 rounded-xl font-medium text-lg transition ${!isConfirmValid ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                    >
                                        Looks good! Continue
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* === STEP 2: VERIFICATION === */}
                {step === 2 && (
                    <div className="flex flex-col flex-grow justify-between">
                        <div>
                            {/* === DRIVING LICENSE SCREEN === */}
                            {verificationMethod === "license" ? (
                                showUpload ? (
                                    // ---------- UPLOAD SCREEN ----------
                                    <div className="flex flex-col flex-grow px-6">
                                        <h1 className="text-2xl font-normal text-left text-white mb-3 drop-shadow-md">
                                            {uploadStep === "front" ? "Upload front of license" : "Upload back of license"}
                                        </h1>
                                        <p className="text-white/80 text-sm mb-8 text-left leading-relaxed">
                                            {uploadStep === "front"
                                                ? "Please upload a clear photo of the front of your driver's license."
                                                : "Please upload a clear photo of the back of your driver's license."}
                                        </p>

                                        {/* Upload Area */}
                                        <div className="flex justify-center">
                                            <label
                                                htmlFor={`license-upload-${uploadStep}`}
                                                className="flex flex-col items-center justify-center w-full max-w-[280px] h-[180px] border-2 border-dashed border-white/50 rounded-2xl bg-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition"
                                            >
                                                {uploadStep === "front" && licenseFrontPreview ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={licenseFrontPreview} alt="Front preview" className="w-full h-full object-contain rounded-2xl" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // remove preview and clear input
                                                                try { URL.revokeObjectURL(licenseFrontPreview); } catch (err) { }
                                                                setLicenseFrontPreview(null);
                                                                const input = document.getElementById('license-upload-front');
                                                                if (input) input.value = '';
                                                            }}
                                                            className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : uploadStep === "back" && licenseBackPreview ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={licenseBackPreview} alt="Back preview" className="w-full h-full object-contain rounded-2xl" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                try { URL.revokeObjectURL(licenseBackPreview); } catch (err) { }
                                                                setLicenseBackPreview(null);
                                                                const input = document.getElementById('license-upload-back');
                                                                if (input) input.value = '';
                                                            }}
                                                            className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="48"
                                                            height="48"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={1.5}
                                                            className="text-white/70 mb-2"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                                            />
                                                        </svg>
                                                        <p className="text-white text-sm font-medium">Tap to upload your photo</p>
                                                        <p className="text-white/60 text-xs mt-1">JPG, PNG or JPEG (max 10MB)</p>
                                                    </>
                                                )}
                                                <input
                                                    id={`license-upload-${uploadStep}`}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/jpg"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file && file.size <= 10 * 1024 * 1024) {
                                                            // create object URL and set preview for the correct step
                                                            const url = URL.createObjectURL(file);
                                                            if (uploadStep === 'front') {
                                                                // revoke previous if any
                                                                if (licenseFrontPreview) try { URL.revokeObjectURL(licenseFrontPreview); } catch (err) { }
                                                                setLicenseFrontPreview(url);
                                                            } else {
                                                                if (licenseBackPreview) try { URL.revokeObjectURL(licenseBackPreview); } catch (err) { }
                                                                setLicenseBackPreview(url);
                                                            }
                                                            // TODO: upload to backend if desired
                                                        } else if (file) {
                                                            alert("File too large. Max 10MB.");
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        {/* Continue Button (enabled even if no file is uploaded) */}
                                        <button
                                            onClick={() => {
                                                if (uploadStep === "front") {
                                                    setUploadStep("back");
                                                } else {
                                                    // mark as verified locally and show confirmation
                                                    setLicenseVerified(true);
                                                    // keep the previews visible; user can continue after confirmation
                                                }
                                            }}
                                            className={`w-full py-4 rounded-full font-medium text-lg mt-8 transition ${BUTTON_GLASS_ACTIVE}`}
                                        >
                                            {uploadStep === "front" ? "Continue" : "Finish"}
                                        </button>
                                    </div>
                                ) : (
                                    // ---------- INFO SCREEN ----------
                                    <>
                                        <h1 className="text-2xl font-normal text-white mb-3 mt-4 drop-shadow-md">
                                            Verify with Driving License
                                        </h1>
                                        <p className="text-white/80 text-sm mb-8 leading-relaxed">
                                            To complete your verification, we'll need photos of your driver's license.
                                        </p>

                                        {/* Sample Images */}
                                        <div className="flex gap-4 justify-center mb-8 px-4">
                                            <div className="flex-1 max-w-[140px]">
                                                <img
                                                    src="/frontLicense.jpg"
                                                    alt="Front of license sample"
                                                    className="w-full h-auto rounded-xl shadow-lg border border-white/20"
                                                />
                                            </div>
                                            <div className="flex-1 max-w-[140px]">
                                                <img
                                                    src="/backLicense.jpg"
                                                    alt="Back of license sample"
                                                    className="w-full h-auto rounded-xl shadow-lg border border-white/20"
                                                />
                                            </div>
                                        </div>

                                        {/* Note Box */}
                                        <div className="bg-transparent rounded-2xl p-5 mb-8">
                                            <p className="text-white/90 text-sm font-medium mb-2">Note:</p>
                                            <ul className="text-white/70 text-xs space-y-1.5 list-disc pl-5">
                                                <li>Make sure all text is readable and the photo is clear.</li>
                                                <li>Your information is encrypted and never shared with third parties.</li>
                                                <li>This verification usually takes less than 2 minutes to complete.</li>
                                            </ul>
                                        </div>
                                    </>
                                )
                            ) : (
                                <>
                                    {/* === INPUT SCREEN (Instagram / LinkedIn / Aadhaar) === */}
                                    <h1 className="text-xl font-normal text-white mb-2 mt-2">
                                        {verificationMethod === "instagram"
                                            ? "Add your Instagram handle"
                                            : verificationMethod === "linkedin"
                                                ? "Enter your LinkedIn profile"
                                                : "Verify with Aadhaar Card"}
                                    </h1>
                                    <p className="text-white/70 text-xs mb-6">
                                        {verificationMethod === "instagram"
                                            ? "This is only for verification and won't appear on your profile."
                                            : verificationMethod === "linkedin"
                                                ? "We’ll send a 4-digit code to your LinkedIn DM."
                                                : "Enter your 12-digit Aadhaar number to receive an OTP."}
                                    </p>
                                    <div className="mb-8">
                                        <div className={`flex items-center border rounded-xl ${INPUT_GLASS}`}>
                                            {verificationMethod === "instagram" && (
                                                <span className="pl-4 pr-1 pb-1 text-white/70 text-lg">@</span>
                                            )}
                                            {verificationMethod === "linkedin" && (
                                                <span className="pl-4 pr-1 text-white/70 text-sm">in/</span>
                                            )}
                                            <input
                                                type="text"
                                                inputMode={verificationMethod === "aadhaar" ? "numeric" : "text"}
                                                maxLength={verificationMethod === "aadhaar" ? 12 : undefined}
                                                value={instagram}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    const sanitized = verificationMethod === "aadhaar"
                                                        ? raw.replace(/\D/g, "").slice(0, 12)
                                                        : raw;
                                                    setInstagram(sanitized);
                                                }}
                                                placeholder={
                                                    verificationMethod === "instagram"
                                                        ? "Enter your Instagram username"
                                                        : verificationMethod === "linkedin"
                                                            ? "yourname"
                                                            : "Enter 12-digit Aadhaar number"
                                                }
                                                className="flex-1 pr-4 py-4 bg-transparent border-0 outline-none text-sm text-white placeholder-white/80"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && isInputValid()) {
                                                        handleStartVerification();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* === BUTTON BAR === */}
                        <div className="flex flex-col gap-4 pb-2">
                            {/* Instagram */}
                            {verificationMethod === "instagram" && !showInstaConfirm && !showAltVerification && (
                                <>
                                    <button
                                        disabled={!isInputValid()}
                                        onClick={handleStartVerification}
                                        className={`w-full py-4 rounded-full font-medium text-lg transition ${!isInputValid() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                    >
                                        Verify Instagram
                                    </button>
                                    <button
                                        className="w-full py-4 rounded-full font-medium text-lg border border-white/40 text-white bg-black/30 hover:bg-black/50 transition"
                                        onClick={() => setShowAltVerification(true)}
                                    >
                                        I don’t have Instagram
                                    </button>
                                </>
                            )}

                            {/* LinkedIn */}
                            {verificationMethod === "linkedin" && !showInstaConfirm && !showAltVerification && (
                                <>
                                    <button
                                        disabled={!isInputValid()}
                                        onClick={handleStartVerification}
                                        className={`w-full py-4 rounded-full font-medium text-lg transition ${!isInputValid() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                    >
                                        Verify LinkedIn
                                    </button>
                                    <button
                                        className="w-full py-4 rounded-full font-medium text-lg border border-white/40 text-white bg-black/30 hover:bg-black/50 transition"
                                        onClick={() => setShowAltVerification(true)}
                                    >
                                        I don’t have LinkedIn
                                    </button>
                                </>
                            )}

                            {/* Aadhaar */}
                            {verificationMethod === "aadhaar" && !showInstaConfirm && !showAltVerification && (
                                <button
                                    disabled={instagram.length !== 12}
                                    onClick={handleGetOTP}
                                    className={`w-full py-4 rounded-full font-medium text-lg transition ${instagram.length !== 12 ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                >
                                    Get OTP
                                </button>
                            )}

                            {/* Driving License Continue */}
                            {verificationMethod === "license" && !showInstaConfirm && !showUpload && (
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="w-full py-4 rounded-full font-medium text-lg text-white bg-white/30 backdrop-blur-md border border-white/40 shadow-lg hover:bg-white/40 transition"
                                >
                                    Continue
                                </button>
                            )}

                            {/* === ALTERNATE VERIFICATION MODAL === */}
                            {showAltVerification && (
                                <div className="w-full flex justify-center">
                                    <div className="w-full max-w-sm bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl p-6 flex flex-col gap-4 border border-white/30">

                                        {/* ---------- LINKEDIN (only when coming from Instagram) ---------- */}
                                        {verificationMethod === "instagram" && (
                                            <button
                                                className="w-full py-4 rounded-full font-medium text-lg transition bg-white text-black hover:bg-gray-200"
                                                onClick={() => {
                                                    setVerificationMethod("linkedin");
                                                    setShowAltVerification(false);
                                                }}
                                            >
                                                Continue with LinkedIn
                                            </button>
                                        )}

                                        {/* ---------- "or" separator (only when LinkedIn option is shown) ---------- */}
                                        {verificationMethod === "instagram" && (
                                            <div className="text-center text-white font-medium text-lg">or</div>
                                        )}

                                        {/* ---------- AADHAAR ---------- */}
                                        <button
                                            className="w-full py-4 rounded-full font-medium text-lg transition border border-white/40 text-white bg-black/30 hover:bg-black/50 flex items-center justify-between pl-6 pr-4"
                                            onClick={() => {
                                                setVerificationMethod("aadhaar");
                                                setShowAltVerification(false);
                                            }}
                                        >
                                            <span>Verify with Aadhaar Card</span>
                                            <span className="text-white text-xl">&gt;</span>
                                        </button>

                                        {/* ---------- DRIVING LICENSE ---------- */}
                                        <button
                                            className="w-full py-4 rounded-full font-medium text-lg transition border border-white/40 text-white bg-black/30 hover:bg-black/50 flex items-center justify-between pl-6 pr-4"
                                            onClick={() => {
                                                setVerificationMethod("license");
                                                setShowAltVerification(false);
                                            }}
                                        >
                                            <span>Verify with Driving License</span>
                                            <span className="text-white text-xl">&gt;</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* === LICENSE VERIFIED MODAL === */}
                            {licenseVerified && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center">
                                    <div className="bg-black/60 absolute inset-0"></div>
                                    <div className="relative z-60 w-full max-w-sm p-6 rounded-3xl bg-white/5 backdrop-blur-lg flex flex-col items-center border border-white/20">
                                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500 mb-4 shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                                            </svg>
                                        </div>
                                        <div className="text-white text-lg font-semibold mb-2">License verified</div>
                                        <div className="text-white/80 text-sm mb-4 text-center">Thanks — your driver's license photos were received.</div>
                                        <div className="w-full flex gap-3">
                                            <button
                                                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium"
                                                onClick={() => navigate('/face-verification')}
                                            >
                                                Continue
                                            </button>
                                            <button
                                                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium border border-white/20"
                                                onClick={() => setLicenseVerified(false)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* === CONFIRMATION / OTP MODAL === */}
                        {showInstaConfirm && (
                            <div className="fixed inset-0 flex justify-center items-end pb-6 z-50 px-2">
                                <div className="w-[95vw] max-w-sm mx-auto rounded-3xl bg-white/20 backdrop-blur-lg shadow-2xl p-6 flex flex-col items-center border border-white/30">
                                    {/* Icon & Title */}
                                    {verificationMethod === "instagram" ? (
                                        <>
                                            <img src="/instagram-confirm-icon.svg" alt="Instagram" className="w-20 h-20 mb-2" />
                                            <div className="text-white text-lg font-normal">Instagram Confirmation</div>
                                        </>
                                    ) : verificationMethod === "linkedin" ? (
                                        <>
                                            <img src="/linkedin-confirm-icon.svg" alt="LinkedIn" className="w-20 h-20 mb-2" />
                                            <div className="text-white text-lg font-normal">LinkedIn Confirmation</div>
                                        </>
                                    ) : (
                                        <div className="text-white text-lg font-normal">Aadhaar OTP</div>
                                    )}

                                    {/* Re-enter Input */}
                                    {(verificationMethod === "instagram" || verificationMethod === "linkedin") && !showCodeInput && !codeVerified && (
                                        <>
                                            <div className="text-[#ACACAC] text-sm mb-6 text-center">
                                                Please confirm your {verificationMethod === "instagram" ? "Instagram username" : "LinkedIn profile"} for verification.
                                            </div>
                                            <div className="w-full flex items-center bg-white/10 rounded-xl px-3 py-4 mb-4 border border-white/20">
                                                {verificationMethod === "instagram" && (
                                                    <span className="text-white/70 text-lg mr-2 pb-1">@</span>
                                                )}
                                                {verificationMethod === "linkedin" && (
                                                    <span className="text-white/70 text-sm mr-2">in/</span>
                                                )}
                                                <input
                                                    type="text"
                                                    value={confirmInstagram}
                                                    onChange={(e) => setConfirmInstagram(e.target.value)}
                                                    placeholder={`Confirm your ${verificationMethod === "instagram" ? "username" : "profile"}`}
                                                    className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-sm"
                                                />
                                                <button
                                                    className="ml-2 text-white/70 hover:text-white"
                                                    onClick={() => setConfirmInstagram("")}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                disabled={!isConfirmInputValid}
                                                onClick={handleConfirmAndProceed}
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${!isConfirmInputValid ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                            >
                                                Looks good! Continue
                                            </button>
                                        </>
                                    )}

                                    {/* Code Input */}
                                    {showCodeInput && !codeVerified && (
                                        <div className="w-full flex flex-col items-center mt-2">
                                            <div className="text-white text-base mb-2 text-center">
                                                {verificationMethod === "instagram"
                                                    ? "Enter the 4-digit code sent to your Instagram DM"
                                                    : verificationMethod === "linkedin"
                                                        ? "Enter the 4-digit code sent to your LinkedIn DM"
                                                        : "Enter the 6-digit OTP sent to your Aadhaar-linked mobile"}
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={verificationMethod === "aadhaar" ? 6 : 4}
                                                value={instaCode}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                                    setInstaCode(val);
                                                }}
                                                placeholder={verificationMethod === "aadhaar" ? "6-digit OTP" : "4-digit code"}
                                                className="w-full px-4 py-4 border rounded-xl text-sm mb-2 transition bg-white/20 backdrop-blur-sm text-white placeholder-white/80 border-white/30"
                                            />
                                            {verificationMethod === "aadhaar" && (
                                                <div className="text-white/60 text-xs mb-3">
                                                    {canResend ? (
                                                        <button onClick={handleResendOTP} className="text-white underline hover:text-white/80">
                                                            Resend OTP
                                                        </button>
                                                    ) : (
                                                        <span>Resend in {resendTimer}s</span>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                disabled={instaCode.length !== (verificationMethod === "aadhaar" ? 6 : 4)}
                                                onClick={handleVerifyCode}
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${instaCode.length !== (verificationMethod === "aadhaar" ? 6 : 4) ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                            >
                                                Verify {verificationMethod === "aadhaar" ? "OTP" : "Code"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Success */}
                                    {codeVerified && (
                                        <div className="w-full flex flex-col items-center mt-2">
                                            <div className="flex items-center justify-center mb-4">
                                                <span className="flex items-center justify-center w-20 h-20 rounded-full bg-[#4CAF50]">
                                                    <img src="/verification-tick.svg" alt="Verified" className="w-10 h-10" />
                                                </span>
                                            </div>
                                            <div className="text-white text-center text-base font-semibold leading-tight mb-6">
                                                {verificationMethod === "instagram"
                                                    ? "Your Instagram has been verified successfully."
                                                    : verificationMethod === "linkedin"
                                                        ? "Your LinkedIn has been verified successfully."
                                                        : "Aadhaar verified successfully."}
                                            </div>
                                            <button
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${BUTTON_GLASS_ACTIVE}`}
                                                onClick={() => navigate("/face-verification")}
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}