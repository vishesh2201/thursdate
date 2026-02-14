import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userAPI } from '../../utils/api';

export default function UserProfileInfo() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, conversationId } = location.state || {};
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bioMode, setBioMode] = useState('read');

    // Lifestyle image carousel state
    const [isMinimized, setIsMinimized] = useState(false);
    const [currentLifestyleImageIndex, setCurrentLifestyleImageIndex] = useState(0);
    const [currentPersonalImageIndex, setCurrentPersonalImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewMode, setViewMode] = useState('lifestyle');

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const data = await userAPI.getUserProfile(userId, conversationId);
            setUser(data);
            console.log('[Profile] Loaded profile, visibility level:', data.visibilityLevel);
            console.log('[Profile] Conversation ID:', conversationId);
            console.log('[Profile] Personal tab unlocked:', data.personalTabUnlocked);
            console.log('[Profile] Face photos count:', data.facePhotos ? data.facePhotos.length : 'null/undefined');
            if (data.facePhotos && data.facePhotos.length > 0) {
                console.log('[Profile] Face photos:', data.facePhotos);
            }
            
            // If no conversationId, Personal tab should default to locked
            if (!conversationId) {
                console.log('[Profile] No conversation ID - Personal tab will be locked');
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) {
            navigate(-1);
            return;
        }
        loadUserProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, conversationId]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && userId) {
                console.log('[Profile] Page visible, reloading profile...');
                loadUserProfile();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, conversationId]);

    useEffect(() => {
        setCurrentLifestyleImageIndex(0);
        setIsMinimized(false);
    }, [userId]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Helper function to calculate age
    const calculateAge = (dob) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Use actual user data from backend
    const interests = user.interests || [];
    const watchlist = user.intent?.watchList || [];
    const tvShows = user.intent?.tvShows || [];
    const movies = user.intent?.movies || [];
    const artistsBands = user.intent?.artistsBands || [];
    const lifestyleImages = user.intent?.lifestyleImageUrls?.filter(Boolean) || [];
    const languages = user.intent?.profileQuestions?.languages || [];

    // Handle touch gestures for drag-to-minimize
    const handleTouchStart = (e) => {
        setTouchStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        const touchCurrent = e.touches[0].clientY;
        const verticalDiff = touchCurrent - touchStart;

        if (isMinimized) {
            if (verticalDiff < -10) {
                setIsMinimized(false);
            }
            return;
        }

        if (scrollTop === 0 && verticalDiff > 50) {
            setIsMinimized(true);
        }
    };

    const handleScroll = (e) => {
        const scrollPosition = e.target.scrollTop;
        setScrollTop(scrollPosition);

        if (isMinimized && scrollPosition > 0) {
            setIsMinimized(false);
        }
    };

    // Tap background to cycle through images based on current tab
    const handleBackgroundTap = () => {
        if (viewMode === 'lifestyle' && lifestyleImages.length > 0) {
            setCurrentLifestyleImageIndex((prev) => (prev + 1) % lifestyleImages.length);
        } else if (viewMode === 'personal' && user?.personalTabUnlocked && user?.facePhotos && user.facePhotos.length > 0) {
            setCurrentPersonalImageIndex((prev) => (prev + 1) % user.facePhotos.length);
        }
    };

    return (
        <div
            className="h-screen overflow-hidden flex flex-col"
            onClick={handleBackgroundTap}
            style={{
                backgroundImage: viewMode === 'lifestyle' && lifestyleImages.length > 0
                    ? `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${lifestyleImages[currentLifestyleImageIndex]})`
                    : viewMode === 'personal' && user?.personalTabUnlocked && user?.facePhotos && user.facePhotos.length > 0
                    ? `linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15)), url(${user.facePhotos[currentPersonalImageIndex]})`
                    : `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('/bgs/faceverifybg.png')`,
                backgroundSize: viewMode === 'personal' && user?.personalTabUnlocked && user?.facePhotos && user.facePhotos.length > 0 ? 'contain' : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transition: 'background-image 0.3s ease-in-out',
                cursor: (viewMode === 'lifestyle' && lifestyleImages.length > 0) || 
                        (viewMode === 'personal' && user?.personalTabUnlocked && user?.facePhotos && user.facePhotos.length > 0)
                        ? 'pointer' : 'default'
            }}
        >
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
                            {!user?.personalTabUnlocked && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="text-white text-xl font-semibold"></div>
                )}
                <div style={{ width: 40 }}></div>
            </div>

            {/* Image Indicators - Show on Lifestyle or Personal tab */}
            {viewMode === 'lifestyle' && lifestyleImages.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                    {lifestyleImages.map((_, idx) => (
                        <div
                            key={idx}
                            className="h-1 rounded-full transition-all"
                            style={{
                                width: idx === currentLifestyleImageIndex ? '24px' : '8px',
                                backgroundColor: idx === currentLifestyleImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)'
                            }}
                        />
                    ))}
                </div>
            )}
            {viewMode === 'personal' && user?.personalTabUnlocked && user?.facePhotos && user.facePhotos.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                    {user.facePhotos.map((_, idx) => (
                        <div
                            key={idx}
                            className="h-1 rounded-full transition-all"
                            style={{
                                width: idx === currentPersonalImageIndex ? '24px' : '8px',
                                backgroundColor: idx === currentPersonalImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Profile Card Container */}
            <div
                className={`flex-1 px-4 transition-all duration-300 ${isMinimized ? 'overflow-hidden' : 'overflow-y-auto'}`}
                style={{
                    transform: isMinimized ? 'translateY(calc(100vh - 280px))' : 'translateY(60px)',
                    transition: 'all 0.3s ease-out',
                }}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onClick={(e) => {
                    if (isMinimized) {
                        e.stopPropagation();
                        setIsMinimized(false);
                    }
                }}
            >
                {/* Main Content with rounded corners matching Figma */}
                <div
                    className="max-w-md mx-auto flex flex-col gap-6 px-[24px] py-6 min-h-screen shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                        borderRadius: '29.771px 29.771px 0 0',
                    }}
                >
                    {/* Name, Age, Location Section */}
                    <div className="flex items-start justify-between gap-[49px]">
                        <div className="flex gap-[9.311px] h-[78.276px] items-start">
                            <div
                                className="relative rounded-full shrink-0"
                                style={{
                                    width: '69.83px',
                                    height: '69.83px',
                                    border: '1.185px solid #f6f6f6',
                                    boxShadow: '0px 4.738px 4.738px 0px rgba(0,0,0,0.25)'
                                }}
                            >
                                <img
                                    src={user.profilePicUrl || '/chatperson.png'}
                                    alt={user.name}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                            <div className="flex flex-col items-start" style={{ width: '174.463px' }}>
                                <div className="flex gap-[2.977px] items-center font-['Poppins'] text-[19.847px] leading-[1.33]">
                                    <span className="text-white">{user.firstName || user.name},</span>
                                    <span className="text-white/70">{user.age || calculateAge(user.dob)}</span>
                                </div>
                                <p className="font-['Poppins'] text-[11.908px] leading-[1.5] text-white">
                                    {user.intent?.profileQuestions?.jobTitle || 'Not specified'}
                                </p>
                                <p className="font-['Poppins'] text-[11.908px] leading-[1.5] text-white">
                                    {user.currentLocation || user.location || 'Location not specified'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center shrink-0"
                            style={{
                                width: '29.771px',
                                height: '29.771px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                border: '0.605px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '50%',
                                transform: 'rotate(-90deg)',
                            }}
                        >
                            <svg className="w-[13.318px] h-[13.318px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Quick Info Icons */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/20">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <img src="/profileMale.svg" alt="Gender" className="w-6 h-6" />
                            </div>
                            <span className="text-white/80 text-[10px] mt-1">{user.gender || 'Not specified'}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <img src="/profileHeight.svg" alt="Height" className="w-6 h-6" />
                            </div>
                            <span className="text-white/80 text-[10px] mt-1">{user.height ? `${user.height} cm` : 'Not specified'}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <img src="/profileRelationship.svg" alt="Relationship" className="w-6 h-6" />
                            </div>
                            <span className="text-white/80 text-[10px] mt-1">{user.relationshipStatus || 'Not specified'}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <img src="/profileOriginalLocation.svg" alt="From Location" className="w-6 h-6" />
                            </div>
                            <span className="text-white/80 text-[10px] mt-1 max-w-[60px] truncate text-center">
                                {user.fromLocation ? user.fromLocation.split(',').slice(0, 2).join(',') : 'Origin not specified'}
                            </span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <img src="/profileLocation.svg" alt="Current Location" className="w-6 h-6" />
                            </div>
                            <span className="text-white/80 text-[10px] mt-1 truncate max-w-[60px] text-center">
                                {user.currentLocation ? user.currentLocation.split(',').slice(0, 2).join(',') : 'Location not specified'}
                            </span>
                        </div>
                    </div>

                    {/* ✅ CONDITIONAL RENDERING: Show Lifestyle or Personal tab based on viewMode */}
                    {viewMode === 'lifestyle' ? (
                        /* LIFESTYLE TAB CONTENT */
                        <>
                            {/* Bio Section */}
                            <div className="flex flex-col gap-3 -mt-4" style={{ width: '336px' }}>
                        <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Bio</h3>
                        <div className="bg-white/10 rounded-xl px-3 py-[18px] flex flex-col gap-[5px]">
                            {/* Read/Listen Segmented Control */}
                            <div className="flex bg-[rgba(118,118,128,0.5)] rounded-full p-1 mb-2.5" style={{ width: '291px', height: '36px' }}>
                                <button
                                    onClick={() => setBioMode('read')}
                                    className={`flex-1 px-0.5 py-0.5 rounded-full text-[14px] leading-[18px] tracking-[-0.08px] font-semibold transition-all ${bioMode === 'read'
                                        ? 'bg-white text-black shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]'
                                        : 'text-[#f2f2f2]'
                                        }`}
                                >
                                    Read
                                </button>
                                <button
                                    onClick={() => setBioMode('listen')}
                                    className={`flex-1 px-0.5 py-0.5 rounded-full text-[14px] leading-[18px] tracking-[-0.08px] font-medium transition-all ${bioMode === 'listen'
                                        ? 'bg-white text-black shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]'
                                        : 'text-[#f2f2f2]'
                                        }`}
                                >
                                    Listen
                                </button>
                            </div>
                            <p className="font-['Poppins'] text-[12px] leading-[1.4] text-[#f2f2f2]">
                                {user.intent?.bio || "From boxing ring to monastery walls to...your DMs? Traded punches for prayers, now trading emails for epic adventures. Working remotely & traveling - seeking a co-conspirator for spontaneous fun."}
                            </p>
                        </div>
                    </div>

                    {/* Interests Section */}
                    {interests.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-white text-base font-semibold mb-3">Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {interests.map((interest, idx) => (
                                    <span key={idx} className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-sm">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Work & Education Section */}
                    {(user.intent?.profileQuestions?.jobTitle || user.intent?.profileQuestions?.education) && (
                        <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                            <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Work & Education</h3>
                            <div className="bg-white/10 rounded-xl p-3 flex flex-col gap-3" style={{ width: '336px' }}>
                                {/* Work */}
                                {user.intent?.profileQuestions?.jobTitle && (
                                    <div className="flex gap-[11px] items-center">
                                        <div
                                            className="bg-white/10 rounded-full flex items-center justify-center shrink-0"
                                            style={{ width: '42px', height: '42px' }}
                                        >
                                            <svg className="text-white" style={{ width: '21px', height: '21px' }} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px] flex-1">
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">
                                                {user.intent.profileQuestions.jobTitle}
                                            </p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">
                                                {user.intent.profileQuestions.companyName || 'Company not specified'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {user.intent?.profileQuestions?.education && (
                                    <div className="flex gap-[11px] items-center">
                                        <div
                                            className="bg-white/10 rounded-full flex items-center justify-center shrink-0"
                                            style={{ width: '42px', height: '42px' }}
                                        >
                                            <svg className="text-white" style={{ width: '21px', height: '21px' }} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px] flex-1">
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">
                                                {user.intent.profileQuestions.education}
                                            </p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">
                                                {user.intent.profileQuestions.educationDetail || 'Institution not specified'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Entertainment Section */}
                    {(watchlist.length > 0 || tvShows.length > 0 || movies.length > 0 || artistsBands.length > 0) && (
                        <div className="mb-4">
                            <h3 className="text-white text-base font-semibold mb-3">Entertainment</h3>

                            <div className="bg-white/10 rounded-xl p-3 flex flex-col gap-3">
                                {/* Watchlist */}
                                {watchlist.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-white/70 text-xs font-medium mb-2">Watchlist</div>
                                        <div className="flex flex-wrap gap-2">
                                            {watchlist.map((item, idx) => (
                                                <div key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                                                    <span className="text-white text-xs">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* TV Shows */}
                                {tvShows.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-white/70 text-xs font-medium mb-2">TV Shows</div>
                                        <div className="flex flex-wrap gap-2">
                                            {tvShows.map((show, idx) => (
                                                <div key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                                                    <span className="text-white text-xs">{show}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Movies */}
                                {movies.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-white/70 text-xs font-medium mb-2">Movies</div>
                                        <div className="flex flex-wrap gap-2">
                                            {movies.map((movie, idx) => (
                                                <div key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                                                    <span className="text-white text-xs">{movie}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Artists/Bands */}
                                {artistsBands.length > 0 && (
                                    <div>
                                        <div className="text-white/70 text-xs font-medium mb-2">Tunes</div>
                                        <div className="flex flex-wrap gap-2">
                                            {artistsBands.map((artist, idx) => (
                                                <div key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                                                    <span className="text-white text-xs">{artist}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lifestyle Section */}
                    {((user.favouriteTravelDestination && user.favouriteTravelDestination.length > 0) || user.pets || user.height || user.foodPreference || user.intent?.profileQuestions?.sleepSchedule || user.drinking || user.smoking) && (
                        <div className="mb-4">
                            <h3 className="text-white text-base font-semibold mb-3">Lifestyle</h3>

                            <div className="bg-white/10 rounded-xl p-3 flex flex-col gap-3">
                                <div className="space-y-3">
                                    {/* ✅ UPDATED: favouriteTravelDestination is now an array */}
                                    {user.favouriteTravelDestination && user.favouriteTravelDestination.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                                                <img src="/profileLocation.svg" alt="Favorite Destination" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-white/70 text-xs">Favorite Destinations</div>
                                                <div className="text-white font-medium text-sm">
                                                    {user.favouriteTravelDestination.map(place => place.name || place).join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {user.pets && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                                                <img src="/profilePetPreference.svg" alt="Pet Preference" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-white/70 text-xs">Pet Preference</div>
                                                <div className="text-white font-medium text-sm">{user.pets}</div>
                                            </div>
                                        </div>
                                    )}

                                    {user.height && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                                                <img src="/profileHeight.svg" alt="Height" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-white/70 text-xs">Height</div>
                                                <div className="text-white font-medium text-sm">{user.height} cm</div>
                                            </div>
                                        </div>
                                    )}

                                    {user.foodPreference && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                                                <img src="/profileFoodPreference.svg" alt="Food Preference" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-white/70 text-xs">Food Preference</div>
                                                <div className="text-white font-medium text-sm">{user.foodPreference}</div>
                                            </div>
                                        </div>
                                    )}

                                    {user.intent?.profileQuestions?.sleepSchedule && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                                                <img src="/profileMorningPerson.svg" alt="Morning/Night Person" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-white/70 text-xs">Morning/Night Person</div>
                                                <div className="text-white font-medium text-sm">{user.intent.profileQuestions.sleepSchedule}</div>
                                            </div>
                                        </div>
                                    )}

                                    {user.drinking && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                                                <img src="/profileDrinking.svg" alt="Drinking" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-white/70 text-xs">Drinking</div>
                                                <div className="text-white font-medium text-sm">{user.drinking}</div>
                                            </div>
                                        </div>
                                    )}

                                    {user.smoking && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                                                <img src="/profileSmoking.svg" alt="Smoking" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-white/70 text-xs">Smoking</div>
                                                <div className="text-white font-medium text-sm">{user.smoking}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personality & Social Style Section */}
                    {(user.intent?.profileQuestions?.dateBill || user.intent?.profileQuestions?.relationshipValues) && (
                        <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                            <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Personality & Social Style</h3>
                            <div className="bg-white/10 rounded-xl p-3 flex flex-col gap-3">
                                {user.intent?.profileQuestions?.dateBill && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
                                                <path d="M3 8h18M7 12h4" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">When the Bill Arrives</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.intent.profileQuestions.dateBill}</p>
                                        </div>
                                    </div>
                                )}
                                {user.intent?.profileQuestions?.relationshipValues && user.intent.profileQuestions.relationshipValues.length > 0 && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">What I look for in a relationship</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">
                                                {user.intent.profileQuestions.relationshipValues.slice(0, 3).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Deep Dive Section */}
                    {(user.kidsPreference || user.religiousLevel || user.intent?.profileQuestions?.religion || user.intent?.profileQuestions?.livingSituation) && (
                        <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                            <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Deep Dive</h3>
                            <div className="bg-white/10 rounded-xl px-3 py-[18px] flex flex-col gap-3">
                                {user.kidsPreference && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle cx="12" cy="8" r="4" strokeWidth="2" />
                                                <path d="M12 12v8m-3-5l3 3 3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Thoughts on Kids</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.kidsPreference}</p>
                                        </div>
                                    </div>
                                )}
                                {user.religiousLevel && user.religiousLevel !== 'not' && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M12 2C8.5 7 5.5 11.5 5.5 15.5a6.5 6.5 0 1 0 13 0C18.5 11.5 15.5 7 12 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Religious view</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">
                                                {user.religiousLevel === 'moderately' ? 'Moderately religious' : 
                                                 user.religiousLevel === 'deeply' ? 'Deeply religious' : 
                                                 user.religiousLevel}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {user.intent?.profileQuestions?.religion && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M12 2C8.5 7 5.5 11.5 5.5 15.5a6.5 6.5 0 1 0 13 0C18.5 11.5 15.5 7 12 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Religion</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.intent.profileQuestions.religion}</p>
                                        </div>
                                    </div>
                                )}
                                {user.intent?.profileQuestions?.livingSituation && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" />
                                                <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Living Situation</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.intent.profileQuestions.livingSituation}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Languages Section */}
                    {languages.length > 0 && (
                        <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                            <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Languages</h3>
                            <div className="flex gap-[18px] items-start flex-wrap">
                                {languages.map((language, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white/10 rounded-full px-2.5 py-2 h-[34px] flex items-center justify-center"
                                    >
                                        <p className="font-['Poppins'] font-medium text-[12px] leading-[24px] text-white text-center whitespace-nowrap">
                                            {language}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="h-6"></div>
                        </>
                    ) : (
                        /* PERSONAL TAB CONTENT */
                        <div className="w-full">
                            {user?.personalTabUnlocked ? (
                                /* UNLOCKED: Photos shown as background - just show message */
                                <div className="flex flex-col gap-4 w-full py-8">
                                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/30 text-center">
                                        <h3 className="font-['Poppins'] font-semibold text-[18px] leading-[1.3] text-white mb-2">
                                            Personal Photos Unlocked! 🎉
                                        </h3>
                                        <p className="text-white/80 text-sm">
                                            {user.facePhotos && user.facePhotos.length > 1 
                                                ? `Tap the background to view all ${user.facePhotos.length} photos`
                                                : 'Background shows personal photo'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* LOCKED: Show lock screen with message */
                                <div className="flex flex-col items-center justify-center py-20 px-6">
                                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/30 max-w-sm text-center">
                                        {/* Lock Icon */}
                                        <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        
                                        {/* Title */}
                                        <h3 className="font-['Poppins'] font-semibold text-[20px] leading-[1.3] text-white mb-3">
                                            Personal Photos Locked
                                        </h3>
                                        
                                        {/* Message */}
                                        <p className="font-['Poppins'] text-[14px] leading-[1.5] text-white/80 mb-2">
                                            Unlock Level 3 for seeing personal photos
                                        </p>
                                        
                                        {/* Progress Indicator */}
                                        <div className="mt-6 pt-6 border-t border-white/20">
                                            <div className="flex items-center justify-center gap-2 text-white/60 text-xs">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                <span>Keep chatting to unlock</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="h-6"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
