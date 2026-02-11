import { motion, AnimatePresence } from 'framer-motion';

/**
 * ConsentReminderBanner - Persistent banner when user clicked "NO" but consent still PENDING
 * Shows below header (NOT as popup), always visible until user clicks YES
 * 
 * @param {boolean} show - Whether to show banner (consentState === 'DECLINED_TEMPORARY' || 'PENDING')
 * @param {number} level - 2 or 3
 * @param {string} partnerName - Name of the matched user
 * @param {function} onShareNow - Callback when user clicks "Share now"
 */
export default function ConsentReminderBanner({ show, level, partnerName, onShareNow }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-amber-500/95 to-orange-500/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3 border-b border-white/20">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-lg flex-shrink-0">ℹ️</div>
                            <p className="text-white text-xs font-medium leading-tight">
                                Share your Level {level} info with {partnerName} to unlock theirs
                            </p>
                        </div>
                        <button
                            onClick={onShareNow}
                            className="bg-white text-orange-600 font-semibold text-xs py-2 px-4 rounded-lg hover:bg-white/90 transition-colors flex-shrink-0 active:scale-95"
                        >
                            Share now
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
