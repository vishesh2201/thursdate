// src/components/onboarding/UserIntent.jsx
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, uploadAPI } from '../../utils/api';

export default function UserIntent() {
  const navigate = useNavigate();

  // Step control
  const totalSteps = 13;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Intent state (all steps)
  const [purpose, setPurpose] = useState(''); // Step 1
  const [relationshipVibe, setRelationshipVibe] = useState(''); // Step 2
  const [interestedGender, setInterestedGender] = useState(''); // Step 3
  const [ageRange, setAgeRange] = useState([40, 60]); // Step 4
  const [bio, setBio] = useState(''); // Step 5
  const [bioMode, setBioMode] = useState('Read'); // 'Read' or 'Listen'
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const [interests, setInterests] = useState([]); // Step 6
  const [interestInput, setInterestInput] = useState('');

  // Step 7: Multiple TV shows & movies
  const [tvShows, setTvShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [tvInput, setTvInput] = useState('');
  const [movieInput, setMovieInput] = useState('');

  const [watchList, setWatchList] = useState([]); // Step 8
  const [watchInput, setWatchInput] = useState('');
  const [artistsBands, setArtistsBands] = useState([]); // Step 9
  const [artistBandInput, setArtistBandInput] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(null); // Step 11
  const [profileImgUploading, setProfileImgUploading] = useState(false);
  const [profileImgError, setProfileImgError] = useState('');
  const [lifestyleImageUrls, setLifestyleImageUrls] = useState([null, null, null, null, null]); // Step 12
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');

  // Age limits
  const minAge = 35;
  const maxAge = 85;

  // Load existing profile
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const userData = await userAPI.getProfile();
        if (!mounted) return;
        if (userData) {
          // Load from root level (new hybrid storage)
          setInterests(userData.interests || []);
          setProfileImageUrl(userData.profilePicUrl || null);

          // Load from intent object
          if (userData.intent) {
            setPurpose(userData.intent.purpose || '');
            setRelationshipVibe(userData.intent.relationshipVibe || '');
            setInterestedGender(userData.intent.interestedGender || '');
            setAgeRange(userData.intent.preferredAgeRange || [40, 60]);
            setBio(userData.intent.bio || '');
            setTvShows(userData.intent.tvShows || []);
            setMovies(userData.intent.movies || []);
            setWatchList(userData.intent.watchList || []);
            setArtistsBands(userData.intent.artistsBands || []);
            setLifestyleImageUrls(userData.intent.lifestyleImageUrls || [null, null, null, null, null]);
          }
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        const res = e.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (finalTranscript) {
        setBio(prev => (prev + ' ' + finalTranscript).slice(0, 300));
      }
      setInterimTranscript(interim);
    };

    rec.onerror = (err) => {
      console.error('Speech recognition error', err);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (err) {
      console.warn('startListening failed', err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.warn('stopListening failed', err);
    }
    setListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (!sttSupported) return;
    if (listening) stopListening(); else startListening();
  };

  useEffect(() => {
    if (bioMode !== 'Listen' && listening) {
      stopListening();
    }
  }, [bioMode]);

  // Interest tag logic
  const addInterest = useCallback((val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return;
    setInterests(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setInterestInput('');
  }, []);

  const removeInterest = useCallback((t) => {
    setInterests(prev => prev.filter(x => x !== t));
  }, []);

  // TV & Movie helpers
  const addTvShow = () => {
    const trimmed = tvInput.trim();
    if (trimmed && !tvShows.includes(trimmed)) {
      setTvShows(prev => [...prev, trimmed]);
    }
    setTvInput('');
  };

  const removeTvShow = (item) => {
    setTvShows(prev => prev.filter(x => x !== item));
  };

  const addMovie = () => {
    const trimmed = movieInput.trim();
    if (trimmed && !movies.includes(trimmed)) {
      setMovies(prev => [...prev, trimmed]);
    }
    setMovieInput('');
  };

  const removeMovie = (item) => {
    setMovies(prev => prev.filter(x => x !== item));
  };

  // Watchlist helpers
  const addWatchItem = () => {
    const items = watchInput.split(',').map(item => item.trim()).filter(item => item !== '');
    setWatchList(prev => {
      const newItems = items.filter(item => !prev.includes(item));
      return [...prev, ...newItems];
    });
    setWatchInput('');
  };

  const removeWatchItem = (item) => {
    setWatchList(prev => prev.filter(x => x !== item));
  };

  // Artists/Bands helpers
  const addArtistBand = () => {
    const items = artistBandInput.split(',').map(item => item.trim()).filter(item => item !== '');
    setArtistsBands(prev => {
      const newItems = items.filter(item => !prev.includes(item));
      return [...prev, ...newItems];
    });
    setArtistBandInput('');
  };

  const removeArtistBand = (item) => {
    setArtistsBands(prev => prev.filter(x => x !== item));
  };

  // Profile image upload
  const handleProfileImageChange = async (file) => {
    if (!file) return;
    // Set a preview URL directly from the file object
    setProfileImageUrl(URL.createObjectURL(file));

    // Upload to backend/Cloudinary
    setProfileImgError('');
    setProfileImgUploading(true);
    try {
      const res = await uploadAPI.uploadProfilePicture(file);
      setProfileImageUrl(res.url);
    } catch (err) {
      console.error('Upload error', err);
      setProfileImgError(err.message || 'Failed to upload image. Try again.');
    } finally {
      setProfileImgUploading(false);
    }
  };

  // Lifestyle image upload
  const handleLifestyleImageChange = async (idx, file) => {
    if (!file) return;
    // Set a preview URL directly from the file object
    setLifestyleImageUrls(prev => {
      const next = [...prev];
      next[idx] = URL.createObjectURL(file);
      return next;
    });

    // Upload to backend/Cloudinary
    setImgError('');
    setImgUploading(true);
    try {
      const res = await uploadAPI.uploadLifestyleImage(file);
      setLifestyleImageUrls(prev => {
        const next = [...prev];
        next[idx] = res.url;
        return next;
      });
    } catch (err) {
      console.error('Upload error', err);
      setImgError(err.message || 'Upload failed');
    } finally {
      setImgUploading(false);
    }
  };

  // Validation
  const isStepValid = useCallback(() => {
    switch (step) {
      case 1: return !!purpose;
      case 2: return !!relationshipVibe;
      case 3: return !!interestedGender;
      case 4: return ageRange[0] < ageRange[1];
      case 5: return bio.trim().length > 0;
      case 6: return interests.length > 0;
      case 7: return tvShows.length > 0 && movies.length > 0;
      case 8: return watchList.length > 0;
      case 9: return artistsBands.length > 0;
      case 10: return true;
      case 11: return !!profileImageUrl;
      case 12: return true;
      case 13: return lifestyleImageUrls.filter(Boolean).length === 5;
      default: return false;
    }
  }, [step, purpose, relationshipVibe, interestedGender, ageRange, bio, interests, tvShows, movies, watchList, artistsBands, profileImageUrl, lifestyleImageUrls]);

  // Save
  const handleFinish = async () => {
    setLoading(true);
    try {
      const currentProfile = await userAPI.getProfile();
      await userAPI.updateProfile({
        ...currentProfile,
        // ✅ NEW: Send interests at root level for hybrid storage
        interests,
        // ✅ FIX: Map relationshipVibe to relationshipStatus for root-level DB column
        relationshipStatus: relationshipVibe,
        intent: {
          ...currentProfile.intent,
          purpose,
          relationshipVibe,
          interestedGender,
          preferredAgeRange: ageRange,
          bio,
          tvShows,
          movies,
          watchList,
          artistsBands,
          lifestyleImageUrls,
        },
        profileImageUrl,
        onboardingComplete: true, // ✅ Onboarding complete - navigate to Home
      });
      navigate('/');
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) return navigate(-1);
    setStep(s => Math.max(1, s - 1));
  };

  // Radio Option
  const RadioOption = ({ label, description, checked, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 mb-4 rounded-2xl transition-all text-left`}
      style={{
        background: checked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        border: checked ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.10)',
        boxShadow: checked ? 'inset 0 6px 16px rgba(0,0,0,0.45)' : '0 6px 18px rgba(0,0,0,0.35)'
      }}
    >
      <div className="flex-1 pr-4">
        <div className="text-white font-semibold text-base leading-tight">{label}</div>
        {description && <div className="text-white/75 text-sm mt-1 leading-snug">{description}</div>}
      </div>
      <div style={{ minWidth: 36 }} className="flex items-center justify-end">
        <span
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: checked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.28)' }}
        >
          {checked ? <span className="block w-3 h-3 rounded-full" style={{ background: 'white' }} /> : null}
        </span>
      </div>
    </button>
  );

  const renderStepHeader = useCallback(() => {
    switch (step) {
      case 1:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">What are you looking for?</h1>
            <p className="text-white/70 text-sm leading-snug">We match you with people who share your relationship goals.</p>
          </>
        );
      case 2:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">What's your current relationship vibe?</h1>
            <p className="text-white/70 text-sm leading-snug">We match you with people who share your relationship goals.</p>
          </>
        );
      case 3:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Who are you interested in meeting?</h1>;
      case 4:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Preferred age range?</h1>;
      case 5:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">Add your bio</h1>
            <p className="text-white/70 text-sm leading-snug">Share a little about yourself — your hobbies, passions, personality, and what makes you happy. Take your time!</p>
          </>
        );
      case 6:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">What are you excited about?</h1>
            <p className="text-white/70 text-sm leading-snug">Type and press enter to add, or select from suggestions.</p>
          </>
        );
      case 7:
        return <h1 className="text-white text-[22px] font-semibold mb-2">TV shows & movies you love?</h1>;
      case 8:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Current watch list?</h1>;
      case 9:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Your top favourite artists/bands?</h1>;
      case 10:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">Upload a profile picture</h1>
            <p className="text-white/70 text-sm leading-snug">Please upload a photo that keeps your identity private, showcasing your physique or a side profile instead.</p>
          </>
        );
      case 11:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">Upload a profile picture</h1>
            <p className="text-white/70 text-sm leading-snug">Please upload a photo that keeps your identity private, showcasing your physique or a side profile instead.</p>
          </>
        );
      case 12:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">Upload Lifestyle pictures</h1>
            <p className="text-white/70 text-sm leading-snug">Upload lifestyle shots showing your vibe or interest. There is no need to show your face&#128522;.</p>
          </>
        );
      case 13:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Add 5 lifestyle images</h1>;
      default:
        return null;
    }
  }, [step]);

  const renderStepContent = useCallback(() => {
    switch (step) {
      case 1:
        return (
          <div>
            <RadioOption label="Date" description="Open to exploring and seeing where things go." checked={purpose === 'Date'} onClick={() => setPurpose('Date')} />
            <RadioOption label="Seriously Date" description="Seeking a meaningful, long-term relationship." checked={purpose === 'Seriously Date'} onClick={() => setPurpose('Seriously Date')} />
            <RadioOption label="Companionship" description="Wanting someone to share life and experiences with." checked={purpose === 'Companionship'} onClick={() => setPurpose('Companionship')} />
            <RadioOption label="Marriage" description="Looking for a life partner to build a future with." checked={purpose === 'Marriage'} onClick={() => setPurpose('Marriage')} />
            <RadioOption label="Friends" description="Here to connect and build genuine friendships." checked={purpose === 'Friends'} onClick={() => setPurpose('Friends')} />
          </div>
        );
      case 2:
        return (
          <>
            <RadioOption label="Single" checked={relationshipVibe === 'Single'} onClick={() => setRelationshipVibe('Single')} />
            <RadioOption label="Divorced" checked={relationshipVibe === 'Divorced'} onClick={() => setRelationshipVibe('Divorced')} />
            <RadioOption label="Separated" checked={relationshipVibe === 'Separated'} onClick={() => setRelationshipVibe('Separated')} />
            <RadioOption label="It's complicated..." checked={relationshipVibe === "It's complicated..."} onClick={() => setRelationshipVibe("It's complicated...")} />
          </>
        );
      case 3:
        return (
          <>
            <RadioOption label="Women" checked={interestedGender === 'Women'} onClick={() => setInterestedGender('Women')} />
            <RadioOption label="Men" checked={interestedGender === 'Men'} onClick={() => setInterestedGender('Men')} />
            <RadioOption label="Anyone" checked={interestedGender === 'Anyone'} onClick={() => setInterestedGender('Anyone')} />
          </>
        );
      case 4:
        return (
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex gap-3">
              <input
                type="number"
                min={minAge}
                max={maxAge}
                value={ageRange[0]}
                onChange={e => {
                  const raw = parseInt(e.target.value, 10);
                  const clamped = Number.isNaN(raw) ? minAge : Math.max(minAge, Math.min(raw, ageRange[1] - 1));
                  setAgeRange([clamped, ageRange[1]]);
                }}
                className="w-1/2 rounded-xl p-3 text-base"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)' }}
                aria-label="Minimum age"
              />
              <input
                type="number"
                min={minAge}
                max={maxAge}
                value={ageRange[1]}
                onChange={e => {
                  const raw = parseInt(e.target.value, 10);
                  const clamped = Number.isNaN(raw) ? maxAge : Math.min(maxAge, Math.max(raw, ageRange[0] + 1));
                  setAgeRange([ageRange[0], clamped]);
                }}
                className="w-1/2 rounded-xl p-3 text-base"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)' }}
                aria-label="Maximum age"
              />
            </div>
            <div className="text-white/70 text-sm">Enter preferred age range between {minAge} and {maxAge}.</div>
          </div>
        );
      case 5:
        return (
          <>
            <div className="mb-4 flex items-center gap-3">
              <button type="button" onClick={() => setBioMode('Read')} className={`px-4 py-2 rounded-full text-sm font-medium ${bioMode === 'Read' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>Read</button>
              <button type="button" onClick={() => setBioMode('Listen')} className={`px-4 py-2 rounded-full text-sm font-medium ${bioMode === 'Listen' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>Listen</button>
            </div>

            {bioMode === 'Read' ? (
              <div className="w-full rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <textarea
                  className="w-full rounded-lg p-4 text-base bg-transparent"
                  placeholder="Share a little about yourself..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={300}
                  style={{ color: 'white', border: 'none', minHeight: 120, resize: 'vertical' }}
                />
                <div className="text-white/60 text-xs mt-2">{bio.length}/300</div>
              </div>
            ) : (
              <div className="w-full rounded-2xl p-4 mb-4 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                {!sttSupported ? (
                  <div className="text-white/70 text-sm">Speech input isn't supported in this browser.</div>
                ) : (
                  <>
                    <div className="w-full mb-3 text-white/60 text-sm">Transcript (appended to bio):</div>
                    <div className="w-full min-h-[100px] p-3 rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.02)', color: 'white', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                      <div className="whitespace-pre-wrap">{bio}{interimTranscript ? <span className="text-white/60"> {interimTranscript}</span> : null}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={toggleListening} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: listening ? 'linear-gradient(180deg, rgba(255,255,255,1), rgba(230,230,230,1))' : 'rgba(255,255,255,0.08)' }} aria-pressed={listening}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill={listening ? '#000' : '#fff'} xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
                          <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 5 5 0 0 0 4 4.9V19a1 1 0 0 0 2 0v-3.1A5 5 0 0 0 19 11z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-white/60 text-xs mt-3">{listening ? 'Listening — speak now' : 'Tap the mic to start'}</div>
                  </>
                )}
              </div>
            )}

            <div className="text-white font-semibold mb-2">Some ideas to get started:</div>
            <ul className="text-white/70 text-sm list-disc ml-5 space-y-1">
              <li>I enjoy cooking, gardening, and weekend walks in nature.</li>
              <li>I love live music, small gatherings with friends, and traveling to new places.</li>
              <li>I'm thoughtful, curious, and appreciate meaningful conversations.</li>
              <li>Reading, photography, exploring history, and discovering new cuisines.</li>
            </ul>
          </>
        );
      case 6:
        return (
          <>
            <input
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addInterest(interestInput); }}
              placeholder="Add an interest..."
              className="w-full rounded-xl p-3 text-base"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            />
            <div className="flex flex-wrap gap-3 mt-3">
              {interests.map((t, i) => (
                <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'white', color: 'black' }}>
                  {t}
                  <button onClick={() => removeInterest(t)} className="ml-3 text-black/60" aria-label={`Remove ${t}`}>×</button>
                </span>
              ))}
            </div>
          </>
        );
      case 7:
        return (
          <div className="space-y-6">
            {/* TV Shows */}
            <div>
              <label className="block text-white/80 mb-2">TV show(s) you could rewatch anytime</label>
              <div className="flex gap-2 mb-3">
                <input
                  value={tvInput}
                  onChange={e => setTvInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTvShow()}
                  placeholder="e.g. The Office"
                  className="flex-1 rounded-xl p-3 text-base"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                />

              </div>
              <div className="flex flex-wrap gap-2">
                {tvShows.map((s, i) => (
                  <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'white', color: 'black' }}>
                    {s}
                    <button type="button" onClick={() => removeTvShow(s)} className="ml-1 text-black/60" aria-label={`Remove ${s}`}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Movies */}
            <div>
              <label className="block text-white/80 mb-2">Movie(s) that never get old</label>
              <div className="flex gap-2 mb-3">
                <input
                  value={movieInput}
                  onChange={e => setMovieInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMovie()}
                  placeholder="e.g. The Godfather"
                  className="flex-1 rounded-xl p-3 text-base"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                />

              </div>
              <div className="flex flex-wrap gap-2">
                {movies.map((m, i) => (
                  <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'white', color: 'black' }}>
                    {m}
                    <button type="button" onClick={() => removeMovie(m)} className="ml-1 text-black/60" aria-label={`Remove ${m}`}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <>
            <input
              value={watchInput}
              onChange={e => setWatchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWatchItem()}
              placeholder="e.g. The Bear, Succession, Oppenheimer"
              className="w-full rounded-xl p-3 text-base"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            />
            <div className="flex flex-wrap gap-3 mt-3">
              {watchList.map((w, i) => (
                <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'white', color: 'black' }}>
                  {w}
                  <button onClick={() => removeWatchItem(w)} className="ml-1 text-black/60" aria-label={`Remove ${w}`}>×</button>
                </span>
              ))}
            </div>
          </>
        );
      case 9:
        return (
          <>
            <input
              value={artistBandInput}
              onChange={e => setArtistBandInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addArtistBand(); }}
              placeholder="Add an artist/band..."
              className="w-full rounded-xl p-3 text-base"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            />
            <div className="flex flex-wrap gap-3 mt-3">
              {artistsBands.map((b, i) => (
                <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'white', color: 'black' }}>
                  {b}
                  <button onClick={() => removeArtistBand(b)} className="ml-1 text-black/60" aria-label={`Remove ${b}`}>×</button>
                </span>
              ))}
            </div>
          </>
        );
      case 10:
        return (
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-sm">
              <img src="/sample1.png" alt="Sample 1" className="w-full h-auto rounded-lg" />
              <img src="/sample2.png" alt="Sample 2" className="w-full h-auto rounded-lg" />
              <img src="/sample3.png" alt="Sample 3" className="w-full h-auto rounded-lg" />
              <img src="/sample4.png" alt="Sample 4" className="w-full h-auto rounded-lg" />
            </div>
            <div className="w-full max-w-sm text-left">
              <div className="text-white text-sm mb-2">Pro Tip: Feel free to take some inspiration from the references above</div>
              <div className="text-white text-sm">Note: You can change your profile picture later</div>
            </div>
          </div>
        );
      case 11:
        return (
          <div className="flex flex-col items-center">
            <label className="w-60 h-60 rounded-2xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/60 mb-2">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-white/60 text-sm">Tap to upload your photo</div>
                  <div className="text-white/40 text-xs">(JPG, PNG or JPEG (max 10MB))</div>
                </>
              )}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && e.target.files[0] && handleProfileImageChange(e.target.files[0])} disabled={profileImgUploading} />
              {profileImgUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/20 text-xs">Uploading...</div>}
            </label>
            {profileImgError && <div className="text-red-400 text-sm mb-2">{profileImgError}</div>}
          </div>
        );
      case 12:
        return (
          <div className="flex flex-col items-center">
            <div className="relative w-80 h-80 mb-6 flex">
              <img src="/sample5.png" alt="Sample 5" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ top: '5%', left: '5%', transform: 'rotate(-10deg)', zIndex: 3 }} />
              <img src="/sample6.png" alt="Sample 6" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ top: '5%', right: '5%', transform: 'rotate(5deg)', zIndex: 4 }} />
              <img src="/sample7.png" alt="Sample 7" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ bottom: '5%', left: '5%', transform: 'rotate(10deg)', zIndex: 2 }} />
              <img src="/sample8.png" alt="Sample 8" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ bottom: '5%', right: '5%', transform: 'rotate(-5deg)', zIndex: 1 }} />
              <img src="/sample9.png" alt="Sample 9" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ top: '30%', left: '30%', transform: 'rotate(12deg)', zIndex: 5 }} />
            </div>
            <div className="w-full max-w-sm text-left">
              <div className="text-white text-sm mb-2">Pro Tip: Feel free to take some inspiration from the references above</div>
              <div className="text-white text-sm">Note: You can change these pictures later</div>
            </div>
          </div>
        );
      case 13:
        return (
          <>
            <div className="flex flex-wrap gap-4 justify-center mb-3">
              {[0, 1, 2, 3, 4].map(idx => (
                <label key={idx} className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  {lifestyleImageUrls[idx] ? (
                    <img src={lifestyleImageUrls[idx]} alt={`Lifestyle ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/60 text-3xl">+</span>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && e.target.files[0] && handleLifestyleImageChange(idx, e.target.files[0])} disabled={imgUploading} />
                  {imgUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/20 text-xs">Uploading...</div>}
                </label>
              ))}
            </div>
            {imgError && <div className="text-red-400 text-sm mb-2">{imgError}</div>}
            <div className="text-white/60 text-xs">Upload 5 images to continue.</div>
          </>
        );
      default:
        return null;
    }
  }, [
    step, purpose, relationshipVibe, interestedGender, ageRange,
    bio, interests, interestInput, tvShows, movies, tvInput, movieInput, watchList, watchInput, artistsBands, artistBandInput, profileImageUrl, lifestyleImageUrls,
    imgUploading, imgError, addInterest, removeInterest, addTvShow, removeTvShow, addMovie, removeMovie, addWatchItem, removeWatchItem, addArtistBand, removeArtistBand, handleLifestyleImageChange, handleProfileImageChange, profileImgUploading, profileImgError
  ]);

  if (initialLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }

  const progressPct = Math.round((step / totalSteps) * 100);

  return (
    <div
      className="h-screen w-screen relative font-sans"
      style={{
        backgroundImage: step >= 10 ? "url('/bgs/faceverifybg.png')" : (step === 7 ? "url('/bgs/bg-mediaPreferences.png')" : (step >= 5 ? "url('/bgs/bg-personalProfile.png')" : "url('/bgs/bg-userintent.png')")),
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 h-full px-6 pt-8 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <button onClick={handleBack} aria-label="Back" className="w-8 h-8 flex items-center justify-center">
            <img src="/backarrow.svg" alt="Back" className="w-5 h-5" />
          </button>
          <div className="text-white text-lg font-semibold">Sundate</div>
          <div style={{ width: 32 }} />
        </div>

        <div className="w-full max-w-md mx-auto mb-5">
          <div className="w-full bg-white/10 rounded-full h-1">
            <div className="h-1 rounded-full bg-white transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0">
          <div className="sticky top-0 z-10">
            {renderStepHeader()}
          </div>
          <div className="flex-1 overflow-y-auto mt-4 pb-6">
            {renderStepContent()}
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 px-6">
          <div className="w-full max-w-md">
            <button
              onClick={() => {
                if (step === totalSteps) handleFinish();
                else setStep(s => Math.min(totalSteps, s + 1));
              }}
              className="w-full py-3 rounded-full font-semibold text-base shadow-lg"
              style={isStepValid() ? { background: 'white', color: 'black' } : { background: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', cursor: 'not-allowed' }}
              disabled={!isStepValid() || loading || imgUploading}
            >
              {loading || imgUploading ? 'Saving...' : (step === totalSteps ? 'Finish' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}