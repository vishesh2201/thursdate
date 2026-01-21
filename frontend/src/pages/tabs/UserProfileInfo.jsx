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
    const [touchStart, setTouchStart] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    // Define loadUserProfile before useEffects
    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const data = await userAPI.getUserProfile(userId, conversationId);
            setUser(data);
            console.log('[Profile] Loaded profile, visibility level:', data.visibilityLevel);
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

    // Tap background to cycle through lifestyle images
    const handleBackgroundTap = () => {
        if (lifestyleImages.length === 0) return;
        setCurrentLifestyleImageIndex((prev) => (prev + 1) % lifestyleImages.length);
    };

    return (
        <div 
            className="h-screen overflow-hidden flex flex-col"
            onClick={handleBackgroundTap}
            style={{
                backgroundImage: lifestyleImages.length > 0
                    ? `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${lifestyleImages[currentLifestyleImageIndex]})`
                    : `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('/bgs/faceverifybg.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transition: 'background-image 0.3s ease-in-out',
                cursor: lifestyleImages.length > 0 ? 'pointer' : 'default'
            }}
        >
            {/* Lifestyle Image Indicators */}
            {lifestyleImages.length > 1 && (
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

            {/* Profile Card Container */}
            <div 
                className={`flex-1 transition-all duration-300 ${isMinimized ? 'overflow-hidden' : 'overflow-y-auto'}`}
                style={{
                    transform: isMinimized ? 'translateY(calc(100vh - 280px))' : 'translateY(0)',
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
                    className="max-w-md mx-auto flex flex-col gap-6 px-[24px] py-6 min-h-screen"
                    style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: isMinimized ? '29.771px 29.771px 0 0' : '29.771px',
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

                    {/* Gender, Body Type, Status, Location Icons Row */}
                    <div className="flex gap-6 h-[84px] items-start justify-center">
                        {/* Gender */}
                        <div className="flex flex-col items-center gap-[10.85px]" style={{ width: '39.695px', height: '66.529px' }}>
                            <div 
                                className="bg-white/10 rounded-full flex items-center justify-center"
                                style={{ width: '39.695px', height: '38.743px' }}
                            >
                                <svg className="text-white" style={{ width: '17.863px', height: '17.863px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="8" r="5" strokeWidth="2"/>
                                    <path d="M12 13v8m-4-4l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <p className="font-['Poppins'] text-[#f1f1f1] text-[12px] leading-[1.5] text-center">
                                {user.gender || 'Not specified'}
                            </p>
                        </div>

                        {/* Body Type */}
                        <div className="flex flex-col items-center gap-[10.85px]" style={{ width: '39.695px', height: '66.529px' }}>
                            <div 
                                className="bg-white/10 rounded-full flex items-center justify-center"
                                style={{ width: '39.695px', height: '38.743px' }}
                            >
                                <svg className="text-white" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M8 6h8M6 8h12M6 16h12M8 18h8M10 4h4v16h-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <p className="font-['Poppins'] text-[#f1f1f1] text-[12px] leading-[1.5] text-center">
                                {user.bodyType || 'Not specified'}
                            </p>
                        </div>

                        {/* Relationship Status */}
                        <div className="flex flex-col items-center gap-[10.85px]" style={{ width: '39.695px', height: '66.529px' }}>
                            <div 
                                className="bg-white/10 rounded-full flex items-center justify-center"
                                style={{ width: '39.695px', height: '38.743px' }}
                            >
                                <svg className="text-white" style={{ width: '17.86px', height: '17.86px' }} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm6 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0z"/>
                                </svg>
                            </div>
                            <p className="font-['Poppins'] text-[#f1f1f1] text-[12px] leading-[1.5] text-center">
                                {user.relationshipStatus || 'Not specified'}
                            </p>
                        </div>

                        {/* Current Location */}
                        <div className="flex flex-col items-center gap-[5.03px]" style={{ width: '45.649px', height: '79.389px' }}>
                            <div 
                                className="bg-white/10 rounded-full flex items-center justify-center"
                                style={{ width: '39.695px', height: '38.743px' }}
                            >
                                <svg className="text-white" style={{ width: '17.863px', height: '17.863px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="2"/>
                                    <circle cx="12" cy="9" r="2.5" strokeWidth="2"/>
                                </svg>
                            </div>
                            <p className="font-['Poppins'] text-[#f1f1f1] text-[12px] leading-[1.5] text-center whitespace-nowrap">
                                {user.currentLocation ? user.currentLocation.split(',').slice(0, 2).join(',') : 'Location not specified'}
                            </p>
                        </div>

                        {/* From Location */}
                        <div className="flex flex-col items-center gap-[10.02px]" style={{ width: '58.55px', height: '84.351px' }}>
                            <div 
                                className="bg-white/10 rounded-full flex items-center justify-center"
                                style={{ width: '39.695px', height: '38.743px' }}
                            >
                                <svg className="text-white" style={{ width: '17.863px', height: '17.863px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="2"/>
                                    <circle cx="12" cy="9" r="2.5" strokeWidth="2"/>
                                </svg>
                            </div>
                            <p className="font-['Poppins'] text-[#f1f1f1] text-[12px] leading-[1.5] text-center whitespace-nowrap">
                                {user.fromLocation ? `From ${user.fromLocation.split(',').slice(0, 2).join(',')}` : 'Origin not specified'}
                            </p>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                        <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Bio</h3>
                        <div className="bg-white/10 rounded-xl px-3 py-[18px] flex flex-col gap-[5px]">
                            {/* Read/Listen Segmented Control */}
                            <div className="flex bg-[rgba(118,118,128,0.5)] rounded-full p-2 mb-2.5" style={{ width: '291px', height: '36px' }}>
                                <button
                                    onClick={() => setBioMode('read')}
                                    className={`flex-1 px-2.5 py-1 rounded-full text-[14px] leading-[18px] tracking-[-0.08px] font-semibold transition-all ${
                                        bioMode === 'read' 
                                            ? 'bg-white text-black shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]' 
                                            : 'text-[#f2f2f2]'
                                    }`}
                                >
                                    Read
                                </button>
                                <button
                                    onClick={() => setBioMode('listen')}
                                    className={`flex-1 px-2.5 py-1 rounded-full text-[14px] leading-[18px] tracking-[-0.08px] font-medium transition-all ${
                                        bioMode === 'listen' 
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
                        <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                            <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Interests</h3>
                            <div className="flex flex-col gap-[18px]">
                                {/* Row 1 */}
                                {interests.slice(0, 4).length > 0 && (
                                    <div className="flex gap-[18px] items-start flex-wrap">
                                        {interests.slice(0, 4).map((interest, idx) => (
                                            <div 
                                                key={idx} 
                                                className="bg-white/10 rounded-full px-2.5 py-2 h-[34px] flex items-center justify-center"
                                            >
                                                <p className="font-['Poppins'] font-medium text-[12px] leading-[24px] text-white text-center whitespace-nowrap">
                                                    {interest}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Row 2 */}
                                {interests.slice(4, 8).length > 0 && (
                                    <div className="flex gap-[18px] items-start flex-wrap">
                                        {interests.slice(4, 8).map((interest, idx) => (
                                            <div 
                                                key={idx} 
                                                className="bg-white/10 rounded-full px-2.5 py-2 h-[34px] flex items-center justify-center"
                                            >
                                                <p className="font-['Poppins'] font-medium text-[12px] leading-[24px] text-white text-center whitespace-nowrap">
                                                    {interest}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Row 3 */}
                                {interests.slice(8).length > 0 && (
                                    <div className="flex gap-[18px] items-start flex-wrap">
                                        {interests.slice(8).map((interest, idx) => (
                                            <div 
                                                key={idx} 
                                                className="bg-white/10 rounded-full px-2.5 py-2 h-[34px] flex items-center justify-center"
                                            >
                                                <p className="font-['Poppins'] font-medium text-[12px] leading-[24px] text-white text-center whitespace-nowrap">
                                                    {interest}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div 
                                            className="bg-white/10 rounded-full flex items-center justify-center shrink-0"
                                            style={{ width: '42px', height: '42px' }}
                                        >
                                            <svg className="text-white" style={{ width: '21px', height: '21px' }} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
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
                                    <div className="flex gap-[11px] items-center" style={{ width: '267px' }}>
                                        <div 
                                            className="bg-white/10 rounded-full flex items-center justify-center shrink-0"
                                            style={{ width: '42px', height: '42px' }}
                                        >
                                            <svg className="text-white" style={{ width: '21px', height: '21px' }} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
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
                        <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                            <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Entertainment</h3>
                            <div className="bg-white/10 rounded-xl p-3" style={{ width: '336px' }}>
                                <div className="flex flex-col gap-[2px]" style={{ width: '312px' }}>
                                    {/* Watchlists */}
                                    {(watchlist.length > 0 || tvShows.length > 0 || movies.length > 0) && (
                                        <>
                                            <h4 className="font-['Poppins'] font-medium text-[14px] leading-[1.3] text-[#f2f2f2]">Watchlists</h4>
                                            <div className="flex flex-col gap-[5px]">
                                                {[...watchlist, ...tvShows, ...movies].slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center py-2">
                                                        <div className="w-12 h-12 rounded overflow-hidden bg-white/20 shrink-0">
                                                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600"></div>
                                                        </div>
                                                        <div className="flex flex-col gap-[2px]">
                                                            <p className="font-['Poppins'] text-[14px] leading-[20px] text-white">{item}</p>
                                                            <p className="font-['Figtree'] text-[14px] leading-[20px] text-white">
                                                                Directed by <span className="font-bold">Frank Darabont</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Tunes/Music */}
                                    {artistsBands.length > 0 && (
                                        <div className="flex flex-col gap-[2px]">
                                            <h4 className="font-['Poppins'] font-medium text-[14px] leading-[1.3] text-[#f2f2f2] mt-2">Tunes</h4>
                                            <div className="flex flex-col gap-[5px]">
                                                {artistsBands.slice(0, 2).map((artist, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center py-2">
                                                        <div className="w-12 h-12 rounded overflow-hidden bg-white/20 shrink-0">
                                                            <div className="w-full h-full bg-gradient-to-br from-pink-600 to-orange-600"></div>
                                                        </div>
                                                        <div className="flex flex-col gap-[2px]">
                                                            <p className="font-['Poppins'] text-[14px] leading-[20px] text-white">{artist}</p>
                                                            <p className="font-['Figtree'] text-[14px] leading-[20px] text-white">
                                                                By <span className="font-bold">Various Artists</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lifestyle Section */}
                    {(user.favouriteTravelDestination || user.pets || user.foodPreference || user.intent?.profileQuestions?.sleepSchedule || user.drinking || user.smoking) && (
                        <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                            <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Lifestyle</h3>
                            <div className="bg-white/10 rounded-xl p-3 flex flex-col gap-3">
                                {user.favouriteTravelDestination && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="2"/>
                                                <circle cx="12" cy="9" r="2.5" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Favorite Destination</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.favouriteTravelDestination}</p>
                                        </div>
                                    </div>
                                )}
                                {user.pets && (
                                    <div className="flex gap-[11px] items-center">
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M4.5 12c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm4-4c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm4 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm4 4c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm-4 5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Pet Preference</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.pets}</p>
                                        </div>
                                    </div>
                                )}
                                {user.foodPreference && (
                                    <div className="flex gap-[11px] items-center">
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M3 2v7c0 1.1.9 2 2 2h4v11h2V11h4c1.1 0 2-.9 2-2V2h-2v7h-2V2h-2v7h-2V2H7v7H5V2H3z" strokeWidth="1.5"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Food Preference</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.foodPreference}</p>
                                        </div>
                                    </div>
                                )}
                                {user.intent?.profileQuestions?.sleepSchedule && (
                                    <div className="flex gap-[11px] items-center">
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Morning/Night Person</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.intent.profileQuestions.sleepSchedule}</p>
                                        </div>
                                    </div>
                                )}
                                {user.drinking && (
                                    <div className="flex gap-[11px] items-center">
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M7 2L7 10C7 12.2091 8.79086 14 11 14H11C13.2091 14 15 12.2091 15 10V2" strokeWidth="2" strokeLinecap="round"/>
                                                <path d="M11 14V22" strokeWidth="2" strokeLinecap="round"/>
                                                <path d="M8 22H14" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Drinking</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.drinking}</p>
                                        </div>
                                    </div>
                                )}
                                {user.smoking && (
                                    <div className="flex gap-[11px] items-center">
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M18 8C18 6.34315 19.3431 5 21 5M13.5 5C13.5 3.61929 14.6193 2.5 16 2.5C16.3364 2.5 16.6585 2.56509 16.9521 2.68393" strokeWidth="2" strokeLinecap="round"/>
                                                <rect x="2" y="13" width="18" height="8" rx="1" strokeWidth="2"/>
                                                <rect x="20" y="13" width="2" height="8" rx="1" fill="currentColor"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Smoking</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.smoking}</p>
                                        </div>
                                    </div>
                                )}
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
                                                <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2"/>
                                                <path d="M3 8h18M7 12h4" strokeWidth="2" strokeLinecap="round"/>
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
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    {(user.kidsPreference || user.religiousLevel || user.intent?.profileQuestions?.livingSituation) && (
                        <div className="flex flex-col gap-3" style={{ width: '336px' }}>
                            <h3 className="font-['Poppins'] font-semibold text-[16px] leading-[1.3] text-[#f2f2f2]">Deep Dive</h3>
                            <div className="bg-white/10 rounded-xl px-3 py-[18px] flex flex-col gap-3">
                                {user.kidsPreference && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle cx="12" cy="8" r="4" strokeWidth="2"/>
                                                <path d="M12 12v8m-3-5l3 3 3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Thoughts on Kids</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.kidsPreference}</p>
                                        </div>
                                    </div>
                                )}
                                {user.religiousLevel && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M12 2C8.5 7 5.5 11.5 5.5 15.5a6.5 6.5 0 1 0 13 0C18.5 11.5 15.5 7 12 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col gap-[2px]" style={{ width: '123px' }}>
                                            <p className="font-['Poppins'] font-semibold text-[14px] leading-[1.4] text-white">Religious view</p>
                                            <p className="font-['Poppins'] text-[14px] leading-[1.4] text-white">{user.religiousLevel}</p>
                                        </div>
                                    </div>
                                )}
                                {user.intent?.profileQuestions?.livingSituation && (
                                    <div className="flex gap-[11px] items-center" style={{ width: '312px' }}>
                                        <div className="bg-white/10 rounded-full flex items-center justify-center shrink-0" style={{ width: '38px', height: '38px' }}>
                                            <svg className="text-white" style={{ width: '19px', height: '19px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2"/>
                                                <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2"/>
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
                </div>
            </div>
        </div>
    );
}
