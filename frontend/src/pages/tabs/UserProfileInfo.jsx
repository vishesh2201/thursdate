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

    useEffect(() => {
        if (!userId) {
            navigate(-1);
            return;
        }

        // ALWAYS fetch fresh profile data from backend
        // ✅ If conversationId provided, backend will filter by level
        loadUserProfile();
    }, [userId, conversationId, navigate]);

    // ✅ Reload profile when page becomes visible (e.g., returning from profile questions)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && userId) {
                console.log('[Profile] Page visible, reloading profile...');
                loadUserProfile();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [userId, conversationId]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            // ✅ Fetch with conversationId to enable level-based filtering
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
    const facePhotos = user.facePhotos?.filter(Boolean) || [];

    return (
        <div 
            className="h-screen overflow-y-auto bg-cover bg-center"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('/bgs/faceverifybg.png')`
            }}
        >
            <div className="max-w-md mx-auto px-[18px] py-6 space-y-3">
                {/* Name, Age, Location Section */}
                <div className="flex items-start justify-between">
                    <div className="flex gap-2.5">
                        <div className="w-[70px] h-[70px] rounded-full border-[1.2px] border-[#f6f6f6] overflow-hidden shadow-lg">
                            <img
                                src={user.profilePicUrl || '/chatperson.png'}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-1">
                                <span className="text-white text-[20px] font-normal">{user.firstName || user.name},</span>
                                <span className="text-white/70 text-[20px] font-normal">{user.age || calculateAge(user.dob)}</span>
                            </div>
                            <p className="text-white text-xs">{user.intent?.profileQuestions?.jobTitle || 'Not specified'}</p>
                            <p className="text-white text-xs">{user.currentLocation || user.location || 'Location not specified'}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-[30px] h-[30px] bg-white/15 border border-white/30 rounded-full flex items-center justify-center"
                    >
                        <svg className="w-3.5 h-3.5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Gender, Status, Location Icons */}
                <div className="flex gap-6 justify-center">
                    <div className="flex flex-col items-center gap-2.5">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="8" r="5" strokeWidth="2"/>
                                <path d="M12 13v8m-4-4l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <span className="text-[#f1f1f1] text-xs text-center">{user.gender || 'Not specified'}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                            </svg>
                        </div>
                        <span className="text-[#f1f1f1] text-xs text-center">{user.relationshipStatus || 'Not specified'}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="2"/>
                                <circle cx="12" cy="9" r="2.5" strokeWidth="2"/>
                            </svg>
                        </div>
                        <span className="text-[#f1f1f1] text-xs text-center leading-tight">
                            {user.currentLocation || user.location || 'Location not specified'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="2"/>
                                <circle cx="12" cy="9" r="2.5" strokeWidth="2"/>
                            </svg>
                        </div>
                        <span className="text-[#f1f1f1] text-xs text-center leading-tight">
                            {user.fromLocation ? `From ${user.fromLocation}` : 'Origin not specified'}
                        </span>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="space-y-3">
                    <h3 className="text-[#f2f2f2] text-base font-semibold">Bio</h3>
                    <div className="bg-white/10 rounded-xl p-[18px] space-y-1.5">
                        {/* Read/Listen Toggle */}
                        <div className="flex bg-[rgba(118,118,128,0.5)] rounded-full p-2 mb-3">
                            <button
                                onClick={() => setBioMode('read')}
                                className={`flex-1 px-2.5 py-0.5 rounded-full text-sm font-semibold transition-all ${
                                    bioMode === 'read' 
                                        ? 'bg-white text-black shadow-lg' 
                                        : 'text-[#f2f2f2]'
                                }`}
                            >
                                Read
                            </button>
                            <button
                                onClick={() => setBioMode('listen')}
                                className={`flex-1 px-2.5 py-0.5 rounded-full text-sm font-medium transition-all ${
                                    bioMode === 'listen' 
                                        ? 'bg-white text-black shadow-lg' 
                                        : 'text-[#f2f2f2]'
                                }`}
                            >
                                Listen
                            </button>
                        </div>
                        <p className="text-[#f2f2f2] text-xs leading-[1.4]">
                            {user.intent?.bio || "No bio available"}
                        </p>
                    </div>
                </div>

                {/* Interests Section */}
                <div className="space-y-3">
                    <h3 className="text-[#f2f2f2] text-base font-semibold">Interests</h3>
                    <div className="flex flex-wrap gap-[18px]">
                        {interests.slice(0, 3).map((interest, idx) => (
                            <span
                                key={idx}
                                className="bg-white/10 rounded-full px-2.5 py-2 text-white text-xs font-medium"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-[18px]">
                        {interests.slice(3, 6).map((interest, idx) => (
                            <span
                                key={idx}
                                className="bg-white/10 rounded-full px-2.5 py-2 text-white text-xs font-medium"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-[18px]">
                        {interests.slice(6).map((interest, idx) => (
                            <span
                                key={idx}
                                className="bg-white/10 rounded-full px-2.5 py-2 text-white text-xs font-medium"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Level 2 Lifestyle & Preferences Section */}
                {user.visibilityLevel >= 2 && (
                    <div className="space-y-3">
                        <h3 className="text-[#f2f2f2] text-base font-semibold">Lifestyle & Preferences</h3>
                        <div className="bg-white/10 rounded-xl p-[18px] space-y-3">
                            {user.pets && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Pets</span>
                                    <span className="text-white text-sm font-medium">{user.pets}</span>
                                </div>
                            )}
                            {user.drinking && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Drinking</span>
                                    <span className="text-white text-sm font-medium">{user.drinking}</span>
                                </div>
                            )}
                            {user.smoking && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Smoking</span>
                                    <span className="text-white text-sm font-medium">{user.smoking}</span>
                                </div>
                            )}
                            {user.height && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Height</span>
                                    <span className="text-white text-sm font-medium">{user.height} cm</span>
                                </div>
                            )}
                            {user.foodPreference && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Food</span>
                                    <span className="text-white text-sm font-medium">{user.foodPreference}</span>
                                </div>
                            )}
                            {user.religiousLevel && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[#f2f2f2]/70 text-sm">Religious Level</span>
                                    <span className="text-white text-sm font-medium">{user.religiousLevel}</span>
                                </div>
                            )}
                            
                            {/* Level 2 Profile Questions */}
                            {user.intent?.profileQuestions?.jobTitle && (
                                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Job Title</span>
                                    <span className="text-white text-sm font-medium">{user.intent.profileQuestions.jobTitle}</span>
                                </div>
                            )}
                            {user.intent?.profileQuestions?.companyName && (
                                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Company</span>
                                    <span className="text-white text-sm font-medium">{user.intent.profileQuestions.companyName}</span>
                                </div>
                            )}
                            {user.intent?.profileQuestions?.education && (
                                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Education</span>
                                    <span className="text-white text-sm font-medium">
                                        {user.intent.profileQuestions.education}
                                        {user.intent.profileQuestions.educationDetail && 
                                            ` - ${user.intent.profileQuestions.educationDetail}`}
                                    </span>
                                </div>
                            )}
                            {user.intent?.profileQuestions?.languages && user.intent.profileQuestions.languages.length > 0 && (
                                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Languages</span>
                                    <span className="text-white text-sm font-medium">{user.intent.profileQuestions.languages.join(', ')}</span>
                                </div>
                            )}
                            {user.intent?.profileQuestions?.sleepSchedule && (
                                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Sleep Schedule</span>
                                    <span className="text-white text-sm font-medium">{user.intent.profileQuestions.sleepSchedule}</span>
                                </div>
                            )}
                            {user.intent?.profileQuestions?.dateBill && (
                                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Date Bill Preference</span>
                                    <span className="text-white text-sm font-medium">{user.intent.profileQuestions.dateBill}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Level 3 Personal & Deep Information Section */}
                {user.visibilityLevel >= 3 && (
                    <div className="space-y-3">
                        <h3 className="text-[#f2f2f2] text-base font-semibold">Personal Information</h3>
                        <div className="bg-white/10 rounded-xl p-[18px] space-y-3">
                            {user.intent?.profileQuestions?.religion && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Religion</span>
                                    <span className="text-white text-sm font-medium">{user.intent.profileQuestions.religion}</span>
                                </div>
                            )}
                            {user.intent?.profileQuestions?.livingSituation && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Lives alone or with family?</span>
                                    <span className="text-white text-sm font-medium">{user.intent.profileQuestions.livingSituation}</span>
                                </div>
                            )}
                            {user.intent?.profileQuestions?.relationshipValues && user.intent.profileQuestions.relationshipValues.length > 0 && (
                                <div className="border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Relationship Values</span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {user.intent.profileQuestions.relationshipValues.map((value, idx) => (
                                            <span key={idx} className="bg-white/10 rounded-full px-3 py-1 text-white text-xs">
                                                {value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {user.kidsPreference && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Kids Preference</span>
                                    <span className="text-white text-sm font-medium">{user.kidsPreference}</span>
                                </div>
                            )}
                            {user.favouriteTravelDestination && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Favorite holiday destination </span>
                                    <span className="text-white text-sm font-medium">{user.favouriteTravelDestination}</span>
                                </div>
                            )}
                            {user.lastHolidayPlaces && user.lastHolidayPlaces.length > 0 && (
                                <div className="border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Last Holiday Places</span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {user.lastHolidayPlaces.map((place, idx) => (
                                            <span key={idx} className="bg-white/10 rounded-full px-3 py-1 text-white text-xs">
                                                {typeof place === 'string' ? place : place?.name || place?.details || ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {user.favouritePlacesToGo && user.favouritePlacesToGo.length > 0 && (
                                <div className="border-b border-white/10 pb-3">
                                    <span className="text-[#f2f2f2]/70 text-sm">Favorite Places to Go</span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {user.favouritePlacesToGo.map((place, idx) => (
                                            <span key={idx} className="bg-white/10 rounded-full px-3 py-1 text-white text-xs">
                                                {typeof place === 'string' ? place : place?.name || place?.details || ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Face Photos Section (Level 3) */}
                {user.visibilityLevel >= 3 && facePhotos.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-[#f2f2f2] text-base font-semibold">More Photos</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {facePhotos.map((photo, idx) => (
                                <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-white/10">
                                    <img 
                                        src={photo} 
                                        alt={`Face photo ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Entertainment Section */}
                {(watchlist.length > 0 || tvShows.length > 0 || movies.length > 0 || artistsBands.length > 0) && (
                    <div className="space-y-3">
                        <h3 className="text-[#f2f2f2] text-base font-semibold">Entertainment</h3>
                        <div className="bg-white/10 rounded-xl p-3 space-y-0.5">
                            {/* Watchlists */}
                            {watchlist.length > 0 && (
                                <div className="space-y-1">
                                    <h4 className="text-[#f2f2f2] text-sm font-medium mb-1">Watchlist</h4>
                                    {watchlist.map((item, idx) => (
                                        <div key={idx} className="py-2">
                                            <p className="text-white text-sm">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TV Shows */}
                            {tvShows.length > 0 && (
                                <div className="space-y-1 pt-2">
                                    <h4 className="text-[#f2f2f2] text-sm font-medium mb-1">TV Shows</h4>
                                    {tvShows.map((show, idx) => (
                                        <div key={idx} className="py-2">
                                            <p className="text-white text-sm">{show}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Movies */}
                            {movies.length > 0 && (
                                <div className="space-y-1 pt-2">
                                    <h4 className="text-[#f2f2f2] text-sm font-medium mb-1">Movies</h4>
                                    {movies.map((movie, idx) => (
                                        <div key={idx} className="py-2">
                                            <p className="text-white text-sm">{movie}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Artists/Bands */}
                            {artistsBands.length > 0 && (
                                <div className="space-y-1 pt-2">
                                    <h4 className="text-[#f2f2f2] text-sm font-medium mb-1">Music</h4>
                                    {artistsBands.map((artist, idx) => (
                                        <div key={idx} className="py-2">
                                            <p className="text-white text-sm">{artist}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="h-6"></div>
            </div>
        </div>
    );
}
