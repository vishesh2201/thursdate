import { useState, useEffect } from "react";
import { userAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";

export default function ProfileTab() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingSection, setEditingSection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError("");
      try {
        const userData = await userAPI.getProfile();
        console.log('[ProfileTab] Loaded user data:', userData);
        console.log('[ProfileTab] Profile picture URL:', userData.profilePicUrl);
        console.log('[ProfileTab] Face photos:', userData.facePhotos);
        console.log('[ProfileTab] Using photo:', userData.profilePicUrl || userData.facePhotos?.[0] || 'none');
        setUserInfo(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  function getAge(dob) {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  const lifestyleImages = userInfo?.intent?.lifestyleImageUrls?.filter(Boolean) || [];

  const handleEditClick = (section) => {
    setEditingSection(section);
    if (section === 'header') {
      setEditFormData({
        firstName: userInfo?.firstName || '',
        lastName: userInfo?.lastName || '',
        dob: userInfo?.dob || '',
        height: userInfo?.height || '',
        gender: userInfo?.gender || '',
        jobTitle: userInfo?.intent?.profileQuestions?.jobTitle || '',
        relationshipStatus: userInfo?.relationshipStatus || '',
        fromLocation: userInfo?.fromLocation || '',
        currentLocation: userInfo?.currentLocation || '',
      });
    } else if (section === 'lifestyleImages') {
      setEditFormData({
        lifestyleImages: [...(userInfo?.intent?.lifestyleImageUrls?.filter(Boolean) || [])],
      });
    } else if (section === 'bio') {
      setEditFormData({
        bio: userInfo?.intent?.bio || '',
      });
    } else if (section === 'work') {
      setEditFormData({
        jobTitle: userInfo?.intent?.profileQuestions?.jobTitle || '',
        company: userInfo?.intent?.profileQuestions?.companyName || '',
        school: userInfo?.intent?.profileQuestions?.education || '',
        educationLevel: userInfo?.intent?.profileQuestions?.educationLevel || '',
      });
    } else if (section === 'personal') {
      setEditFormData({
        personalPhotos: [...(userInfo?.facePhotos?.filter(Boolean) || [])],
      });
    } else if (section === 'interests') {
      setEditFormData({
        interests: [...(userInfo?.interests || [])],
        newInterest: '',
      });
    } else if (section === 'entertainment') {
      setEditFormData({
        watchList: [...(userInfo?.intent?.watchList || [])],
        tvShows: [...(userInfo?.intent?.tvShows || [])],
        movies: [...(userInfo?.intent?.movies || [])],
        artistsBands: [...(userInfo?.intent?.artistsBands || [])],
        newWatchList: '',
        newTvShow: '',
        newMovie: '',
        newArtist: '',
      });
    } else if (section === 'lifestyle') {
      setEditFormData({
        pets: userInfo?.pets || '',
        foodPreference: userInfo?.foodPreference || '',
        sleepSchedule: userInfo?.intent?.profileQuestions?.sleepSchedule || '',
        drinking: userInfo?.drinking || '',
        smoking: userInfo?.smoking || '',
      });
    } else if (section === 'personality') {
      setEditFormData({
        dateBill: userInfo?.intent?.profileQuestions?.dateBill || '',
        relationshipValues: userInfo?.intent?.profileQuestions?.relationshipValues?.[0] || '',
      });
    } else if (section === 'deepDive') {
      setEditFormData({
        favouriteTravelDestination: userInfo?.favouriteTravelDestination || '',
        kidsPreference: userInfo?.kidsPreference || '',
        religiousLevel: userInfo?.religiousLevel || '',
        religion: userInfo?.intent?.profileQuestions?.religion || '',
        livingSituation: userInfo?.intent?.profileQuestions?.livingSituation || '',
      });
    } else if (section === 'languages') {
      setEditFormData({
        languages: [...(userInfo?.intent?.profileQuestions?.languages || [])],
        newLanguage: '',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      let updateData;

      if (editingSection === 'header') {
        // Prepare the data for API
        updateData = {
          ...editFormData,
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              jobTitle: editFormData.jobTitle,
            },
          },
        };
      } else if (editingSection === 'lifestyleImages') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            lifestyleImageUrls: editFormData.lifestyleImages,
          },
        };
      } else if (editingSection === 'bio') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            bio: editFormData.bio,
          },
        };
      } else if (editingSection === 'work') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              jobTitle: editFormData.jobTitle,
              companyName: editFormData.company,
              education: editFormData.school,
              educationLevel: editFormData.educationLevel,
            },
          },
        };
      } else if (editingSection === 'personal') {
        updateData = {
          facePhotos: editFormData.personalPhotos,
        };
      } else if (editingSection === 'interests') {
        updateData = {
          interests: editFormData.interests,
        };
      } else if (editingSection === 'entertainment') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            watchList: editFormData.watchList,
            tvShows: editFormData.tvShows,
            movies: editFormData.movies,
            artistsBands: editFormData.artistsBands,
          },
        };
      } else if (editingSection === 'lifestyle') {
        updateData = {
          pets: editFormData.pets,
          foodPreference: editFormData.foodPreference,
          drinking: editFormData.drinking,
          smoking: editFormData.smoking,
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              sleepSchedule: editFormData.sleepSchedule,
            },
          },
        };
      } else if (editingSection === 'personality') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              dateBill: editFormData.dateBill,
              relationshipValues: editFormData.relationshipValues ? [editFormData.relationshipValues] : [],
            },
          },
        };
      } else if (editingSection === 'deepDive') {
        updateData = {
          favouriteTravelDestination: editFormData.favouriteTravelDestination,
          kidsPreference: editFormData.kidsPreference,
          religiousLevel: editFormData.religiousLevel,
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              religion: editFormData.religion,
              livingSituation: editFormData.livingSituation,
            },
          },
        };
      } else if (editingSection === 'languages') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              languages: editFormData.languages,
            },
          },
        };
      }

      await userAPI.updateProfile(updateData);      // Refresh user data
      const userData = await userAPI.getProfile();
      setUserInfo(userData);
      setEditingSection(null);
      setEditFormData({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLifestyleImage = (index) => {
    const updatedImages = editFormData.lifestyleImages.filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, lifestyleImages: updatedImages }));
  };

  const handleAddLifestyleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      // Upload to Cloudinary or your image service
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/upload/lifestyle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const imageUrl = data.url;

      setEditFormData(prev => ({
        ...prev,
        lifestyleImages: [...prev.lifestyleImages, imageUrl],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePersonalPhoto = (index) => {
    const updatedPhotos = editFormData.personalPhotos.filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, personalPhotos: updatedPhotos }));
  };

  const handleAddPersonalPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      // Upload to Cloudinary or your image service
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/upload/face`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const imageUrl = data.url;

      setEditFormData(prev => ({
        ...prev,
        personalPhotos: [...prev.personalPhotos, imageUrl],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Interests handlers
  const handleRemoveInterest = (index) => {
    setEditFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddInterest = () => {
    if (editFormData.newInterest?.trim()) {
      setEditFormData(prev => ({
        ...prev,
        interests: [...(prev.interests || []), prev.newInterest.trim()],
        newInterest: '',
      }));
    }
  };

  // Entertainment handlers
  const handleRemoveEntertainmentItem = (category, index) => {
    setEditFormData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, idx) => idx !== index),
    }));
  };

  const handleAddEntertainmentItem = (category, inputField) => {
    if (editFormData[inputField]?.trim()) {
      setEditFormData(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), prev[inputField].trim()],
        [inputField]: '',
      }));
    }
  };

  // Languages handlers
  const handleRemoveLanguage = (index) => {
    setEditFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddLanguage = () => {
    if (editFormData.newLanguage?.trim()) {
      setEditFormData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), prev.newLanguage.trim()],
        newLanguage: '',
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-screen w-full font-sans overflow-hidden fixed inset-0">
      {/* Blurred Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/bgs/bg-profile.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Content Layer */}
      <div className="relative h-full w-full flex flex-col">
        {/* Top Bar (FIXED) */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4">
          <div style={{ width: 40 }}></div>
          <div className="text-white text-xl font-semibold">Profile</div>
          {editingSection ? (
            <button
              onClick={handleCancelEdit}
              className="text-white/80 text-sm hover:text-white transition"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
            >
              <img src="/settings.svg" alt="Settings" className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Scrollable CARD WRAPPER */}
        <div className="px-4 pb-20 h-[calc(100vh-120px)]">
          <div className="bg-white/1 backdrop-blur-2xl rounded-3xl p-5 pb-8 border border-white/20 shadow-lg h-full overflow-y-auto" style={{ backdropFilter: 'blur(60px) saturate(150%)' }}>

            {/* --- ALL YOUR ORIGINAL CONTENT BELOW --- */}

            {loading && <div className="text-center text-white mt-8">Loading...</div>}
            {error && <div className="text-red-400 text-center mt-8">{error}</div>}

            {/* Profile Header */}
            {editingSection === 'header' ? (
              // Edit Mode
              <div className="mb-6">
                {/* Profile Picture with Edit Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/50">
                      {userInfo?.profilePicUrl ? (
                        <img src={userInfo.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/30"></div>
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center border-2 border-white">
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Nickname */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Nickname</label>
                    <input
                      type="text"
                      value={editFormData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Alex"
                    />
                  </div>

                  {/* Age - Disabled */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Age</label>
                    <input
                      type="text"
                      value={editFormData.dob || ''}
                      disabled
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 text-white/50 cursor-not-allowed"
                    />
                  </div>

                  {/* Height - Disabled */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Height</label>
                    <input
                      type="text"
                      value={editFormData.height || ''}
                      disabled
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 text-white/50 cursor-not-allowed"
                    />
                  </div>

                  {/* Info Text */}
                  <div className="flex items-start gap-2 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                    <svg className="w-4 h-4 text-white/70 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/70 text-xs">Some details (like Name, age, & height) are fixed and cannot be changed.</span>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Gender</label>
                    <select
                      value={editFormData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="Male" className="bg-gray-800 text-white">Male</option>
                      <option value="Female" className="bg-gray-800 text-white">Female</option>
                      <option value="Other" className="bg-gray-800 text-white">Other</option>
                    </select>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Job title</label>
                    <input
                      type="text"
                      value={editFormData.jobTitle || ''}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Director"
                    />
                  </div>

                  {/* Current Relationship */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Current relationship</label>
                    <select
                      value={editFormData.relationshipStatus || ''}
                      onChange={(e) => handleInputChange('relationshipStatus', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="Single" className="bg-gray-800 text-white">Single</option>
                      <option value="Divorced" className="bg-gray-800 text-white">Divorced</option>
                      <option value="Separated" className="bg-gray-800 text-white">Separated</option>
                      <option value="Widowed" className="bg-gray-800 text-white">Widowed</option>
                      <option value="Complicated" className="bg-gray-800 text-white">It's Complicated</option>
                    </select>
                  </div>

                  {/* Currently Living */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Currently living</label>
                    <input
                      type="text"
                      value={editFormData.fromLocation || ''}
                      onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Bandra, Mumbai"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">City</label>
                    <input
                      type="text"
                      value={editFormData.currentLocation || ''}
                      onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="HSR, Bangalore"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveEdit}
                    className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-6"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50">
                    {userInfo?.profilePicUrl ? (
                      <img src={userInfo.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/30"></div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-lg font-semibold">
                        {userInfo?.firstName || ''} {userInfo?.lastName || ''}, {userInfo?.dob ? getAge(userInfo.dob) : ''}
                      </div>
                      <div className="text-white/70 text-sm">
                        {userInfo?.intent?.profileQuestions?.jobTitle || 'Not specified'}
                      </div>
                      <div className="text-white/60 text-xs">
                        {userInfo?.fromLocation || userInfo?.currentLocation || ''}
                      </div>
                    </div>

                    <button
                      onClick={() => handleEditClick('header')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Info Icons */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/20">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileMale.svg" alt="Gender" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1">{userInfo?.gender || 'Gender'}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileHeight.svg" alt="Height" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1">{userInfo?.height || 'Height'}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileRelationship.svg" alt="Relationship" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1">{userInfo?.relationshipStatus || 'Status'}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileOriginalLocation.svg" alt="From Location" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1 max-w-[60px] truncate text-center">
                  {userInfo?.fromLocation || 'From'}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileLocation.svg" alt="Current Location" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1 truncate max-w-[60px] text-center">
                  {userInfo?.currentLocation || 'Current'}
                </span>
              </div>
            </div>

            {/* Lifestyle Pictures */}
            {editingSection === 'lifestyleImages' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {editFormData.lifestyleImages?.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-white/10">
                      <img src={img} alt={`Lifestyle ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveLifestyleImage(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add More Photos Button */}
                  {editFormData.lifestyleImages?.length < 6 && (
                    <label className="aspect-square rounded-xl bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-dashed border-white/30 cursor-pointer hover:bg-white/15 transition">
                      <span className="text-white text-3xl mb-1">+</span>
                      <span className="text-white/70 text-xs text-center px-2">Add more photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddLifestyleImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-6"
                >
                  Save changes
                </button>
              </div>
            ) : (
              // View Mode
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Lifestyle Pictures</h3>
                  <button
                    onClick={() => handleEditClick('lifestyleImages')}
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                  <div className="grid grid-cols-3 gap-2">
                    {lifestyleImages.slice(0, 5).map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-white/10">
                        <img src={img} alt={`Lifestyle ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {lifestyleImages.length < 5 && (
                      <div className="aspect-square rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-dashed border-white/30">
                        <span className="text-white/50 text-xs">+ Add more photos</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bio */}
            {editingSection === 'bio' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Bio</h3>
                </div>

                <textarea
                  value={editFormData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50 min-h-[120px] resize-none"
                  placeholder="Write something about yourself..."
                  rows={5}
                />

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              userInfo?.intent?.bio && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Bio</h3>
                    <button
                      onClick={() => handleEditClick('bio')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    <p className="text-white/90 text-sm leading-relaxed">{userInfo.intent.bio}</p>
                  </div>
                </div>
              )
            )}

            {/* Work & Education */}
            {editingSection === 'work' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Work & Education</h3>
                </div>

                <div className="space-y-4">
                  {/* Job Title */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Job Title</label>
                    <input
                      type="text"
                      value={editFormData.jobTitle || ''}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Product Designer"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Company</label>
                    <input
                      type="text"
                      value={editFormData.company || ''}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Frick"
                    />
                  </div>

                  {/* School / College / University Name */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">School / College / University Name</label>
                    <input
                      type="text"
                      value={editFormData.school || ''}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Ex, NID Bangalore"
                    />
                  </div>

                  {/* Level of Education - Dropdown */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Level of Education</label>
                    <select
                      value={editFormData.educationLevel || ''}
                      onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select level</option>
                      <option value="High School" className="bg-gray-800 text-white">High School</option>
                      <option value="Undergraduate" className="bg-gray-800 text-white">Undergraduate</option>
                      <option value="Postgraduate" className="bg-gray-800 text-white">Postgraduate</option>
                      <option value="Doctorate" className="bg-gray-800 text-white">Doctorate</option>
                      <option value="Other" className="bg-gray-800 text-white">Other</option>
                    </select>
                  </div>

                  {/* Add Work Button */}
                  <button className="w-full py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 text-white hover:bg-white/20 transition flex items-center justify-center gap-2">
                    <span>Add Work</span>
                    <span className="text-xl">+</span>
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveEdit}
                    className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            ) : (
              (userInfo?.intent?.profileQuestions?.jobTitle || userInfo?.intent?.profileQuestions?.education) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Work & Education</h3>
                    <button
                      onClick={() => handleEditClick('work')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-3">
                    {userInfo?.intent?.profileQuestions?.jobTitle && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                          <img src="/profileWork.svg" alt="Work" className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.jobTitle}</div>
                          {userInfo?.intent?.profileQuestions?.companyName && (
                            <div className="text-white/70 text-xs">{userInfo.intent.profileQuestions.companyName}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {userInfo?.intent?.profileQuestions?.education && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                          <img src="/profileEducation.svg" alt="Education" className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.education}</div>
                          {userInfo?.intent?.profileQuestions?.educationLevel && (
                            <div className="text-white/70 text-xs">{userInfo.intent.profileQuestions.educationLevel}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Personal Photos */}
            {editingSection === 'personal' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {editFormData.personalPhotos?.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-white/10">
                      <img src={photo} alt={`Personal ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemovePersonalPhoto(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add More Photos Button */}
                  {editFormData.personalPhotos?.length < 6 && (
                    <label className="aspect-square rounded-xl bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-dashed border-white/30 cursor-pointer hover:bg-white/15 transition">
                      <span className="text-white text-3xl mb-1">+</span>
                      <span className="text-white/70 text-xs text-center px-2">Add more photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddPersonalPhoto}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-6"
                >
                  Save changes
                </button>
              </div>
            ) : (
              // View Mode
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Personal Photos</h3>
                  <button
                    onClick={() => handleEditClick('personal')}
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                  <div className="grid grid-cols-3 gap-2">
                    {userInfo?.facePhotos && userInfo.facePhotos.length > 0 ? (
                      userInfo.facePhotos.map((photo, idx) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-white/10">
                          <img src={photo} alt={`Personal ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <>
                        {[...Array(3)].map((_, idx) => (
                          <div key={idx} className="aspect-square rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-dashed border-white/30">
                            <span className="text-white/50 text-xs">+ Add photo</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Interests */}
            {editingSection === 'interests' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-3">Interests</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {editFormData.interests?.map((interest, idx) => (
                    <div key={idx} className="relative px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 pr-8">
                      <span className="text-white text-xs font-medium">{interest}</span>
                      <button
                        onClick={() => handleRemoveInterest(idx)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 w-4 h-4 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                      >
                        <svg className="w-2.5 h-2.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Interest */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={editFormData.newInterest || ''}
                    onChange={(e) => handleInputChange('newInterest', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                    placeholder="Add an interest"
                    className="flex-1 px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50"
                  />
                  <button
                    onClick={handleAddInterest}
                    className="px-4 py-2.5 bg-white/30 backdrop-blur-md rounded-xl border border-white/30 text-white hover:bg-white/40 transition"
                  >
                    Add
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition"
                >
                  Save changes
                </button>
              </div>
            ) : (
              // View Mode
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Interests</h3>
                  <button
                    onClick={() => handleEditClick('interests')}
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {userInfo?.interests && userInfo.interests.length > 0 ? (
                    userInfo.interests.map((interest, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                        <span className="text-white text-xs font-medium">{interest}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/50 text-sm">No interests added yet</div>
                  )}
                </div>
              </div>
            )}

            {/* Entertainment */}
            {editingSection === 'entertainment' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-4">Entertainment</h3>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-4">
                  {/* Watchlist */}
                  <div>
                    <div className="text-white/70 text-xs font-medium mb-2">Watchlist</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editFormData.watchList?.map((item, idx) => (
                        <div key={idx} className="relative px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 pr-7">
                          <span className="text-white text-xs">{item}</span>
                          <button
                            onClick={() => handleRemoveEntertainmentItem('watchList', idx)}
                            className="absolute top-1/2 right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                          >
                            <svg className="w-2 h-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editFormData.newWatchList || ''}
                        onChange={(e) => handleInputChange('newWatchList', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEntertainmentItem('watchList', 'newWatchList')}
                        placeholder="Add to watchlist"
                        className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-white/40"
                      />
                      <button
                        onClick={() => handleAddEntertainmentItem('watchList', 'newWatchList')}
                        className="px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white text-xs hover:bg-white/30 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* TV Shows */}
                  <div>
                    <div className="text-white/70 text-xs font-medium mb-2">TV Shows</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editFormData.tvShows?.map((show, idx) => (
                        <div key={idx} className="relative px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 pr-7">
                          <span className="text-white text-xs">{show}</span>
                          <button
                            onClick={() => handleRemoveEntertainmentItem('tvShows', idx)}
                            className="absolute top-1/2 right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                          >
                            <svg className="w-2 h-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editFormData.newTvShow || ''}
                        onChange={(e) => handleInputChange('newTvShow', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEntertainmentItem('tvShows', 'newTvShow')}
                        placeholder="Add TV show"
                        className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-white/40"
                      />
                      <button
                        onClick={() => handleAddEntertainmentItem('tvShows', 'newTvShow')}
                        className="px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white text-xs hover:bg-white/30 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Movies */}
                  <div>
                    <div className="text-white/70 text-xs font-medium mb-2">Movies</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editFormData.movies?.map((movie, idx) => (
                        <div key={idx} className="relative px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 pr-7">
                          <span className="text-white text-xs">{movie}</span>
                          <button
                            onClick={() => handleRemoveEntertainmentItem('movies', idx)}
                            className="absolute top-1/2 right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                          >
                            <svg className="w-2 h-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editFormData.newMovie || ''}
                        onChange={(e) => handleInputChange('newMovie', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEntertainmentItem('movies', 'newMovie')}
                        placeholder="Add movie"
                        className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-white/40"
                      />
                      <button
                        onClick={() => handleAddEntertainmentItem('movies', 'newMovie')}
                        className="px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white text-xs hover:bg-white/30 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Artists/Bands */}
                  <div>
                    <div className="text-white/70 text-xs font-medium mb-2">Tunes</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editFormData.artistsBands?.map((artist, idx) => (
                        <div key={idx} className="relative px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 pr-7">
                          <span className="text-white text-xs">{artist}</span>
                          <button
                            onClick={() => handleRemoveEntertainmentItem('artistsBands', idx)}
                            className="absolute top-1/2 right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                          >
                            <svg className="w-2 h-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editFormData.newArtist || ''}
                        onChange={(e) => handleInputChange('newArtist', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEntertainmentItem('artistsBands', 'newArtist')}
                        placeholder="Add artist/band"
                        className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-white/40"
                      />
                      <button
                        onClick={() => handleAddEntertainmentItem('artistsBands', 'newArtist')}
                        className="px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white text-xs hover:bg-white/30 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              (userInfo?.intent?.watchList?.length > 0 || userInfo?.intent?.tvShows?.length > 0 || userInfo?.intent?.movies?.length > 0 || userInfo?.intent?.artistsBands?.length > 0) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Entertainment</h3>
                    <button
                      onClick={() => handleEditClick('entertainment')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    {/* Watchlist */}
                    {userInfo?.intent?.watchList && userInfo.intent.watchList.length > 0 && (
                      <div className="mb-4">
                        <div className="text-white/70 text-xs font-medium mb-2">Watchlist</div>
                        <div className="flex flex-wrap gap-2">
                          {userInfo.intent.watchList.map((item, idx) => (
                            <div key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                              <span className="text-white text-xs">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TV Shows */}
                    {userInfo?.intent?.tvShows && userInfo.intent.tvShows.length > 0 && (
                      <div className="mb-4">
                        <div className="text-white/70 text-xs font-medium mb-2">TV Shows</div>
                        <div className="flex flex-wrap gap-2">
                          {userInfo.intent.tvShows.map((show, idx) => (
                            <div key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                              <span className="text-white text-xs">{show}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Movies */}
                    {userInfo?.intent?.movies && userInfo.intent.movies.length > 0 && (
                      <div className="mb-4">
                        <div className="text-white/70 text-xs font-medium mb-2">Movies</div>
                        <div className="flex flex-wrap gap-2">
                          {userInfo.intent.movies.map((movie, idx) => (
                            <div key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                              <span className="text-white text-xs">{movie}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Artists/Bands */}
                    {userInfo?.intent?.artistsBands && userInfo.intent.artistsBands.length > 0 && (
                      <div>
                        <div className="text-white/70 text-xs font-medium mb-2">Tunes</div>
                        <div className="flex flex-wrap gap-2">
                          {userInfo.intent.artistsBands.map((artist, idx) => (
                            <div key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                              <span className="text-white text-xs">{artist}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Lifestyle */}
            {editingSection === 'lifestyle' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-4">Lifestyle</h3>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-4">
                  {/* Pet Preference */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Pet Preference</label>
                    <select
                      value={editFormData.pets || ''}
                      onChange={(e) => handleInputChange('pets', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Dog Lover" className="bg-gray-800 text-white">Dog Lover</option>
                      <option value="Cat Lover" className="bg-gray-800 text-white">Cat Lover</option>
                      <option value="Pet-free" className="bg-gray-800 text-white">Pet-free</option>
                      <option value="All the Pets" className="bg-gray-800 text-white">All the Pets</option>
                      <option value="Want a Pet" className="bg-gray-800 text-white">Want a Pet</option>
                      <option value="Allergic to Pets" className="bg-gray-800 text-white">Allergic to Pets</option>
                    </select>
                  </div>

                  {/* Food Preference */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Food Preference</label>
                    <select
                      value={editFormData.foodPreference || ''}
                      onChange={(e) => handleInputChange('foodPreference', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Vegetarian" className="bg-gray-800 text-white">Vegetarian</option>
                      <option value="Vegan" className="bg-gray-800 text-white">Vegan</option>
                      <option value="Non-vegetarian" className="bg-gray-800 text-white">Non-vegetarian</option>
                      <option value="Eggetarian" className="bg-gray-800 text-white">Eggetarian</option>
                      <option value="Jain" className="bg-gray-800 text-white">Jain</option>
                      <option value="Halal" className="bg-gray-800 text-white">Halal</option>
                      <option value="Kosher" className="bg-gray-800 text-white">Kosher</option>
                    </select>
                  </div>

                  {/* Morning/Night Person */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Morning/Night Person</label>
                    <select
                      value={editFormData.sleepSchedule || ''}
                      onChange={(e) => handleInputChange('sleepSchedule', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select schedule</option>
                      <option value="Early Bird" className="bg-gray-800 text-white">Early Bird</option>
                      <option value="Night Owl" className="bg-gray-800 text-white">Night Owl</option>
                      <option value="In Between" className="bg-gray-800 text-white">In Between</option>
                    </select>
                  </div>

                  {/* Drinking */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Drinking</label>
                    <select
                      value={editFormData.drinking || ''}
                      onChange={(e) => handleInputChange('drinking', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Yes" className="bg-gray-800 text-white">Yes</option>
                      <option value="No" className="bg-gray-800 text-white">No</option>
                      <option value="Socially" className="bg-gray-800 text-white">Socially</option>
                      <option value="Occasionally" className="bg-gray-800 text-white">Occasionally</option>
                      <option value="Trying to Quit" className="bg-gray-800 text-white">Trying to Quit</option>
                    </select>
                  </div>

                  {/* Smoking */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Smoking</label>
                    <select
                      value={editFormData.smoking || ''}
                      onChange={(e) => handleInputChange('smoking', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Yes" className="bg-gray-800 text-white">Yes</option>
                      <option value="No" className="bg-gray-800 text-white">No</option>
                      <option value="Socially" className="bg-gray-800 text-white">Socially</option>
                      <option value="Occasionally" className="bg-gray-800 text-white">Occasionally</option>
                      <option value="Trying to Quit" className="bg-gray-800 text-white">Trying to Quit</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              (userInfo?.pets || userInfo?.foodPreference || userInfo?.intent?.profileQuestions?.sleepSchedule || userInfo?.drinking || userInfo?.smoking) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Lifestyle</h3>
                    <button
                      onClick={() => handleEditClick('lifestyle')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    <div className="space-y-3">
                      {userInfo?.pets && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profilePetPreference.svg" alt="Pet Preference" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Pet Preference</div>
                            <div className="text-white font-medium text-sm">{userInfo.pets}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.foodPreference && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileFoodPreference.svg" alt="Food Preference" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Food Preference</div>
                            <div className="text-white font-medium text-sm">{userInfo.foodPreference}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.intent?.profileQuestions?.sleepSchedule && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileMorningPerson.svg" alt="Morning/Night Person" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Morning/Night Person</div>
                            <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.sleepSchedule}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.drinking && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileDrinking.svg" alt="Drinking" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Drinking</div>
                            <div className="text-white font-medium text-sm">{userInfo.drinking}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.smoking && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileSmoking.svg" alt="Smoking" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Smoking</div>
                            <div className="text-white font-medium text-sm">{userInfo.smoking}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Personality & Social Style */}
            {editingSection === 'personality' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-4">Personality & Social Style</h3>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-4">
                  {/* When the Bill Arrives */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">When the Bill Arrives</label>
                    <select
                      value={editFormData.dateBill || ''}
                      onChange={(e) => handleInputChange('dateBill', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Split the bill" className="bg-gray-800 text-white">Split the bill</option>
                      <option value="I'll pay" className="bg-gray-800 text-white">I'll pay</option>
                      <option value="Treat me" className="bg-gray-800 text-white">Treat me</option>
                      <option value="We'll figure it out" className="bg-gray-800 text-white">We'll figure it out</option>
                    </select>
                  </div>

                  {/* What I look for in a relationship */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">What I look for in a relationship</label>
                    <input
                      type="text"
                      value={editFormData.relationshipValues || ''}
                      onChange={(e) => handleInputChange('relationshipValues', e.target.value)}
                      placeholder="e.g., Trust, Communication, Adventure"
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              (userInfo?.intent?.profileQuestions?.dateBill || userInfo?.intent?.profileQuestions?.relationshipValues || userInfo?.intent?.profileQuestions?.livingSituation) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Personality & Social Style</h3>
                    <button
                      onClick={() => handleEditClick('personality')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    <div className="space-y-3">
                      {userInfo?.intent?.profileQuestions?.dateBill && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileBill.svg" alt="Bill" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">When the Bill Arrives</div>
                            <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.dateBill}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.intent?.profileQuestions?.relationshipValues && userInfo.intent.profileQuestions.relationshipValues.length > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileLook.svg" alt="Relationship Values" className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white/70 text-xs mb-1">What I look for in a relationship</div>
                            <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.relationshipValues.join(', ')}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Deep Dive */}
            {editingSection === 'deepDive' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-4">Deep Dive</h3>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-4">
                  {/* Favorite Destination */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Favorite Destination</label>
                    <input
                      type="text"
                      value={editFormData.favouriteTravelDestination || ''}
                      onChange={(e) => handleInputChange('favouriteTravelDestination', e.target.value)}
                      placeholder="e.g., Paris, Bali, Tokyo"
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                    />
                  </div>

                  {/* Thoughts on Kids */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Thoughts on Kids</label>
                    <select
                      value={editFormData.kidsPreference || ''}
                      onChange={(e) => handleInputChange('kidsPreference', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Want kids" className="bg-gray-800 text-white">Want kids</option>
                      <option value="Don't want kids" className="bg-gray-800 text-white">Don't want kids</option>
                      <option value="Have kids" className="bg-gray-800 text-white">Have kids</option>
                      <option value="Open to kids" className="bg-gray-800 text-white">Open to kids</option>
                      <option value="Not sure yet" className="bg-gray-800 text-white">Not sure yet</option>
                    </select>
                  </div>

                  {/* Religious Level */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Religious Level</label>
                    <select
                      value={editFormData.religiousLevel || ''}
                      onChange={(e) => handleInputChange('religiousLevel', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select level</option>
                      <option value="Very Religious" className="bg-gray-800 text-white">Very Religious</option>
                      <option value="Religious" className="bg-gray-800 text-white">Religious</option>
                      <option value="Spiritual" className="bg-gray-800 text-white">Spiritual</option>
                      <option value="Not Religious" className="bg-gray-800 text-white">Not Religious</option>
                      <option value="Atheist" className="bg-gray-800 text-white">Atheist</option>
                      <option value="Agnostic" className="bg-gray-800 text-white">Agnostic</option>
                    </select>
                  </div>

                  {/* Religion */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Religion</label>
                    <select
                      value={editFormData.religion || ''}
                      onChange={(e) => handleInputChange('religion', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select religion</option>
                      <option value="Hindu" className="bg-gray-800 text-white">Hindu</option>
                      <option value="Muslim" className="bg-gray-800 text-white">Muslim</option>
                      <option value="Christian" className="bg-gray-800 text-white">Christian</option>
                      <option value="Sikh" className="bg-gray-800 text-white">Sikh</option>
                      <option value="Buddhist" className="bg-gray-800 text-white">Buddhist</option>
                      <option value="Jain" className="bg-gray-800 text-white">Jain</option>
                      <option value="Jewish" className="bg-gray-800 text-white">Jewish</option>
                      <option value="Other" className="bg-gray-800 text-white">Other</option>
                      <option value="Prefer not to say" className="bg-gray-800 text-white">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Living Situation */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Living Situation</label>
                    <select
                      value={editFormData.livingSituation || ''}
                      onChange={(e) => handleInputChange('livingSituation', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select situation</option>
                      <option value="Live alone" className="bg-gray-800 text-white">Live alone</option>
                      <option value="Live with roommates" className="bg-gray-800 text-white">Live with roommates</option>
                      <option value="Live with parents" className="bg-gray-800 text-white">Live with parents</option>
                      <option value="Live with family" className="bg-gray-800 text-white">Live with family</option>
                      <option value="Own place" className="bg-gray-800 text-white">Own place</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              (userInfo?.favouriteTravelDestination || userInfo?.kidsPreference || userInfo?.religiousLevel || userInfo?.intent?.profileQuestions?.livingSituation) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Deep Dive</h3>
                    <button
                      onClick={() => handleEditClick('deepDive')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    <div className="space-y-3">
                      {userInfo?.favouriteTravelDestination && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileFavDestination.svg" alt="Destination" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Favorite Destination</div>
                            <div className="text-white font-medium text-sm">{userInfo.favouriteTravelDestination}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.kidsPreference && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileKids.svg" alt="Kids" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Thoughts on Kids</div>
                            <div className="text-white font-medium text-sm">{userInfo.kidsPreference}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.religiousLevel && userInfo?.intent?.profileQuestions?.religion && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileReligiousView.svg" alt="Religious View" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Religious View</div>
                            <div className="text-white font-medium text-sm">{userInfo.religiousLevel} {userInfo.intent.profileQuestions.religion}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.intent?.profileQuestions?.livingSituation && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileLivingSituation.svg" alt="Living Situation" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Living Situation</div>
                            <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.livingSituation}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Languages */}
            {editingSection === 'languages' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-3">Languages</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {editFormData.languages?.map((language, idx) => (
                    <div key={idx} className="relative px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 pr-8">
                      <span className="text-white text-xs font-medium">{language}</span>
                      <button
                        onClick={() => handleRemoveLanguage(idx)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 w-4 h-4 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                      >
                        <svg className="w-2.5 h-2.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Language */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={editFormData.newLanguage || ''}
                    onChange={(e) => handleInputChange('newLanguage', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                    placeholder="Add a language"
                    className="flex-1 px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50"
                  />
                  <button
                    onClick={handleAddLanguage}
                    className="px-4 py-2.5 bg-white/30 backdrop-blur-md rounded-xl border border-white/30 text-white hover:bg-white/40 transition"
                  >
                    Add
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition"
                >
                  Save changes
                </button>
              </div>
            ) : (
              userInfo?.intent?.profileQuestions?.languages && userInfo.intent.profileQuestions.languages.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Languages</h3>
                    <button
                      onClick={() => handleEditClick('languages')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {userInfo.intent.profileQuestions.languages.map((language, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                        <span className="text-white text-xs font-medium">{language}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 