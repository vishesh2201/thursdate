import { useNavigate } from 'react-router-dom';

/**
 * LevelUpPopup Component
 * Displays above chat input when a level-up is triggered
 * Shows different UI based on action type
 */
export default function LevelUpPopup({ 
    action, 
    level, 
    otherUserName,
    conversationId,
    onConsent,
    onDecline
}) {
    const navigate = useNavigate();
    
    const handleFillInformation = () => {
        const mode = level === 2 ? 'level2' : 'level3';
        navigate(`/profile-questions?mode=${mode}&conversationId=${conversationId}`);
    };
    
    const handleYes = () => {
        if (onConsent) {
            onConsent(level);
        }
    };
    
    const handleNo = () => {
        if (onDecline) {
            onDecline(level);
        }
    };
    
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-20 pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                    {/* Celebration emoji */}
                    <div className="absolute top-2 right-2 text-4xl animate-bounce">
                        🥳
                    </div>
                    
                    {/* Content */}
                    <div className="relative">
                        <h3 className="text-white text-xl font-bold mb-3">
                            Level {level} Unlocked!
                        </h3>
                        
                        {action === 'FILL_INFORMATION' ? (
                            <>
                                <p className="text-white/90 text-sm mb-4 leading-relaxed">
                                    Looks like you and <span className="font-semibold">{otherUserName}</span> have levelled up! 🎉
                                    <br /><br />
                                    To see more information, please add more about you.
                                </p>
                                
                                <button
                                    onClick={handleFillInformation}
                                    className="w-full bg-white text-purple-600 font-semibold py-3 px-6 rounded-xl hover:bg-purple-50 transition-all transform hover:scale-105 shadow-lg"
                                >
                                    Fill Information
                                </button>
                            </>
                        ) : action === 'ASK_CONSENT' ? (
                            <>
                                <p className="text-white/90 text-sm mb-4 leading-relaxed">
                                    {level === 2 ? (
                                        <>
                                            Looks like you and <span className="font-semibold">{otherUserName}</span> have levelled up! 🎉
                                            <br /><br />
                                            Do you want to share your Level 2 profile with them?
                                        </>
                                    ) : (
                                        <>
                                            Looks like you and <span className="font-semibold">{otherUserName}</span> have levelled up! 🥳
                                            <br /><br />
                                            Are you ready to show your complete profile?
                                        </>
                                    )}
                                </p>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleNo}
                                        className="flex-1 bg-white/20 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/30 transition-all backdrop-blur-sm"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={handleYes}
                                        className="flex-1 bg-white text-purple-600 font-semibold py-3 px-6 rounded-xl hover:bg-purple-50 transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        Yes
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
