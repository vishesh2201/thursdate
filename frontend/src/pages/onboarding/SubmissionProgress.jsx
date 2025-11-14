import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SubmissionProgress = () => {
    const navigate = useNavigate();
    const [percent, setPercent] = useState(0);

    // animation flags
    const [showFinalCard, setShowFinalCard] = useState(false);
    const [loaderLeaving, setLoaderLeaving] = useState(false);
    const [finalEntering, setFinalEntering] = useState(false);

    useEffect(() => {
        // Animate from 0 to 100 over ~3.5s
        const duration = 5500; // ms
        const leaveDuration = 400; // ms for loader leave animation
        const finalDisplayDelay = 1400; // ms the final card remains before redirect (total ~1800)
        const start = performance.now();

        let rafId;
        let leaveTimer;
        let finalEnterTimer;
        let redirectTimer;

        const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.round(progress * 100);
            setPercent(value);
            if (progress < 1) {
                rafId = requestAnimationFrame(step);
            } else {
                // start leave animation for loader
                setLoaderLeaving(true);
                leaveTimer = setTimeout(() => {
                    setShowFinalCard(true);
                    // small delay to let final card mount, then animate it in
                    finalEnterTimer = setTimeout(() => setFinalEntering(true), 20);
                    // after showing final card for a bit, redirect to waitlist
                    redirectTimer = setTimeout(() => navigate('/waitlist-status'), finalDisplayDelay);
                }, leaveDuration);
            }
        };

        rafId = requestAnimationFrame(step);
        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(leaveTimer);
            clearTimeout(finalEnterTimer);
            clearTimeout(redirectTimer);
        };
    }, [navigate]);

    // Circle constants
    const size = 120;
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div
            className="h-screen flex flex-col font-sans relative"
            style={{
                backgroundImage: `url('/bgs/faceverifybg.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/50 z-0"></div>

            <div className="relative z-40 p-6 pt-10 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-8 h-8" />
                    <div className="text-white/80 text-[24px] font-semibold">Sundate.</div>
                    <div style={{ width: 32 }} />
                </div>

                <div className="flex flex-col items-center flex-grow justify-center">
                    {!showFinalCard ? (
                        <div className={`w-full max-w-sm bg-white/5 rounded-2xl p-6 flex flex-col items-center border border-white/10 transition-all duration-400 ease-out ${loaderLeaving ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
                            <div className="mb-4">
                                <svg width={size} height={size} className="block">
                                    <defs>
                                        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#6ee7b7" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                    <circle
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke="rgba(255,255,255,0.06)"
                                        strokeWidth={stroke}
                                        fill="transparent"
                                    />
                                    <circle
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke="url(#g1)"
                                        strokeWidth={stroke}
                                        strokeLinecap="round"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                    />
                                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fill="#fff">
                                        {percent}%
                                    </text>
                                </svg>
                            </div>

                            <div className="text-white/80 text-sm">Submitting your profile</div>
                        </div>
                    ) : (
                        <div className={`w-full max-w-sm bg-white/5 rounded-2xl p-6 flex flex-col items-center border border-white/10 transition-all duration-500 ${finalEntering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="mb-4 w-[120px] h-[120px] flex items-center justify-center">
                                <img src="/applicationunderprocess.svg" alt="Application Under Process" className="w-full h-full object-contain" />
                            </div>
                            <div className="text-white text-lg font-semibold mb-2">Application Under Process</div>
                            <div className="text-white/80 text-sm text-center">We've received your details and are reviewing them with care. You'll hear from us soon.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionProgress;
