import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userAPI } from '../../utils/api';

export default function UserProfileInfo() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = location.state || {};
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bioMode, setBioMode] = useState('read');

    useEffect(() => {
        if (!userId) {
            navigate(-1);
            return;
        }

        // ALWAYS fetch fresh profile data from backend
        // This ensures consistent, up-to-date information
        loadUserProfile();
    }, [userId, navigate]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            // Fetch fresh data from users table (authoritative source)
            const data = await userAPI.getUserProfile(userId);
            setUser(data);
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
