
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FaceVerification = () => {

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const fileInputRef = useRef();
    const videoRef = useRef();
    const canvasRef = useRef();
    const streamRef = useRef();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhoto(file);
            setShowUploadOptions(false);
        }
    };

    // Generate preview when photo changes
    useEffect(() => {
        if (photo) {
            const url = URL.createObjectURL(photo);
            setPhotoPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPhotoPreview(null);
        }
    }, [photo]);

    const handleUploadCardClick = () => {
        setShowUploadOptions(true);
    };

    const handleUploadFromDevice = () => {
        fileInputRef.current && fileInputRef.current.click();
    };
    const [showSuccess, setShowSuccess] = useState(false);

    const handleTakePhoto = () => {
        setShowUploadOptions(false);
        setShowCamera(true);
    };

    // Camera modal logic
    useEffect(() => {
        if (showCamera) {
            setCameraError("");
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                })
                .catch((err) => {
                    setCameraError("Unable to access camera. Please allow camera access or try a different device.");
                });
        } else {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, [showCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, 320, 240);
            canvasRef.current.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
                    setPhoto(file);
                }
            }, 'image/jpeg', 0.95);
            setShowCamera(false);
        }
    };

    const handleCloseCamera = () => {
        setShowCamera(false);
    };

    return (
        <div
            className="h-screen flex flex-col font-sans relative"
            style={{
                backgroundImage: `url('/bgs/faceverifybg.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 z-0"></div>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="bg-black/60 absolute inset-0"></div>
                    <div className="relative z-60 w-full max-w-sm p-6 rounded-3xl bg-white/5 backdrop-blur-lg flex flex-col items-center border border-white/20">
                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500 mb-4 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <div className="text-white text-lg font-semibold mb-2">Face verified</div>
                        <div className="text-white/80 text-sm mb-4 text-center">Your face photo has been successfully verified.</div>
                        <div className="w-full flex gap-3">
                            <button
                                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium"
                                onClick={() => navigate('/notification-permission')}
                            >
                                Continue
                            </button>
                            <button
                                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium border border-white/20"
                                onClick={() => setShowSuccess(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="relative z-40 p-6 pt-10 flex flex-col flex-grow bg-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                        onClick={() => navigate(-1)}
                    >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div className="text-white/80 text-[24px] font-semibold mx-auto">
                        Sundate.
                    </div>
                    <div style={{ width: 32 }}></div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/30 rounded-full h-1.5 mb-8">
                    <div
                        className="bg-white h-1.5 rounded-full transition-all duration-300 shadow-md"
                        style={{ width: "100%" }}
                    ></div>
                </div>

                {/* Content Card */}
                <div className="flex flex-col items-center flex-grow">
                    <h1 className="text-white text-2xl font-semibold mb-2 w-full text-left">Face Verification</h1>
                    <p className="text-white/80 mb-6 w-full text-left text-base">
                        Upload a clear face photo.<br />
                        <span className="text-white/60 text-sm">This won't appear on your profile, it's just to keep our community safe.</span>
                    </p>

                    {/* Upload Card */}
                    <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl flex flex-col items-center justify-center py-8 mb-6 transition">
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        {!showUploadOptions ? (
                            photoPreview ? (
                                <div className="flex flex-col items-center w-full h-full justify-center cursor-pointer" onClick={() => setPhoto(null)}>
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-full max-w-md object-cover rounded-2xl border border-white/20 shadow-md"
                                        style={{ aspectRatio: '4/3', height: '220px', background: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="flex flex-col items-center cursor-pointer hover:bg-white/20 w-full h-full"
                                    onClick={handleUploadCardClick}
                                >
                                    <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-white/20">
                                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                                            <path d="M12 16v-8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="text-white/90 font-medium text-base mb-1">
                                        Tap to upload your photo
                                    </div>
                                    <div className="text-white/60 text-xs">JPG, PNG or JPEG (max 10MB)</div>
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col gap-3 w-full px-4">
                                <button
                                    className="w-full py-3 rounded-xl bg-white/80 text-black font-semibold text-base hover:bg-white"
                                    onClick={handleUploadFromDevice}
                                >
                                    Upload from device
                                </button>
                                <button
                                    className="w-full py-3 rounded-xl bg-white/20 text-white font-semibold text-base hover:bg-white/30"
                                    onClick={handleTakePhoto}
                                >
                                    Take a photo
                                </button>
                                <button
                                    className="w-full py-2 rounded-xl text-white/60 text-xs mt-2 hover:underline"
                                    onClick={() => setShowUploadOptions(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        {/* Camera Modal */}
                        {showCamera && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                                <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow-2xl relative w-[350px] max-w-full">
                                    <button
                                        className="absolute top-2 right-2 text-gray-500 hover:text-black"
                                        onClick={handleCloseCamera}
                                    >
                                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <div className="mb-4 w-[320px] h-[240px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                                        {cameraError ? (
                                            <span className="text-red-500 text-center">{cameraError}</span>
                                        ) : (
                                            <video ref={videoRef} width={320} height={240} autoPlay playsInline className="rounded-lg" />
                                        )}
                                        <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
                                    </div>
                                    <button
                                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700"
                                        onClick={handleCapture}
                                        disabled={!!cameraError}
                                    >
                                        Capture Photo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pro Tip */}
                    <div className="w-full max-w-md mb-8">
                        <div className="text-white/80 font-semibold mb-2">Pro Tip:</div>
                        <ul className="text-white/70 text-sm list-disc pl-5">
                            <li>Use a well-lit background</li>
                            <li>Look straight at the camera</li>
                            <li>No sunglasses or masks</li>
                        </ul>
                    </div>

                    {/* Next Button */}
                    <button
                        className={`w-full max-w-md py-4 rounded-xl font-medium text-lg transition ${photo ? "bg-white text-black" : "bg-white/20 text-white/60 cursor-not-allowed"}`}
                        disabled={!photo}
                        onClick={() => photo && setShowSuccess(true)}
                        style={{ marginTop: "auto" }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaceVerification;
