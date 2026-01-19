import { motion, AnimatePresence } from 'framer-motion';

/**
 * Level2UnlockedPopup - Shows when both users complete Level 2
 * Inline popup above chat input
 */
export default function Level2UnlockedPopup({ show, onDismiss }) {
    if (!show) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-3"
                >
                    <div className="bg-gradient-to-r from-pink-500/90 to-rose-500/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="text-2xl">💕</div>
                            <div className="flex-1">
                                <p className="text-white font-semibold text-sm">
                                    The wait is finally over!
                                </p>
                                <p className="text-white/90 text-xs mt-1">
                                    Just a few more questions… and then it's face to face 💕
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="w-full bg-white text-rose-600 font-semibold py-2.5 px-4 rounded-xl hover:bg-white/90 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
