import { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import { useNavigate } from 'react-router-dom';
import { userAPI, uploadAPI } from '../../utils/api';

const INTEREST_SUGGESTIONS = [
  'Travel', 'Food', 'Fitness', 'Music', 'Art', 'Tech', 'Books', 'Fashion', 'Outdoors', 'Sports', 'Gaming', 'Photography', 'Writing', 'Dancing', 'Cooking', 'Movies', 'TV Shows', 'Volunteering', 'Entrepreneurship', 'Wellness'
];

export default function UserIntent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  // Step states
  const [purpose, setPurpose] = useState('');
  const [relationshipVibe, setRelationshipVibe] = useState('');
  const [interestedGender, setInterestedGender] = useState('');
  const [ageRange, setAgeRange] = useState([40, 60]); // [min, max]
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState('');
  const [tvShow, setTvShow] = useState('');
  const [movie, setMovie] = useState('');
  const [watchList, setWatchList] = useState('');
  const [lifestyleImageUrls, setLifestyleImageUrls] = useState([null, null, null, null, null]);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');

  // Age range slider states
  const minAge = 35;
  const maxAge = 85;
  const [activeThumb, setActiveThumb] = useState(null); // 0 = min, 1 = max
  const sliderRef = useRef(null); // Ref for the slider container

  const totalSteps = 9;

  // Load existing user intent data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const userData = await userAPI.getProfile();
        if (userData.intent) {
          // Load existing intent data
          setPurpose(userData.intent.purpose || '');
          setRelationshipVibe(userData.intent.relationshipVibe || '');
          setInterestedGender(userData.intent.interestedGender || '');
          setAgeRange(userData.intent.preferredAgeRange || [40, 60]);
          setBio(userData.intent.bio || '');
          setInterests(userData.intent.interests || []);
          setTvShow(userData.intent.tvShow || '');
          setMovie(userData.intent.movie || '');
          setWatchList(userData.intent.watchList || '');
          setLifestyleImageUrls(userData.intent.lifestyleImageUrls || [null, null, null, null, null]);
        }
      } catch (error) {
        console.error('Error loading existing data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadExistingData();
  }, []);

  // Tag input logic
  const addInterest = useCallback((val) => {
    if (!val.trim() || interests.includes(val.trim())) return;
    setInterests((prevInterests) => [...prevInterests, val.trim()]);
    setInterestInput('');
  }, [interests]);

  const removeInterest = useCallback((val) => {
    setInterests((prevInterests) => prevInterests.filter(i => i !== val));
  }, []);

  // Lifestyle image upload logic
  const handleLifestyleImageChange = async (idx, file) => {
    if (!file) return;
    setImgError('');
    setImgUploading(true);
    try {
      const result = await uploadAPI.uploadLifestyleImage(file);
      setLifestyleImageUrls(prevUrls => {
        const newUrls = [...prevUrls];
        newUrls[idx] = result.url;
        return newUrls;
      });
    } catch (err) {
      console.error("Image upload error:", err);
      setImgError('Failed to upload image. Please try again. ' + err.message);
    } finally {
      setImgUploading(false);
    }
  };

  // Validation for each step
  const isStepValid = useCallback(() => {
    switch (step) {
      case 1: return !!purpose;
      case 2: return !!relationshipVibe;
      case 3: return !!interestedGender;
      case 4: return ageRange[0] < ageRange[1];
      case 5: return bio.trim().length > 0;
      case 6: return interests.length > 0;
      case 7: return tvShow.trim().length > 0 && movie.trim().length > 0;
      case 8: return watchList.trim().length > 0;
      case 9: return lifestyleImageUrls.filter(Boolean).length === 5;
      default: return false;
    }
  }, [step, purpose, relationshipVibe, interestedGender, ageRange, bio, interests, tvShow, movie, watchList, lifestyleImageUrls]);

  // Save all data to backend
  const handleFinish = async () => {
    setLoading(true);
    try {
      // First, get the current user profile to preserve existing data
      const currentProfile = await userAPI.getProfile();

      // Update with both existing user info and new intent data
      await userAPI.updateProfile({
        // Preserve existing user info
        firstName: currentProfile.firstName,
        lastName: currentProfile.lastName,
        gender: currentProfile.gender,
        dob: currentProfile.dob,
        currentLocation: currentProfile.currentLocation,
        favouriteTravelDestination: currentProfile.favouriteTravelDestination,
        lastHolidayPlaces: currentProfile.lastHolidayPlaces,
        favouritePlacesToGo: currentProfile.favouritePlacesToGo,
        profilePicUrl: currentProfile.profilePicUrl,

        // Add new intent data
        intent: {
          purpose,
          relationshipVibe,
          interestedGender,
          preferredAgeRange: ageRange,
          bio,
          interests,
          tvShow,
          movie,
          watchList,
          lifestyleImageUrls,
        },
        onboardingComplete: true,
      });
      navigate('/home');
    } catch (err) {
      alert('Failed to save user intent: ' + err.message);
      console.error("Backend save error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep(prevStep => prevStep - 1);
    }
  };

  // Helper for radio option styling with description
  const RadioOption = ({ label, checked, onClick, description }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-5 py-4 mb-5 rounded-2xl border transition-all shadow-md bg-white text-left
        ${checked ? 'border-[#222222] shadow-lg' : 'border-gray-100'}
        hover:border-[#222222]`}
      style={{ minHeight: '72px' }}
    >
      <div className="flex-1">
        <div className="font-semibold text-base text-gray-900 mb-1">{label}</div>
        {description && <div className="text-xs text-gray-400 leading-snug font-normal">{description}</div>}
      </div>
      <span className={`ml-4 w-6 h-6 flex items-center justify-center rounded-full border-2 ${checked ? 'border-[#222222]' : 'border-gray-300'}`}
        style={{ minWidth: '24px' }}>
        {checked && <span className="block w-3 h-3 bg-[#222222] rounded-full"></span>}
      </span>
    </button>
  );

  // Consolidated function to render the main content of each step
  const renderStepContent = useCallback(() => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col gap-0 w-full">
            <RadioOption
              label="Date"
              checked={purpose === 'Date'}
              onClick={() => setPurpose('Date')}
              description={"You haven't made up your mind about marriage, but want an exclusive relationship with emotional bonding"}
            />
            <RadioOption
              label="Network"
              checked={purpose === 'Network'}
              onClick={() => setPurpose('Network')}
              description={"You're looking to expand your professional or social circle, not necessarily for romantic connections."}
            />
            <RadioOption
              label="Both Date and Network"
              checked={purpose === 'Both Date and Network'}
              onClick={() => setPurpose('Both Date and Network')}
              description={"You're open to both romantic relationships and building your professional/social network."}
            />
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-0 w-full">
            <RadioOption label="Single" checked={relationshipVibe === 'Single'} onClick={() => setRelationshipVibe('Single')} />
            <RadioOption label="Divorced" checked={relationshipVibe === 'Divorced'} onClick={() => setRelationshipVibe('Divorced')} />
            <RadioOption label="It's complicated..." checked={relationshipVibe === "It's complicated..."} onClick={() => setRelationshipVibe("It's complicated...")} />
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-0 w-full">
            <RadioOption label="Women" checked={interestedGender === 'Women'} onClick={() => setInterestedGender('Women')} />
            <RadioOption label="Men" checked={interestedGender === 'Men'} onClick={() => setInterestedGender('Men')} />
            <RadioOption label="Anyone" checked={interestedGender === 'Anyone'} onClick={() => setInterestedGender('Anyone')} />
          </div>
        );
      case 4:
        // Calculate thumb positions as percentages
        const minThumbPos = ((ageRange[0] - minAge) / (maxAge - minAge)) * 100;
        const maxThumbPos = ((ageRange[1] - minAge) / (maxAge - minAge)) * 100;

        return (
          <div className="flex flex-col items-center mb-8 mt-8">
            <div ref={sliderRef} className="custom-age-slider relative w-full max-w-xs flex flex-col items-center min-h-40">
              {/* Value labels directly above thumbs */}
              <div className="absolute left-0 right-0 flex justify-between" style={{ top: '-36px' }}>
                {/* Min Age Label */}
                <div
                  className="absolute transform -translate-x-1/2" // Center the label above the thumb
                  style={{ left: `${minThumbPos}%` }}
                >
                  <div className="bg-black text-white text-sm rounded-full px-4 py-1 relative z-10">
                    {ageRange[0]}
                    <span className="absolute left-1/2 -bottom-2 w-2 h-2 bg-black rotate-45" style={{ transform: 'translateX(-50%)' }}></span>
                  </div>
                </div>
                {/* Max Age Label */}
                <div
                  className="absolute transform -translate-x-1/2" // Center the label above the thumb
                  style={{ left: `${maxThumbPos}%` }}
                >
                  <div className="bg-black text-white text-sm rounded-full px-4 py-1 relative z-10">
                    {ageRange[1]}
                    <span className="absolute left-1/2 -bottom-2 w-2 h-2 bg-black rotate-45" style={{ transform: 'translateX(-50%)' }}></span>
                  </div>
                </div>
              </div>
              {/* Slider track */}
              <div className="relative w-full h-3 flex items-center">
                {/* Track background */}
                <div className="absolute left-0 right-0 h-1.5 rounded-full bg-gray-200"></div>
                {/* Selected range */}
                <div
                  className="absolute h-1.5 rounded-full bg-black"
                  style={{
                    left: `${minThumbPos}%`,
                    width: `${maxThumbPos - minThumbPos}%`,
                  }}
                ></div>
                {/* Min thumb */}
                <button
                  type="button"
                  className={`absolute z-10 w-6 h-6 rounded-full bg-white border-4 ${activeThumb === 0 ? 'border-black' : 'border-gray-300'} flex items-center justify-center focus:outline-none`}
                  style={{ left: `calc(${minThumbPos}% - 12px)` }} // Adjust for thumb width
                  tabIndex={0}
                  onMouseDown={() => setActiveThumb(0)}
                  onTouchStart={() => setActiveThumb(0)} // For touch devices
                  aria-label="Minimum age"
                >
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                </button>
                {/* Max thumb */}
                <button
                  type="button"
                  className={`absolute z-10 w-6 h-6 rounded-full bg-white border-4 ${activeThumb === 1 ? 'border-black' : 'border-gray-300'} flex items-center justify-center focus:outline-none`}
                  style={{ left: `calc(${maxThumbPos}% - 12px)` }} // Adjust for thumb width
                  tabIndex={0}
                  onMouseDown={() => setActiveThumb(1)}
                  onTouchStart={() => setActiveThumb(1)} // For touch devices
                  aria-label="Maximum age"
                >
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                </button>
              </div>
              {/* Min/Max value display for general reference (optional) */}
              <div className="flex justify-between w-full mt-4 text-gray-500 font-semibold text-lg">
                <span>{minAge}</span>
                <span>{maxAge}</span>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 mb-4 min-h-[100px] text-base"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Write a short bio..."
              maxLength={300}
            />
            <div className="text-xs text-gray-400 mb-2">{bio.length}/300</div>
          </>
        );
      case 6:
        return (
          <>
            <div className="flex flex-wrap gap-2 mb-2">
              {interests.map((tag, idx) => (
                <span key={idx} className="bg-[#222222] text-white px-3 py-1 rounded-full flex items-center text-xs">
                  {tag}
                  <button onClick={() => removeInterest(tag)} className="ml-2 text-white opacity-70 hover:opacity-100">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-3 mb-2"
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addInterest(interestInput);
              }}
              placeholder="Add an interest..."
              maxLength={30}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {INTEREST_SUGGESTIONS.filter(s => !interests.includes(s) && s.toLowerCase().includes(interestInput.toLowerCase())).slice(0, 6).map(s => (
                <button key={s} className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700" onClick={() => addInterest(s)}>{s}</button>
              ))}
            </div>
          </>
        );
      case 7:
        return (
          <>
            <div className="mb-6">
              <label className="block text-base font-medium mb-2">What’s that one TV show you could rewatch anytime?</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg p-3 mb-4 text-base"
                value={tvShow}
                onChange={e => setTvShow(e.target.value)}
                placeholder="Enter your favourite TV show"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-base font-medium mb-2">Which movie never gets old for you?</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg p-3 mb-4 text-base"
                value={movie}
                onChange={e => setMovie(e.target.value)}
                placeholder="Enter your favourite movie"
                maxLength={100}
              />
            </div>
          </>
        );
      case 8:
        return (
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg p-3 mb-4 text-base"
            value={watchList}
            onChange={e => setWatchList(e.target.value)}
            placeholder="e.g. The Bear, Succession, Oppenheimer"
            maxLength={100}
          />
        );
      case 9:
        return (
          <>
            <div className="flex flex-wrap gap-4 justify-center mb-4">
              {[0, 1, 2, 3, 4].map(idx => (
                <label key={idx} className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer relative">
                  {lifestyleImageUrls[idx] ? (
                    <img src={lifestyleImageUrls[idx]} alt={`Lifestyle ${idx + 1}`} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-3xl text-gray-400">+</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={imgUploading}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) handleLifestyleImageChange(idx, e.target.files[0]);
                    }}
                  />
                  {imgUploading && <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center"><span className="text-xs text-gray-500">Uploading...</span></div>}
                </label>
              ))}
            </div>
            {imgError && (
              <div className="text-red-500 text-xs mb-2 flex items-center justify-between">
                <span>{imgError}</span>
                <button onClick={() => setImgError('')} className="text-gray-500 hover:text-gray-700 ml-2">Clear</button>
              </div>
            )}
            <div className="text-xs text-gray-400 mb-2">Upload 5 images to continue.</div>
          </>
        );
      default:
        return null;
    }
  }, [step, purpose, relationshipVibe, interestedGender, ageRange, bio, interests, interestInput, tvShow, movie, watchList, lifestyleImageUrls, imgUploading, imgError, addInterest, removeInterest, handleLifestyleImageChange, activeThumb, minAge, maxAge]);

  // Function to render the sticky header/question for each step
  const renderStepHeader = useCallback(() => {
    switch (step) {
      case 1:
        return (
          <>
            <h1 className="text-2xl font-semibold mb-3 mt-0">What's your purpose for joining?</h1>
            <p className="text-gray-500 mb-4 text-sm font-normal leading-snug">I match you with members who share your relationship goals; your choice shapes your journey in the Club!</p>
          </>
        );
      case 2:
        return (
          <>
            <h1 className="text-2xl font-semibold mb-3 mt-0">What's your current relationship vibe?</h1>
            <p className="text-gray-500 mb-4 text-sm font-normal leading-snug">I help connect you with people who are looking for similar relationship statuses.</p>
          </>
        );
      case 3:
        return <h1 className="text-2xl font-semibold mb-3 mt-0">Who are you interested in meeting?</h1>;
      case 4:
        return <h1 className="text-2xl font-semibold mb-3 mt-0">Preferred age range?</h1>;
      case 5:
        return <h1 className="text-2xl font-semibold mb-3 mt-0">Tell us about yourself (Bio)</h1>;
      case 6:
        return (
          <>
            <h1 className="text-2xl font-semibold mb-3 mt-0">What are you excited about?</h1>
            <p className="text-gray-500 mb-4 text-sm font-normal leading-snug">Type and press enter to add, or select from suggestions.</p>
          </>
        );
      case 7:
        return <h1 className="text-2xl font-semibold mb-3 mt-0">What’s that one TV show and one movie?</h1>;
      case 8:
        return <h1 className="text-2xl font-semibold mb-3 mt-0">Current watch list?</h1>;
      case 9:
        return <h1 className="text-2xl font-semibold mb-3 mt-0">Add 5 lifestyle images</h1>;
      default:
        return null;
    }
  }, [step]);

  // Age slider drag logic
  useEffect(() => {
    const onMove = (e) => {
      if (activeThumb === null || !sliderRef.current) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = sliderRef.current.getBoundingClientRect(); // Use ref here

      let percent = (clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent)); // Clamp between 0 and 1

      let value = Math.round(minAge + percent * (maxAge - minAge));
      let newRange = [...ageRange];

      if (activeThumb === 0) {
        value = Math.min(value, newRange[1] - 1); // Min must be at least 1 less than max
        value = Math.max(minAge, value); // Ensure min thumb doesn't go below minAge constant
        newRange[0] = value;
      } else if (activeThumb === 1) {
        value = Math.max(value, newRange[0] + 1); // Max must be at least 1 more than min
        value = Math.min(maxAge, value); // Ensure max thumb doesn't go above maxAge constant
        newRange[1] = value;
      }
      setAgeRange(newRange);
    };

    const onUp = () => {
      setActiveThumb(null);
    };

    // Add event listeners globally for dragging
    if (activeThumb !== null) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove); // For mobile touch events
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchend', onUp); // For mobile touch events
      document.body.style.userSelect = 'none'; // Prevent text selection during drag
      document.body.style.cursor = 'grabbing'; // Indicate dragging
    }

    return () => {
      // Clean up event listeners
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
      document.body.style.userSelect = ''; // Re-enable text selection
      document.body.style.cursor = ''; // Reset cursor
    };
  }, [activeThumb, ageRange, minAge, maxAge]);

  if (initialLoading) {
    return (
      <div className="h-screen bg-white flex justify-center items-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white px-6 pt-10 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="w-6 h-6 flex items-center justify-center"
          aria-label="Go back"
        >
          <img src="/backarrow.svg" alt="Back" width={24} height={24} />
        </button>
        <div className="text-gray-400 text-[14px] font-semibold mx-auto">
          Sundate.
        </div>
        <div style={{ width: '24px' }}></div> {/* Spacer */}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto mb-6">
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-[#222222] h-1 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>
      </div>

      {/* Sticky question/info, scrollable options, sticky bottom button */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Sticky question/info */}
        <div className="sticky top-0 z-10 bg-white pb-2">
          {renderStepHeader()}
        </div>
        {/* Scrollable options/content */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          {renderStepContent()}
        </div>
      </div>

      {/* Sticky bottom button */}
      <div className="sticky bottom-0 left-0 right-0 bg-white z-20 flex w-full max-w-md mx-auto gap-2 mb-6 pt-4 border-t border-gray-100">
        {step > 1 && (
          <button
            onClick={() => setStep(prevStep => prevStep - 1)}
            className="flex-1 py-4 rounded-xl bg-gray-200 text-gray-700 font-medium text-sm"
            disabled={loading || imgUploading}
          >
            Back
          </button>
        )}
        <button
          onClick={step === totalSteps ? handleFinish : () => setStep(prevStep => prevStep + 1)}
          className={`flex-1 py-4 rounded-2xl text-white font-semibold text-base ${isStepValid() ? 'bg-[#222222]' : 'bg-gray-300 cursor-not-allowed'}`}
          disabled={!isStepValid() || loading || imgUploading}
        >
          {loading || imgUploading ? 'Saving...' : (step === totalSteps ? 'Finish' : 'Next')}
        </button>
      </div>
    </div>
  );
}