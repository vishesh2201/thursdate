import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function GameConnection() {
    const navigate = useNavigate();
    const location = useLocation();
    const { chat } = location.state || {};
    const [showGame, setShowGame] = useState(false);
    const [userChoice, setUserChoice] = useState(null);
    const [showResult, setShowResult] = useState(false);

    // Mock data - other person chose "Beaches"
    const otherPersonChoice = "Beaches";

    const handleChoice = (choice) => {
        setUserChoice(choice);
        setShowResult(true);
    };

    return (
        <div
            className="h-screen flex flex-col bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/bgs/faceverifybg.png')`
            }}
        >
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 pt-12 pb-4 px-4">
                <div className="flex items-center justify-between">
                    {/* Back button and profile */}
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            onClick={() => navigate('/home', { state: { selectedTab: 'chats' } })}
                            className="w-8 h-8 flex items-center justify-center"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <img
                            src={chat?.image || '/chatperson.png'}
                            alt={chat?.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                        />

                        <div>
                            <h2 className="text-white font-semibold text-lg">{chat?.name || 'Jacob Jones'}</h2>
                            <p className="text-white/70 text-xs">Mumbai</p>
                        </div>
                    </div>

                    {/* More options button */}
                    <button className="w-8 h-8 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {!showGame ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    {/* Card with message and button */}
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
                        <p className="text-white text-center text-sm mb-6 leading-relaxed">
                            Want to connect with Jacob? Complete 3 fun games to show your vibe!
                        </p>
                        <button
                            onClick={() => setShowGame(true)}
                            className="w-full bg-white text-gray-800 font-semibold py-4 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            Play games to connect
                        </button>
                    </div>
                </div>
            ) : !showResult ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                    {/* Game Question */}
                    <div className="text-center mb-8">
                        <h2 className="text-white text-2xl font-semibold mb-2">Would You Rather?</h2>
                        <p className="text-white/70 text-sm">Discover your personality type</p>
                    </div>

                    {/* Options */}
                    <div className="w-full max-w-md space-y-4">
                        <button
                            onClick={() => handleChoice('Mountains')}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold py-6 rounded-3xl hover:bg-white/20 transition-colors"
                        >
                            Mountains
                        </button>

                        <div className="text-center">
                            <span className="text-white/50 text-sm">Or</span>
                        </div>

                        <button
                            onClick={() => handleChoice('Beaches')}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold py-6 rounded-3xl hover:bg-white/20 transition-colors"
                        >
                            Beaches
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">

                    {/* Result Card */}
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/30 rounded-3xl p-6">
                        {userChoice === otherPersonChoice ? (
                            // Both chose the same option
                            <>
                                <p className="text-white text-center text-sm mb-6 leading-relaxed">
                                    Oh, looks like you both chose different options, but hey, you can still start a chat!
                                </p>
                                <div className="flex justify-around items-center">
                                    <div className="text-center">
                                        <h3 className="text-white font-semibold text-lg mb-1">Mountains</h3>
                                        <p className="text-white/70 text-sm">Sana</p>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-white font-semibold text-lg mb-1">Beaches</h3>
                                        <p className="text-white/70 text-sm">Jacob</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // User chose Mountains (different from Jacob)
                            userChoice === 'Mountains' ? (
                                <>
                                    <p className="text-white text-center text-sm mb-6 leading-relaxed">
                                        Oh, looks like you both chose different options, but hey, you can still start a chat!
                                    </p>
                                    <div className="flex justify-around items-center mb-6">
                                        <div className="text-center">
                                            <h3 className="text-white font-semibold text-lg mb-1">Mountains</h3>
                                            <p className="text-white/70 text-sm">Sana</p>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-white font-semibold text-lg mb-1">Beaches</h3>
                                            <p className="text-white/70 text-sm">Jacob</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/chat-conversation', { state: { chat } })}
                                        className="w-full bg-white text-gray-800 font-semibold py-4 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        Start chatting
                                    </button>
                                </>
                            ) : (
                                // User chose Beaches (same as Jacob)
                                <>
                                    <p className="text-white text-center text-sm mb-6 leading-relaxed">
                                        Nice choice, you picked mountains! Now waiting for Jacob's response.
                                    </p>
                                    <div className="text-center mb-6">
                                        <h3 className="text-white font-semibold text-2xl mb-1">Mountains</h3>
                                        <p className="text-white/70 text-sm">Sana</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/chat-conversation', { state: { chat } })}
                                        className="w-full bg-white text-gray-800 font-semibold py-4 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        Start chatting
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Input Area (disabled state) */}
            <div className="px-4 py-4 pb-8">
                <div className="flex items-center gap-2 opacity-50 pointer-events-none">
                    {/* Camera button */}
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <img src="/chatCam.svg" alt="Camera" className="w-5 h-5" />
                    </button>

                    {/* Message input */}
                    <div className="flex-1 bg-white rounded-full px-4 py-3 flex items-center">
                        <input
                            type="text"
                            placeholder="Message"
                            disabled
                            className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 outline-none text-sm"
                        />
                        <button className="ml-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Microphone button */}
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <img src="/chatMic.svg" alt="Microphone" className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
