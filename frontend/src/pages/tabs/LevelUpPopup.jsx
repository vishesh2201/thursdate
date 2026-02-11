import { motion, AnimatePresence } from 'framer-motion';

/**
 * LevelUpPopup - Inline popup for level upgrades
 * Shows above chat input field, NOT as modal
 * 
 * @param {boolean} show - Whether to show popup
 * @param {string} type - 'LEVEL_2' or 'LEVEL_3'
 * @param {string} action - Backend-determined action: 'FILL_INFORMATION' | 'ASK_CONSENT' | 'NO_ACTION'
 * @param {string} partnerName - Name of the matched user
 * @param {function} onFillInfo - Callback when user clicks to fill info
 * @param {function} onYes - Callback for YES button (consent)
 * @param {function} onNo - Callback for NO button (optional)
 */
export default function LevelUpPopup({ show, type, action, partnerName, onFillInfo, onYes, onNo }) {
    const isLevel2 = type === 'LEVEL_2';
    const isLevel3 = type === 'LEVEL_3';
    
    // ✅ CRITICAL: Frontend does NOT decide logic, only follows backend action
    const shouldShowFillInfo = action === 'FILL_INFORMATION';
    const shouldShowConsent = action === 'ASK_CONSENT';

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-3 relative z-20"
                >
                    <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20">
                        {/* ✅ FILL INFORMATION - First-time users who never completed this level */}
                        {shouldShowFillInfo && (
                            <>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="text-2xl">🥳</div>
                                    <div className="flex-1">
                                        <p className="text-white font-semibold text-sm">
                                            Looks like you and {partnerName} have levelled up!
                                        </p>
                                        <p className="text-white/90 text-xs mt-1">
                                            To see more information on their profile, please add more about you.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onFillInfo}
                                    className="w-full bg-white text-purple-600 font-semibold py-2.5 px-4 rounded-xl hover:bg-white/90 transition-colors active:scale-95"
                                >
                                    Fill information
                                </button>
                            </>
                        )}

                        {/* ✅ ASK CONSENT - Returning users who completed but haven't consented for this match */}
                        {shouldShowConsent && (
                            <>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="text-2xl">🥳</div>
                                    <div className="flex-1">
                                        <p className="text-white font-semibold text-sm">
                                            Looks like you and {partnerName} have levelled up!
                                        </p>
                                        <p className="text-white/90 text-xs mt-1">
                                            Do you want to share your {isLevel2 ? 'Level 2' : 'Level 3'} information with {partnerName}?
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={onYes}
                                        className="flex-1 bg-white text-purple-600 font-semibold py-2.5 px-4 rounded-xl hover:bg-white/90 transition-colors"
                                    >
                                        Yes
                                    </button>
                                    {onNo && (
                                        <button
                                            onClick={onNo}
                                            className="flex-1 bg-white/20 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-white/30 transition-colors border border-white/30"
                                        >
                                            Not now
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ✅ NO_ACTION / Invalid - should not happen */}
                        {!shouldShowFillInfo && !shouldShowConsent && (
                            <div className="text-white text-sm text-center py-2">
                                <p>⚠️ Debug: Invalid action</p>
                                <p className="text-xs mt-1">Action: {action || 'undefined'}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
