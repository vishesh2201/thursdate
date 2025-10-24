import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import emailConfirmIcon from "../../../public/email-confirm-icon.svg";

export default function SocialPresence() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState("");
    const [step, setStep] = useState(1); // 1: email, 2: instagram
    const [instagram, setInstagram] = useState("");
    const [showInstaConfirm, setShowInstaConfirm] = useState(false);
    const [confirmInstagram, setConfirmInstagram] = useState("");
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [instaCode, setInstaCode] = useState("");
    const [codeVerified, setCodeVerified] = useState(false);

    // Glassmorphism styles
    const INPUT_GLASS =
        "bg-white/20 backdrop-blur-sm placeholder-white/80 text-white border-white/30";
    const BUTTON_GLASS_ACTIVE =
        "bg-white/30 backdrop-blur-md text-white border border-white/40 shadow-lg";
    const BUTTON_GLASS_INACTIVE =
        "bg-white/10 text-white/50 cursor-not-allowed border border-white/20";

    const isEmailValid = email.trim() && /.+@.+\..+/.test(email);
    const isConfirmValid = confirmEmail.trim() && confirmEmail === email;

    return (
        <div
            className="h-screen flex flex-col font-sans relative"
            style={{
                backgroundImage: `url('/bgs/socialpresencebg.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            {/* Content */}
            <div className="relative z-10 p-6 pt-10 flex flex-col flex-grow bg-white/10">
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

                {/* Step 1: Email */}
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

                        {/* Hide Next when confirmation open */}
                        {!showConfirm && (
                            <button
                                disabled={!isEmailValid}
                                onClick={() => setShowConfirm(true)}
                                className={`w-full py-4 rounded-xl font-medium text-lg mt-8 transition ${!isEmailValid
                                    ? BUTTON_GLASS_INACTIVE
                                    : BUTTON_GLASS_ACTIVE
                                    }`}
                            >
                                Next
                            </button>
                        )}

                        {/* Email Confirmation Card */}
                        {showConfirm && (
                            <div className="fixed left-0 right-0 bottom-0 flex justify-center items-end pb-6 z-50">
                                <div className="w-full max-w-sm mx-auto rounded-3xl bg-white/20 backdrop-blur-lg shadow-2xl p-6 flex flex-col items-center border border-white/30">
                                    <img
                                        src={emailConfirmIcon}
                                        alt="Email Confirmation"
                                        className="w-14 h-14 mb-4"
                                    />
                                    <div className="text-white text-lg font-semibold mb-2">
                                        Email Confirmation
                                    </div>
                                    <div className="text-white/80 text-sm mb-6 text-center">
                                        Please confirm your email address for verification and
                                        account recovery.
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
                                            tabIndex={-1}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke="currentColor"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M18 6 6 18M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>

                                    <button
                                        disabled={!isConfirmValid}
                                        onClick={() => {
                                            setStep(2);
                                            setShowConfirm(false);
                                        }}
                                        className={`w-full py-4 rounded-xl font-medium text-lg transition ${!isConfirmValid
                                            ? BUTTON_GLASS_INACTIVE
                                            : BUTTON_GLASS_ACTIVE
                                            }`}
                                    >
                                        Looks good! Continue
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Instagram */}
                {step === 2 && (
                    <div className="flex flex-col flex-grow justify-between">
                        <div>
                            <h1 className="text-xl font-nomral text-white mb-2 mt-2">
                                Add your Instagram handle
                            </h1>
                            <p className="text-white/70 text-xs mb-6">
                                This is only for verification and won't appear on your profile.
                            </p>
                            <div className="mb-8">
                                <div className={`flex items-center border rounded-xl ${INPUT_GLASS}`}>
                                    <span className="pl-4 pr-1 pb-1 text-white/70 text-lg">@</span>
                                    <input
                                        type="text"
                                        value={instagram}
                                        onChange={(e) => setInstagram(e.target.value)}
                                        placeholder="Enter your Instagram username"
                                        className="flex-1 pr-4 py-4 bg-transparent border-0 outline-none text-sm text-white placeholder-white/80"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && instagram.trim())
                                                setShowInstaConfirm(true);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-4 pb-2">
                            {!showInstaConfirm && (
                                <button
                                    disabled={!instagram.trim()}
                                    onClick={() => setShowInstaConfirm(true)}
                                    className={`w-full py-4 rounded-full font-medium text-lg transition ${!instagram.trim()
                                        ? BUTTON_GLASS_INACTIVE
                                        : BUTTON_GLASS_ACTIVE
                                        }`}
                                >
                                    Verify Instagram
                                </button>
                            )}
                            {!showInstaConfirm && (
                                <button
                                    className="w-full py-4 rounded-full font-medium text-lg border border-white/40 text-white bg-black/30 hover:bg-black/50 transition"
                                >
                                    I don’t have Instagram
                                </button>
                            )}
                        </div>

                        {/* Instagram Confirmation Card */}
                        {showInstaConfirm && (
                            <div className="fixed left-0 right-0 bottom-0 flex justify-center items-end pb-6 z-50 px-2">
                                <div className="w-[95vw] max-w-sm mx-auto rounded-3xl bg-white/20 backdrop-blur-lg shadow-2xl p-6 flex flex-col items-center border border-white/30">

                                    {/* ✅ Show Instagram confirmation icon + inputs only if not verified */}
                                    {!codeVerified && (
                                        <>
                                            <img
                                                src="/instagram-confirm-icon.svg"
                                                alt="Instagram Confirmation"
                                                className="w-20 h-20 mb-2"
                                            />
                                            <div className="text-white text-lg font-normal">
                                                Instagram Confirmation
                                            </div>
                                            <div className="text-[#ACACAC] text-sm mb-6 text-center">
                                                Please confirm your Instagram username for verification and
                                                account recovery.
                                            </div>
                                            <div className="w-full flex items-center bg-white/10 rounded-xl px-3 py-4 mb-4 border border-white/20">
                                                <span className="text-white/70 text-lg mr-2 pb-1">@</span>
                                                <input
                                                    type="text"
                                                    value={confirmInstagram}
                                                    onChange={(e) => setConfirmInstagram(e.target.value)}
                                                    placeholder="Confirm your Instagram username"
                                                    className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-sm"
                                                />
                                                <button
                                                    className="ml-2 text-white/70 hover:text-white"
                                                    onClick={() => setConfirmInstagram("")}
                                                    tabIndex={-1}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="18"
                                                        height="18"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            stroke="currentColor"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M18 6 6 18M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* ✅ Code verification and success flow */}
                                    {!showCodeInput && !codeVerified ? (
                                        <button
                                            disabled={
                                                !confirmInstagram.trim() ||
                                                confirmInstagram !== instagram
                                            }
                                            onClick={() => setShowCodeInput(true)}
                                            className={`w-full py-4 rounded-xl font-medium text-lg transition ${!confirmInstagram.trim() ||
                                                confirmInstagram !== instagram
                                                ? BUTTON_GLASS_INACTIVE
                                                : BUTTON_GLASS_ACTIVE
                                                }`}
                                        >
                                            Looks good! Continue
                                        </button>
                                    ) : !codeVerified ? (
                                        <div className="w-full flex flex-col items-center mt-2">
                                            <div className="text-white text-base mb-2">
                                                Enter the 4-digit code sent to your Instagram DM
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={4}
                                                value={instaCode}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                                    setInstaCode(val);
                                                }}
                                                placeholder="4-digit code"
                                                className="w-full px-4 py-4 border rounded-xl text-sm mb-2 transition bg-white/20 backdrop-blur-sm text-white placeholder-white/80 border-white/30"
                                            />
                                            <button
                                                disabled={instaCode.length !== 4}
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${instaCode.length !== 4
                                                    ? BUTTON_GLASS_INACTIVE
                                                    : BUTTON_GLASS_ACTIVE
                                                    }`}
                                                onClick={() => setCodeVerified(true)}
                                            >
                                                Verify Code
                                            </button>
                                        </div>
                                    ) : (
                                        // ✅ SUCCESS STATE — show only tick, message, and continue button
                                        <div className="w-full flex flex-col items-center mt-2">
                                            <div className="flex items-center justify-center mb-4">
                                                <span
                                                    className="flex items-center justify-center w-20 h-20 rounded-full bg-[#4CAF50]"
                                                >
                                                    <img
                                                        src="/verification-tick.svg"
                                                        alt="Verified"
                                                        className="w-10 h-10"
                                                    />
                                                </span>
                                            </div>
                                            <div className="text-white text-center text-base font-semibold leading-tight mb-6">
                                                Your Instagram has been<br />verified successfully.
                                            </div>
                                            <button
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${BUTTON_GLASS_ACTIVE}`}
                                                onClick={() => {/* next onboarding step here */ }}
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
