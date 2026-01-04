import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userAPI } from '../../utils/api';

export default function UserProfileInfo() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, otherUser } = location.state || {};
    const [user, setUser] = useState(otherUser || null);
    const [loading, setLoading] = useState(!otherUser);
    const [bioMode, setBioMode] = useState('read');

    useEffect(() => {
        if (!userId && !otherUser) {
            navigate(-1);
            return;
        }

        // If we don't have full user data, fetch it
        if (userId && !otherUser) {
            loadUserProfile();
        }
    }, [userId, otherUser, navigate]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
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

    const interests = user.interests || ['AI', 'Blockchain', 'Data Science', 'Cybersecurity', 'Robotics', 'Machine Learning', 'Virtual Reality'];
    const watchlist = user.watchlist || [
        { title: 'True Detective', director: 'Frank Darabont', thumbnail: '/placeholder-thumb1.jpg' },
        { title: 'True Blood', director: 'Frank Darabont', thumbnail: '/placeholder-thumb2.jpg' }
    ];
    const tunes = user.tunes || [
        { title: 'Raabta', artist: 'Arijit Singh', thumbnail: '/placeholder-music1.jpg' },
        { title: 'Raabdi jodi', artist: 'Arijit Singh', thumbnail: '/placeholder-music2.jpg' }
    ];

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
                                <span className="text-white/70 text-[20px] font-normal">{user.age || calculateAge(user.dateOfBirth)}</span>
                            </div>
                            <p className="text-white text-xs">{user.occupation || 'Director'}</p>
                            <p className="text-white text-xs">{user.location || 'Bandra, Mumbai'}</p>
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
                        <span className="text-[#f1f1f1] text-xs text-center">{user.gender || 'Male'}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                            </svg>
                        </div>
                        <span className="text-[#f1f1f1] text-xs text-center">{user.relationshipStatus || 'Divorced'}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="2"/>
                                <circle cx="12" cy="9" r="2.5" strokeWidth="2"/>
                            </svg>
                        </div>
                        <span className="text-[#f1f1f1] text-xs text-center leading-tight">Bandra,<br/>Mumbai</span>
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="2"/>
                                <circle cx="12" cy="9" r="2.5" strokeWidth="2"/>
                            </svg>
                        </div>
                        <span className="text-[#f1f1f1] text-xs text-center leading-tight">From HSR,<br/>Bangalore</span>
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
                            {user.bio || "From boxing ring to monastery walls to...your DMs? Traded punches for prayers, now trading emails for epic adventures. Working remotely & traveling - seeking a co-conspirator for spontaneous fun. From boxing ring to monastery walls to...your DMs? Traded punches for prayers."}
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
                <div className="space-y-3">
                    <h3 className="text-[#f2f2f2] text-base font-semibold">Entertainment</h3>
                    <div className="bg-white/10 rounded-xl p-3 space-y-0.5">
                        {/* Watchlists */}
                        <div className="space-y-1">
                            <h4 className="text-[#f2f2f2] text-sm font-medium mb-1">Watchlists</h4>
                            {watchlist.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center py-2">
                                    <div className="w-12 h-12 bg-gray-700 rounded-sm overflow-hidden flex-shrink-0">
                                        <img 
                                            src={item.thumbnail} 
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = '/placeholder-thumb.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm truncate">{item.title}</p>
                                        <p className="text-white text-sm">
                                            Directed by <span className="font-bold">{item.director}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tunes */}
                        <div className="space-y-1 pt-2">
                            <h4 className="text-[#f2f2f2] text-sm font-medium mb-1">Tunes</h4>
                            {tunes.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center py-2">
                                    <div className="w-12 h-12 bg-gray-700 rounded-sm overflow-hidden flex-shrink-0">
                                        <img 
                                            src={item.thumbnail} 
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = '/placeholder-music.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm truncate">{item.title}</p>
                                        <p className="text-white text-sm">
                                            By <span className="font-bold">{item.artist}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-6"></div>
            </div>
        </div>
    );
}

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
