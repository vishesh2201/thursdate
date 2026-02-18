import { useState, useEffect } from "react";

export default function GameTab() {
  const [todayGame, setTodayGame] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [expandedGame, setExpandedGame] = useState(null);
  const [gameMatches, setGameMatches] = useState({});

  const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

  // Fetch today's game and history
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch today's game
        const todayResponse = await fetch(`${API_URL}/daily-game/today`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const todayData = await todayResponse.json();

        if (todayData.hasGame) {
          setTodayGame(todayData);
        }

        // Fetch game history
        const historyResponse = await fetch(`${API_URL}/daily-game/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyResponse.json();
        setGameHistory(historyData.history || []);

      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Countdown timer for today's game
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const diff = endOfDay - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch matches for a specific game
  const fetchGameMatches = async (gameId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/daily-game/matches/${gameId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setGameMatches(prev => ({ ...prev, [gameId]: data }));
    } catch (error) {
      console.error('Error fetching game matches:', error);
    }
  };

  const handlePlayGame = async (gameId, selectedOption) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/daily-game/play`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId, selectedOption })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the games to show updated stats
        const todayResponse = await fetch(`${API_URL}/daily-game/today`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const todayData = await todayResponse.json();

        if (todayData.hasGame) {
          setTodayGame(todayData);
        }
      } else {
        alert(data.error || 'Failed to submit your choice');
      }
    } catch (error) {
      console.error('Error playing game:', error);
      alert('Failed to submit your choice');
    }
  };

  const toggleGameExpansion = (gameId) => {
    if (expandedGame === gameId) {
      setExpandedGame(null);
    } else {
      setExpandedGame(gameId);
      if (!gameMatches[gameId]) {
        fetchGameMatches(gameId);
      }
    }
  };

  const formatGameDate = (dateString) => {
    const gameDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (gameDate.toDateString() === yesterday.toDateString()) {
      return 'YESTERDAY';
    }

    const daysDiff = Math.floor((today - gameDate) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return `${daysDiff} DAYS AGO`;
    }

    return gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-gray-600">Loading games...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-pink-50 to-purple-50 pb-24">
      <div className="px-4 py-6 space-y-6">

        {/* Today's Game Section */}
        {todayGame && todayGame.hasGame && (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Today's game</div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">This or That</h2>

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">{todayGame.game.question}</h3>
              </div>

              {/* Game Options */}
              {!todayGame.hasPlayed ? (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => handlePlayGame(todayGame.game.id, 1)}
                    className="flex flex-col items-center"
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2 border-2 border-transparent hover:border-pink-400 transition">
                      <img
                        src={todayGame.game.option1.image}
                        alt={todayGame.game.option1.text}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{todayGame.game.option1.text}</span>
                  </button>

                  <button
                    onClick={() => handlePlayGame(todayGame.game.id, 2)}
                    className="flex flex-col items-center"
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2 border-2 border-transparent hover:border-pink-400 transition">
                      <img
                        src={todayGame.game.option2.image}
                        alt={todayGame.game.option2.text}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{todayGame.game.option2.text}</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 mb-6 bg-green-50 rounded-xl">
                  <p className="text-green-600 font-medium">✓ You've played today's game!</p>
                  <p className="text-sm text-gray-600 mt-1">Come back tomorrow for a new challenge</p>
                </div>
              )}

              {/* Countdown Timer */}
              <div className="flex items-center justify-center gap-6 text-center py-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{String(timeRemaining.hours).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-500 uppercase">Hour</div>
                </div>
                <div className="text-2xl text-gray-400">:</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-500 uppercase">Min</div>
                </div>
                <div className="text-2xl text-gray-400">:</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-500 uppercase">Sec</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Games Section */}
        {gameHistory.length > 0 && (
          <div className="space-y-4">
            {gameHistory.map((game) => {
              const isExpanded = expandedGame === game.id;
              const matches = gameMatches[game.id];
              const option1Percentage = game.stats.option1Percentage;
              const option2Percentage = game.stats.option2Percentage;

              return (
                <div key={game.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="p-4">
                    {/* Game Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-red-500 font-semibold mb-1">This or That - {game.question}</div>
                      </div>
                    </div>

                    {/* Option Bars */}
                    <div className="space-y-2 mb-3">
                      {/* Option 1 */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">
                            {game.option1.text}
                            {matches && matches.sameChoice && game.userChoice === 1 && (
                              <span className="ml-1 text-green-600">
                                - {matches.sameChoice[0]?.firstName || 'You'}
                              </span>
                            )}
                            {matches && matches.otherChoice && game.userChoice === 2 && matches.otherChoice[0] && (
                              <span className="ml-1 text-gray-600">
                                - {matches.otherChoice[0]?.firstName}
                              </span>
                            )}
                          </span>
                          <span className="text-gray-500">{option1Percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${game.userChoice === 1 ? 'bg-green-500' : 'bg-gray-400'}`}
                            style={{ width: `${option1Percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Option 2 */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">
                            {game.option2.text}
                            {matches && matches.sameChoice && game.userChoice === 2 && (
                              <span className="ml-1 text-blue-600">
                                - {matches.sameChoice[0]?.firstName || 'You'}
                              </span>
                            )}
                            {matches && matches.otherChoice && game.userChoice === 1 && matches.otherChoice[0] && (
                              <span className="ml-1 text-gray-600">
                                - {matches.otherChoice[0]?.firstName}
                              </span>
                            )}
                          </span>
                          <span className="text-gray-500">{option2Percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${game.userChoice === 2 ? 'bg-blue-500' : 'bg-gray-400'}`}
                            style={{ width: `${option2Percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* See Other Members Button */}
                    <button
                      onClick={() => toggleGameExpansion(game.id)}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700"
                    >
                      {isExpanded ? 'Hide members' : 'See other members'}
                    </button>

                    {/* Expanded Members List */}
                    {isExpanded && matches && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          {/* Same choice members */}
                          {matches.sameChoice && matches.sameChoice.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-2">
                                Chose {game.userChoice === 1 ? game.option1.text : game.option2.text}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {matches.sameChoice.slice(0, 5).map((member) => (
                                  <div key={member.id} className="flex items-center gap-2 bg-gray-50 rounded-full pl-1 pr-3 py-1">
                                    <img
                                      src={member.profilePicUrl}
                                      alt={member.firstName}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <span className="text-xs font-medium text-gray-700">{member.firstName}</span>
                                  </div>
                                ))}
                                {matches.sameChoice.length > 5 && (
                                  <div className="flex items-center px-3 py-1 text-xs text-gray-500">
                                    +{matches.sameChoice.length - 5} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Other choice members */}
                          {matches.otherChoice && matches.otherChoice.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-2">
                                Chose {game.userChoice === 1 ? game.option2.text : game.option1.text}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {matches.otherChoice.slice(0, 5).map((member) => (
                                  <div key={member.id} className="flex items-center gap-2 bg-gray-50 rounded-full pl-1 pr-3 py-1">
                                    <img
                                      src={member.profilePicUrl}
                                      alt={member.firstName}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <span className="text-xs font-medium text-gray-700">{member.firstName}</span>
                                  </div>
                                ))}
                                {matches.otherChoice.length > 5 && (
                                  <div className="flex items-center px-3 py-1 text-xs text-gray-500">
                                    +{matches.otherChoice.length - 5} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Footer */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>{formatGameDate(game.gameDate)}</span>
                      <span className="ml-auto">Game name</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!todayGame && gameHistory.length === 0 && !loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600">No games available yet</p>
              <p className="text-sm text-gray-400 mt-2">Check back soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
