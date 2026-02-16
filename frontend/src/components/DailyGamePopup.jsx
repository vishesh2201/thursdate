import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

export default function DailyGamePopup({ onClose }) {
    const [game, setGame] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadTodaysGame();
    }, []);

    const loadTodaysGame = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/daily-game/today`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.hasGame) {
                setGame(data.game);
                if (data.hasPlayed) {
                    setSelectedOption(data.userChoice);
                    // Load stats if already played
                    loadStats(data.game.id);
                }
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async (gameId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/daily-game/stats/${gameId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleOptionSelect = async (option) => {
        if (selectedOption || submitting) return; // Already played or submitting

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/daily-game/play`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gameId: game.id,
                    selectedOption: option
                })
            });

            const data = await response.json();

            if (data.success) {
                setSelectedOption(option);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to submit response:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                    <div className="text-center text-gray-600">Loading today's game...</div>
                </div>
            </div>
        );
    }

    if (!game) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <p className="text-sm text-gray-500 mb-1">Today's game</p>
                    <h2 className="text-lg font-semibold">This or That</h2>
                </div>

                {/* Question */}
                <h3 className="text-xl font-bold text-center mb-6">{game.question}</h3>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Option 1 */}
                    <button
                        onClick={() => handleOptionSelect(1)}
                        disabled={selectedOption !== null || submitting}
                        className={`flex flex-col items-center transition ${selectedOption === 1
                            ? 'ring-4 ring-blue-500'
                            : selectedOption === 2
                                ? 'opacity-50'
                                : 'hover:scale-105'
                            } ${selectedOption !== null ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2">
                            <img
                                src={game.option1.image}
                                alt={game.option1.text}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="font-medium text-sm">{game.option1.text}</p>
                        {stats && (
                            <p className="text-xs text-gray-500 mt-1">{stats.option1Percentage}%</p>
                        )}
                    </button>

                    {/* Option 2 */}
                    <button
                        onClick={() => handleOptionSelect(2)}
                        disabled={selectedOption !== null || submitting}
                        className={`flex flex-col items-center transition ${selectedOption === 2
                            ? 'ring-4 ring-blue-500'
                            : selectedOption === 1
                                ? 'opacity-50'
                                : 'hover:scale-105'
                            } ${selectedOption !== null ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2">
                            <img
                                src={game.option2.image}
                                alt={game.option2.text}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="font-medium text-sm">{game.option2.text}</p>
                        {stats && (
                            <p className="text-xs text-gray-500 mt-1">{stats.option2Percentage}%</p>
                        )}
                    </button>
                </div>

                {/* Stats summary */}
                {stats && (
                    <div className="text-center text-sm text-gray-500">
                        see who else selected the same answer: see members
                    </div>
                )}
            </div>
        </div>
    );
}
