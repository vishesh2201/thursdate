import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI, chatAPI } from "../../utils/api";

const navOptions = [
  { key: "matches", label: "Matches", icon: "/matches-icon.svg" },
  { key: "game", label: "Game", icon: "/game-icon.svg" },
  { key: "discover", label: "Discover", icon: "/discover-icon.svg" },
  { key: "chats", label: "Chats", icon: "/chats-icon.svg" },
  { key: "profile", label: "Profile", icon: "/profile-icon.svg" },
];

export default function HomeTab() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("matches");
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [viewMode, setViewMode] = useState("lifestyle"); // "lifestyle" or "personal"

  // Candidates state
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Draggable button state
  const [buttonPosition, setButtonPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight / 2 - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Match notification state
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);

  // Fetch potential matches on component mount
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getPotentialMatches();

        // Transform backend data to match frontend structure
        const transformedCandidates = (response.candidates || []).map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          age: user.age,
          profilePicUrl: user.profilePicUrl || '/chatperson.png',
          jobTitle: user.intent?.profileQuestions?.jobTitle || 'Not specified',
          fromLocation: user.fromLocation,
          currentLocation: user.currentLocation,
          gender: user.gender,
          height: user.height ? `${Math.floor(user.height / 30.48)}'${Math.round((user.height % 30.48) / 2.54)}"` : 'N/A',
          relationshipStatus: user.relationshipStatus,
          bio: user.intent?.bio || '',
          lifestyleImages: user.intent?.lifestyleImageUrls || [],
          interests: user.interests || [],
          entertainment: {
            movies: user.intent?.movies || [],
            tvShows: user.intent?.tvShows || [],
            music: user.intent?.artistsBands || []
          }
        }));

        setCandidates(transformedCandidates);
        setError("");
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const currentCandidate = candidates[currentCandidateIndex];

  const handleScroll = (e) => {
    const scrollPosition = e.target.scrollTop;
    setScrollTop(scrollPosition);

    // If scrolling up from minimized state, expand card
    if (isMinimized && scrollPosition > 0) {
      setIsMinimized(false);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const touchCurrent = e.touches[0].clientY;
    const diff = touchCurrent - touchStart;

    if (isMinimized) {
      // If minimized and swiping up (negative diff), expand card
      if (diff < -10) {
        setIsMinimized(false);
      }
    } else if (scrollTop === 0) {
      // If at top and swiping down (positive diff), minimize card
      if (diff > 0) {
        setIsMinimized(true);
      }
    }
  };

  // Button dragging handlers
  const handleButtonMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
  };

  const handleButtonTouchStart = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - buttonPosition.x,
      y: e.touches[0].clientY - buttonPosition.y
    });
  };

  const handleButtonMouseMove = (e) => {
    if (isDragging) {
      setButtonPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleButtonTouchMove = (e) => {
    if (isDragging) {
      setButtonPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleButtonMouseUp = () => {
    setIsDragging(false);
  };

  const handleLike = async () => {
    if (!currentCandidate) return;

    try {
      const response = await userAPI.recordMatchAction(currentCandidate.id, 'like');

      // Check if it's a mutual match
      if (response.isMutualMatch) {
        setMatchedUser(response.matchData);
        setShowMatchNotification(true);

        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowMatchNotification(false);
        }, 5000);
      }

      // Move to next candidate
      if (currentCandidateIndex < candidates.length - 1) {
        setCurrentCandidateIndex(currentCandidateIndex + 1);
      } else {
        // No more candidates
        setCurrentCandidateIndex(-1);
      }
      setIsMinimized(false);
    } catch (error) {
      console.error('Error liking user:', error);
      // Still move to next candidate even if API fails
      if (currentCandidateIndex < candidates.length - 1) {
        setCurrentCandidateIndex(currentCandidateIndex + 1);
      } else {
        setCurrentCandidateIndex(-1);
      }
    }
  };

  const handleSkip = async () => {
    if (!currentCandidate) return;

    try {
      await userAPI.recordMatchAction(currentCandidate.id, 'skip');

      // Move to next candidate
      if (currentCandidateIndex < candidates.length - 1) {
        setCurrentCandidateIndex(currentCandidateIndex + 1);
      } else {
        // No more candidates
        setCurrentCandidateIndex(-1);
      }
      setIsMinimized(false);
    } catch (error) {
      console.error('Error skipping user:', error);
      // Still move to next candidate even if API fails
      if (currentCandidateIndex < candidates.length - 1) {
        setCurrentCandidateIndex(currentCandidateIndex + 1);
      } else {
        setCurrentCandidateIndex(-1);
      }
    }
  };

  const handleGoBack = () => {
    // Go to previous candidate
    if (currentCandidateIndex > 0) {
      setCurrentCandidateIndex(currentCandidateIndex - 1);
      setIsMinimized(false);
    }
  };

  const handleGoToChat = async () => {
    if (!matchedUser) return;
    
    try {
      // Create or get conversation with matched user
      const { conversationId } = await chatAPI.createConversation(matchedUser.userId);
      
      // Navigate to chat conversation
      navigate('/chat-conversation', {
        state: {
          conversationId,
          otherUser: {
            id: matchedUser.userId,
            name: `${matchedUser.firstName} ${matchedUser.lastName}`,
            firstName: matchedUser.firstName,
            lastName: matchedUser.lastName,
            profilePicUrl: matchedUser.profilePicUrl,
            location: matchedUser.currentLocation
          }
        }
      });
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  };

  return (
    <div
      className="h-screen flex flex-col font-sans overflow-hidden"
      onMouseMove={handleButtonMouseMove}
      onMouseUp={handleButtonMouseUp}
      onTouchMove={handleButtonTouchMove}
      onTouchEnd={handleButtonMouseUp}
    >
      <div
        className="flex-1 pb-28 overflow-hidden"
        style={{
          backgroundImage: 'url(/bgs/matchesbg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {loading ? (
          // Loading state
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl text-center px-6">
              Loading matches...
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl text-center px-6">
              {error}
            </div>
          </div>
        ) : currentCandidateIndex === -1 ? (
          // No more candidates
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl text-center px-6">
              No more profiles to show
            </div>
          </div>
        ) : (
          <>
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 pt-10 pb-4">
              <div style={{ width: 40 }}></div>
              {isMinimized ? (
                // Lifestyle/Personal Switch Buttons
                <div className="flex items-center gap-3 rounded-full p-1" style={{ backgroundColor: '#76768080' }}>
                  <button
                    onClick={() => setViewMode("lifestyle")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "lifestyle"
                      ? "bg-white text-black"
                      : "text-white"
                      }`}
                  >
                    Lifestyle
                  </button>
                  <button
                    onClick={() => setViewMode("personal")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${viewMode === "personal"
                      ? "bg-white text-black"
                      : "text-white"
                      }`}
                  >
                    Personal
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="text-white text-xl font-semibold"></div>
              )}
              <div style={{ width: 40 }}></div>
            </div>

            {/* Action Buttons - Draggable */}
            <div
              className="fixed z-10 rounded-full p-3 flex flex-col gap-3 border border-white/30 cursor-move"
              style={{
                left: `${buttonPosition.x}px`,
                top: `${buttonPosition.y}px`,
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
              onMouseDown={handleButtonMouseDown}
              onTouchStart={handleButtonTouchStart}
            >
              <button
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
              >
                <img src="/like.svg" alt="Like" className="w-6 h-6" />
              </button>

              <button
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); handleSkip(); }}
              >
                <img src="/skip.svg" alt="Skip" className="w-6 h-6" />
              </button>

              <button
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); handleGoBack(); }}
                disabled={currentCandidateIndex === 0}
                style={{ opacity: currentCandidateIndex === 0 ? 0.5 : 1 }}
              >
                <img src="/goback.svg" alt="Go Back" className="w-6 h-6" />
              </button>

              <button
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); handleGoToChat(); }}
              >
                <img src="/gotochat.svg" alt="Go to Chat" className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Profile Card */}
            <div className="px-4 h-[calc(100vh-120px)]">
              <div
                className={`rounded-t-3xl p-5 pb-32 shadow-lg h-full transition-transform duration-300 ${isMinimized ? 'overflow-hidden' : 'overflow-y-auto'}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                  transform: isMinimized ? 'translateY(calc(100vh - 280px))' : 'translateY(0)',
                }}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onClick={() => isMinimized && setIsMinimized(false)}
              >

                {/* Profile Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50">
                      <img src={currentCandidate.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="text-white text-lg font-semibold">
                      {currentCandidate.firstName} {currentCandidate.lastName}, {currentCandidate.age}
                    </div>
                    <div className="text-white/70 text-sm">
                      {currentCandidate.jobTitle}
                    </div>
                    <div className="text-white/60 text-xs">
                      {currentCandidate.currentLocation}
                    </div>
                  </div>
                </div>

                {/* Quick Info Icons */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/20">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <img src="/profileMale.svg" alt="Gender" className="w-6 h-6" />
                    </div>
                    <span className="text-white/80 text-[10px] mt-1">{currentCandidate.gender}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <img src="/profileHeight.svg" alt="Height" className="w-6 h-6" />
                    </div>
                    <span className="text-white/80 text-[10px] mt-1">{currentCandidate.height}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <img src="/profileRelationship.svg" alt="Relationship" className="w-6 h-6" />
                    </div>
                    <span className="text-white/80 text-[10px] mt-1">{currentCandidate.relationshipStatus}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <img src="/profileOriginalLocation.svg" alt="From Location" className="w-6 h-6" />
                    </div>
                    <span className="text-white/80 text-[10px] mt-1 max-w-[60px] truncate text-center">
                      {currentCandidate.fromLocation}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <img src="/profileLocation.svg" alt="Current Location" className="w-6 h-6" />
                    </div>
                    <span className="text-white/80 text-[10px] mt-1 truncate max-w-[60px] text-center">
                      {currentCandidate.currentLocation}
                    </span>
                  </div>
                </div>

                {/* Lifestyle Pictures */}
                {currentCandidate.lifestyleImages && currentCandidate.lifestyleImages.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-base font-semibold">Lifestyle</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {currentCandidate.lifestyleImages.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-white/10">
                          <img src={img} alt={`Lifestyle ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {currentCandidate.bio && (
                  <div className="mb-6">
                    <h3 className="text-white text-base font-semibold mb-3">About</h3>
                    <p className="text-white/80 text-sm leading-relaxed">{currentCandidate.bio}</p>
                  </div>
                )}

                {/* Interests */}
                {currentCandidate.interests && currentCandidate.interests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white text-base font-semibold mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.interests.map((interest, idx) => (
                        <span key={idx} className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entertainment */}
                {currentCandidate.entertainment && (
                  <div className="mb-6">
                    <h3 className="text-white text-base font-semibold mb-3">Entertainment</h3>

                    {currentCandidate.entertainment.movies && currentCandidate.entertainment.movies.length > 0 && (
                      <div className="mb-3">
                        <div className="text-white/70 text-xs mb-2">Movies</div>
                        <div className="flex flex-wrap gap-2">
                          {currentCandidate.entertainment.movies.map((movie, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-xs">
                              {movie}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentCandidate.entertainment.tvShows && currentCandidate.entertainment.tvShows.length > 0 && (
                      <div className="mb-3">
                        <div className="text-white/70 text-xs mb-2">TV Shows</div>
                        <div className="flex flex-wrap gap-2">
                          {currentCandidate.entertainment.tvShows.map((show, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-xs">
                              {show}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentCandidate.entertainment.music && currentCandidate.entertainment.music.length > 0 && (
                      <div>
                        <div className="text-white/70 text-xs mb-2">Music</div>
                        <div className="flex flex-wrap gap-2">
                          {currentCandidate.entertainment.music.map((genre, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-xs">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Match Notification Modal */}
      {showMatchNotification && matchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 mx-6 max-w-sm shadow-2xl animate-bounce-once">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-white text-2xl font-bold mb-2">It's a Match!</h2>
              <p className="text-white/90 text-base mb-6">
                You and {matchedUser.firstName} {matchedUser.lastName} liked each other
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowMatchNotification(false)}
                  className="px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-full font-semibold hover:bg-white/30 transition-all"
                >
                  Keep Swiping
                </button>
                <button
                  onClick={() => {
                    setShowMatchNotification(false);
                    handleGoToChat();
                  }}
                  className="px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:bg-white/90 transition-all"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/30 shadow-lg flex justify-around items-center h-24 px-2 rounded-t-3xl">
        {navOptions.map(opt => {
          const isActive = selected === opt.key;
          return (
            <button
              key={opt.key}
              className={`flex-1 flex flex-col items-center justify-center transition-all focus:outline-none px-2 py-2 rounded-2xl max-w-[80px] ${isActive ? "bg-white/40 backdrop-blur-md" : ""
                }`}
              onClick={() => setSelected(opt.key)}
            >
              <img
                src={opt.icon}
                alt={opt.label}
                className="mb-1"
                style={{
                  filter: isActive
                    ? "brightness(0) saturate(100%) invert(85%) sepia(45%) saturate(480%) hue-rotate(358deg) brightness(100%) contrast(92%)"
                    : "brightness(0) invert(1)",
                  width: 24,
                  height: 24,
                }}
              />
              <span className={`text-xs mt-0.5 ${isActive ? "font-semibold" : "font-normal"}`} style={{ color: isActive ? "#F5CA72" : "white" }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
} 