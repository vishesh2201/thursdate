import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userAPI, chatAPI, uploadAPI } from '../../utils/api';
import {
    WheelPicker,
    WheelPickerWrapper,
} from "@ncdai/react-wheel-picker";

export default function ProfileQuestions() {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    
    // Get navigation state for level-only flows
    const { levelOnly, returnTo, returnState } = location.state || {};

    // Question states
    const [education, setEducation] = useState('');
    const [educationDetail, setEducationDetail] = useState('');
    const [languages, setLanguages] = useState([]);
    const [languageInput, setLanguageInput] = useState('');
    const [canCode, setCanCode] = useState(false);
    const [codingLanguages, setCodingLanguages] = useState([]);
    const [codingLanguageInput, setCodingLanguageInput] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [pets, setPets] = useState('');
    const [foodPreference, setFoodPreference] = useState('');
    const [sleepSchedule, setSleepSchedule] = useState('');
    const [drinking, setDrinking] = useState('');
    const [smoking, setSmoking] = useState('');
    const [height, setHeight] = useState('172');
    const [dateBill, setDateBill] = useState('');
    const [kids, setKids] = useState('');
    const [religiousLevel, setReligiousLevel] = useState('moderately'); // 'not', 'moderately', 'deeply'
    const [religion, setReligion] = useState('');
    const [customReligion, setCustomReligion] = useState('');
    const [favoriteCafe, setFavoriteCafe] = useState('');
    const [relationshipValues, setRelationshipValues] = useState([]);
    const [livingSituation, setLivingSituation] = useState('');
    const [livingSituationCustom, setLivingSituationCustom] = useState('');
    const [facePhotos, setFacePhotos] = useState([null, null, null, null, null, null]);
    const [uploading, setUploading] = useState(false);

    const totalSteps = 16; // Updated to include all questions + face photos

    // Load existing profile data
    useEffect(() => {
        let mounted = true;
        const loadProfile = async () => {
            try {
                const userData = await userAPI.getProfile();
                if (!mounted) return;

                // Load from root level (new hybrid storage)
                if (userData.pets) setPets(userData.pets);
                if (userData.drinking) setDrinking(userData.drinking);
                if (userData.smoking) setSmoking(userData.smoking);
                if (userData.height) setHeight(String(userData.height));
                if (userData.religiousLevel) setReligiousLevel(userData.religiousLevel);
                if (userData.kidsPreference) setKids(userData.kidsPreference);
                if (userData.foodPreference) setFoodPreference(userData.foodPreference);

                // Load from intent.profileQuestions
                if (userData.intent && userData.intent.profileQuestions) {
                    const pq = userData.intent.profileQuestions;
                    if (pq.education) setEducation(pq.education);
                    if (pq.educationDetail) setEducationDetail(pq.educationDetail);
                    if (pq.languages) setLanguages(pq.languages);
                    if (pq.canCode !== undefined) setCanCode(pq.canCode);
                    if (pq.codingLanguages) setCodingLanguages(pq.codingLanguages);
                    if (pq.jobTitle) setJobTitle(pq.jobTitle);
                    if (pq.companyName) setCompanyName(pq.companyName);
                    if (pq.sleepSchedule) setSleepSchedule(pq.sleepSchedule);
                    if (pq.dateBill) setDateBill(pq.dateBill);
                    if (pq.religion) setReligion(pq.religion);
                    if (pq.customReligion) setCustomReligion(pq.customReligion);
                    if (pq.favoriteCafe) setFavoriteCafe(pq.favoriteCafe);
                    if (pq.relationshipValues) setRelationshipValues(pq.relationshipValues);
                    if (pq.livingSituation) setLivingSituation(pq.livingSituation);
                    if (pq.livingSituationCustom) setLivingSituationCustom(pq.livingSituationCustom);
                }

                // Load face photos
                if (userData.facePhotos && userData.facePhotos.length > 0) {
                    const photos = [...userData.facePhotos];
                    while (photos.length < 6) photos.push(null);
                    setFacePhotos(photos.slice(0, 6));
                }
            } catch (err) {
                console.error('Failed to load profile', err);
            } finally {
                if (mounted) setInitialLoading(false);
            }
        };
        loadProfile();
        return () => { mounted = false; };
    }, []);

    // Helper function to convert cm to feet and inches
    const cmToFeet = (cm) => {
        const totalInches = cm / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        return `${feet}'${inches}"`;
    };

    // Generate height options (150cm - 200cm)
    const heightOptions = useMemo(() => {
        return Array.from({ length: 51 }, (_, i) => {
            const cm = 150 + i;
            return {
                value: String(cm),
                label: `(${cmToFeet(cm)}) ${cm} cm`,
            };
        });
    }, []);

    const canProceed = () => {
        switch (step) {
            case 1: return !!education && !!educationDetail;
            case 2: {
                if (canCode) {
                    return languages.length > 0 && codingLanguages.length > 0;
                }
                return languages.length > 0;
            }
            case 3: return !!jobTitle && !!companyName;
            case 4: return !!pets;
            case 5: return !!foodPreference;
            case 6: return !!sleepSchedule;
            case 7: return !!drinking;
            case 8: return !!smoking;
            case 9: return !!height;
            case 10: return !!dateBill;
            case 11: return !!kids;
            case 12: {
                if (religiousLevel === 'not') return true;
                return !!religion && (religion !== 'Other' || !!customReligion);
            }
            case 13: return !!favoriteCafe;
            case 14: return relationshipValues.length > 0;
            case 15: return !!livingSituation && (livingSituation !== 'Other' || !!livingSituationCustom);
            case 16: return facePhotos.filter(Boolean).length >= 4;
            default: return false;
        }
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (step === 1) {
            navigate(-1);
        } else {
            setStep(step - 1);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const currentProfile = await userAPI.getProfile();
            await userAPI.updateProfile({
                ...currentProfile,
                // ✅ NEW: Send matchable fields at root level for hybrid storage
                pets,
                drinking,
                smoking,
                height: parseInt(height),
                religiousLevel,
                kidsPreference: kids,
                foodPreference,
                facePhotos: facePhotos.filter(Boolean),
                // Keep non-matchable fields in intent for flexibility
                intent: {
                    ...currentProfile.intent,
                    profileQuestions: {
                        education,
                        educationDetail,
                        languages,
                        canCode,
                        codingLanguages,
                        jobTitle,
                        companyName,
                        sleepSchedule,
                        dateBill,
                        religion: religiousLevel === 'not' ? null : religion,
                        customReligion: religiousLevel === 'not' ? null : customReligion,
                        favoriteCafe,
                        relationshipValues,
                        livingSituation,
                        livingSituationCustom: livingSituation === 'Other' ? livingSituationCustom : null,
                    },
                },
                onboardingComplete: levelOnly ? undefined : true,
            });
            
            // If this is a level 2 only flow, mark it as complete and navigate back
            console.log('[ProfileQuestions] Checking level flow:', { levelOnly, returnState, returnTo });
            if (levelOnly === 2 && returnState?.conversationId) {
                try {
                    await chatAPI.completeLevel2(returnState.conversationId);
                    console.log('[Level 2] Marked as complete for conversation', returnState.conversationId);
                    // Navigate back to the specific chat conversation
                    console.log('[Level 2] Navigating to chat-conversation with state:', returnState);
                    navigate('/chat-conversation', { state: returnState });
                } catch (err) {
                    console.error('[Level 2] Failed to mark complete:', err);
                    alert('Your answers were saved, but there was an error updating your conversation. Please try reopening the chat.');
                    // Still navigate back - user data is saved, just the conversation flag might not be set
                    navigate('/chat-conversation', { state: returnState });
                }
            } else if (levelOnly === 3 && returnState?.conversationId) {
                try {
                    await chatAPI.completeLevel3(returnState.conversationId);
                    console.log('[Level 3] Marked as complete for conversation', returnState.conversationId);
                    // Navigate back to the specific chat conversation
                    console.log('[Level 3] Navigating to chat-conversation with state:', returnState);
                    navigate('/chat-conversation', { state: returnState });
                } catch (err) {
                    console.error('[Level 3] Failed to mark complete:', err);
                    alert('Your answers were saved, but there was an error updating your conversation. Please try reopening the chat.');
                    // Still navigate back - user data is saved, just the conversation flag might not be set
                    navigate('/chat-conversation', { state: returnState });
                }
            } else if (returnTo === '/chat-conversation' && returnState?.conversationId) {
                // ✅ FIX: If there's a conversationId in returnState, go to chat-conversation
                console.log('[ProfileQuestions] Navigating to chat-conversation with state:', returnState);
                navigate('/chat-conversation', { state: returnState });
            } else {
                // No specific return destination, go to home
                console.log('[ProfileQuestions] No return destination, going to home');
                navigate('/home');
            }
        } catch (err) {
            console.error('Save failed', err);
            alert('Failed to save. ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = async (idx, file) => {
        // Set preview immediately
        setFacePhotos(prev => {
            const updated = [...prev];
            updated[idx] = URL.createObjectURL(file);
            return updated;
        });

        // Upload to server immediately
        try {
            setUploading(true);
            const res = await uploadAPI.uploadFacePhoto(file);
            setFacePhotos(prev => {
                const updated = [...prev];
                updated[idx] = res.url;
                return updated;
            });
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const RadioOption = ({ label, checked, onClick, disabled = false }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center justify-between p-4 mb-3 rounded-xl transition-all text-left ${disabled
                ? 'bg-white/5 border-2 border-transparent opacity-40 cursor-not-allowed'
                : checked
                    ? 'bg-white/20 border-2 border-white'
                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                }`}
        >
            <span className={`font-medium ${disabled ? 'text-white/40' : 'text-white'}`}>{label}</span>
            <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${disabled
                    ? 'border-white/30'
                    : checked
                        ? 'border-white bg-white'
                        : 'border-white/50'
                    }`}
            >
                {checked && !disabled && <div className="w-2.5 h-2.5 rounded-full bg-[#222222]" />}
            </div>
        </button>
    );

    return (
        <div
            className="min-h-screen flex flex-col font-sans relative"
            style={{
                backgroundImage: `url('/bgs/bg-userintent.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 z-0"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <div className="p-4 pt-10 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                    >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path
                                d="M15 19l-7-7 7-7"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <div className="text-white text-lg font-semibold">Sundate</div>
                    <div className="w-8 h-8" />
                </div>

                {/* Progress Bar */}
                <div className="px-6 mb-6">
                    <div className="w-full bg-white/30 rounded-full h-1.5">
                        <div
                            className="bg-white h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {/* Education Question */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-white text-2xl font-bold mb-6">
                                What's your highest level of education?
                            </h2>

                            <div>
                                <RadioOption
                                    label="School"
                                    checked={education === 'School'}
                                    onClick={() => setEducation('School')}
                                />
                                {education === 'School' && (
                                    <div className="mt-3 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Enter your school name"
                                            value={educationDetail}
                                            onChange={(e) => setEducationDetail(e.target.value)}
                                            className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <RadioOption
                                    label="College / Undergraduate"
                                    checked={education === 'College / Undergraduate'}
                                    onClick={() => setEducation('College / Undergraduate')}
                                />
                                {education === 'College / Undergraduate' && (
                                    <div className="mt-3 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Enter your college name"
                                            value={educationDetail}
                                            onChange={(e) => setEducationDetail(e.target.value)}
                                            className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <RadioOption
                                    label="Postgraduate / Masters"
                                    checked={education === 'Postgraduate / Masters'}
                                    onClick={() => setEducation('Postgraduate / Masters')}
                                />
                                {education === 'Postgraduate / Masters' && (
                                    <div className="mt-3 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Enter your institution name"
                                            value={educationDetail}
                                            onChange={(e) => setEducationDetail(e.target.value)}
                                            className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <RadioOption
                                    label="Other"
                                    checked={education === 'Other'}
                                    onClick={() => setEducation('Other')}
                                />
                                {education === 'Other' && (
                                    <div className="mt-3 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Enter your education details"
                                            value={educationDetail}
                                            onChange={(e) => setEducationDetail(e.target.value)}
                                            className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Languages Question */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    How many languages do you speak?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Share the languages you speak or understand. Bonus points if you code ;)
                                </p>
                            </div>

                            {/* Language Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Add languages"
                                    value={languageInput}
                                    onChange={(e) => setLanguageInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && languageInput.trim()) {
                                            setLanguages([...languages, languageInput.trim()]);
                                            setLanguageInput('');
                                        }
                                    }}
                                    className="w-full p-4 pl-12 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                />
                                <svg
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>

                            {/* Selected Languages */}
                            {languages.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {languages.map((lang, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
                                        >
                                            <span className="text-white text-sm">{lang}</span>
                                            <button
                                                onClick={() => setLanguages(languages.filter((_, i) => i !== index))}
                                                className="text-white/80 hover:text-white"
                                            >
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Coding Toggle */}
                            <div className="mt-6 flex items-center justify-between p-4 border-white/30">
                                <span className="text-white font-medium">Do you code too?</span>
                                <button
                                    onClick={() => setCanCode(!canCode)}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${canCode ? 'bg-white/30' : 'bg-white/30'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 w-6 h-6 rounded-full bg-[#FFFFFF] transition-transform ${canCode ? 'right-1' : 'left-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Coding Languages Section */}
                            {canCode && (
                                <div className="mt-6 space-y-4">
                                    <p className="text-white/70 text-sm">
                                        Share the coding languages you know. It might help you connect with like-minded people!
                                    </p>

                                    {/* Coding Language Input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Add coding languages"
                                            value={codingLanguageInput}
                                            onChange={(e) => setCodingLanguageInput(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && codingLanguageInput.trim()) {
                                                    setCodingLanguages([...codingLanguages, codingLanguageInput.trim()]);
                                                    setCodingLanguageInput('');
                                                }
                                            }}
                                            className="w-full p-4 pl-12 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                        />
                                        <svg
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60"
                                            width="20"
                                            height="20"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>

                                    {/* Selected Coding Languages */}
                                    {codingLanguages.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {codingLanguages.map((lang, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
                                                >
                                                    <span className="text-white text-sm">{lang}</span>
                                                    <button
                                                        onClick={() => setCodingLanguages(codingLanguages.filter((_, i) => i !== index))}
                                                        className="text-white/80 hover:text-white"
                                                    >
                                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Profession Question */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-white text-2xl font-bold mb-6">
                                What's your profession and where do you work?
                            </h2>

                            {/* Job Title */}
                            <div>
                                <label className="text-white text-sm font-medium mb-2 block">
                                    Job Title
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Product Designer"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full p-4 pr-10 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                    />
                                    {jobTitle && (
                                        <button
                                            onClick={() => setJobTitle('')}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                                        >
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="text-white text-sm font-medium mb-2 block">
                                    Company Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Frick"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full p-4 pr-10 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                    />
                                    {companyName && (
                                        <button
                                            onClick={() => setCompanyName('')}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-white"
                                        >
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pets Question */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    Do you like pets?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Your lifestyle matters—pick what fits you best!
                                </p>
                            </div>

                            <RadioOption
                                label="Pet Parent"
                                checked={pets === 'Pet Parent'}
                                onClick={() => setPets('Pet Parent')}
                            />
                            <RadioOption
                                label="Love them... as long as they're not mine"
                                checked={pets === "Love them... as long as they're not mine"}
                                onClick={() => setPets("Love them... as long as they're not mine")}
                            />
                            <RadioOption
                                label="Only if they match my aesthetic"
                                checked={pets === 'Only if they match my aesthetic'}
                                onClick={() => setPets('Only if they match my aesthetic')}
                            />
                            <RadioOption
                                label="Not a pet person — plants don't bark"
                                checked={pets === "Not a pet person — plants don't bark"}
                                onClick={() => setPets("Not a pet person — plants don't bark")}
                            />
                            <RadioOption
                                label="Prefer not to say"
                                checked={pets === 'Prefer not to say'}
                                onClick={() => setPets('Prefer not to say')}
                            />
                        </div>
                    )}

                    {/* Food Preferences Question */}
                    {step === 5 && (
                        <div className="space-y-3">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    What is your food preferences?
                                </h2>
                                <p className="text-white/70 text-sm mb-4">
                                    Your food choices say a lot about you. Pick what fuels your vibe.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setFoodPreference('Non vegetarian')}
                                className={`w-full flex items-start justify-between p-3 rounded-xl transition-all text-left ${foodPreference === 'Non vegetarian'
                                    ? 'bg-white/20 border-2 border-white'
                                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="text-white font-medium text-base mb-0.5">Non vegetarian</div>
                                    <div className="text-white text-xs">Everything (may include certain meats)</div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ml-2 ${foodPreference === 'Non vegetarian' ? 'border-white bg-white' : 'border-white/50'
                                        }`}
                                >
                                    {foodPreference === 'Non vegetarian' && <div className="w-2.5 h-2.5 rounded-full bg-[#222222]" />}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFoodPreference('Vegetarian')}
                                className={`w-full flex items-start justify-between p-3 rounded-xl transition-all text-left ${foodPreference === 'Vegetarian'
                                    ? 'bg-white/20 border-2 border-white'
                                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="text-white font-medium text-base mb-0.5">Vegetarian</div>
                                    <div className="text-white text-xs">No meat, No fish, No seafood, no eggs</div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ml-2 ${foodPreference === 'Vegetarian' ? 'border-white bg-white' : 'border-white/50'
                                        }`}
                                >
                                    {foodPreference === 'Vegetarian' && <div className="w-2.5 h-2.5 rounded-full bg-[#222222]" />}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFoodPreference('Eggetarian')}
                                className={`w-full flex items-start justify-between p-3 rounded-xl transition-all text-left ${foodPreference === 'Eggetarian'
                                    ? 'bg-white/20 border-2 border-white'
                                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="text-white font-medium text-base mb-0.5">Eggetarian</div>
                                    <div className="text-white text-xs">No meat, no fish, no seafood</div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ml-2 ${foodPreference === 'Eggetarian' ? 'border-white bg-white' : 'border-white/50'
                                        }`}
                                >
                                    {foodPreference === 'Eggetarian' && <div className="w-2.5 h-2.5 rounded-full bg-[#222222]" />}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFoodPreference('Pescetarian')}
                                className={`w-full flex items-start justify-between p-3 rounded-xl transition-all text-left ${foodPreference === 'Pescetarian'
                                    ? 'bg-white/20 border-2 border-white'
                                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="text-white font-medium text-base mb-0.5">Pescetarian</div>
                                    <div className="text-white text-xs">Fish and/or seafood, but no meat</div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ml-2 ${foodPreference === 'Pescetarian' ? 'border-white bg-white' : 'border-white/50'
                                        }`}
                                >
                                    {foodPreference === 'Pescetarian' && <div className="w-2.5 h-2.5 rounded-full bg-[#222222]" />}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFoodPreference('Jain')}
                                className={`w-full flex items-start justify-between p-3 rounded-xl transition-all text-left ${foodPreference === 'Jain'
                                    ? 'bg-white/20 border-2 border-white'
                                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="text-white font-medium text-base mb-0.5">Jain</div>
                                    <div className="text-white text-xs">No meat, no fish, no seafood, no eggs, no root vegetables</div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ml-2 ${foodPreference === 'Jain' ? 'border-white bg-white' : 'border-white/50'
                                        }`}
                                >
                                    {foodPreference === 'Jain' && <div className="w-2.5 h-2.5 rounded-full bg-[#222222]" />}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFoodPreference('Vegan')}
                                className={`w-full flex items-start justify-between p-3 rounded-xl transition-all text-left ${foodPreference === 'Vegan'
                                    ? 'bg-white/20 border-2 border-white'
                                    : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="text-white font-medium text-base mb-0.5">Vegan</div>
                                    <div className="text-white text-xs">No meat, no fish, no seafood, no eggs, no dairy, no honey, or no other animal-derived products</div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ml-2 ${foodPreference === 'Vegan' ? 'border-white bg-white' : 'border-white/50'
                                        }`}
                                >
                                    {foodPreference === 'Vegan' && <div className="w-2.5 h-2.5 rounded-full bg-[#222222]" />}
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Sleep Schedule Question */}
                    {step === 6 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    Are you a morning or night person?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Your lifestyle matters—pick what fits you best!
                                </p>
                            </div>

                            <RadioOption
                                label="5AM club"
                                checked={sleepSchedule === '5AM club'}
                                onClick={() => setSleepSchedule('5AM club')}
                            />
                            <RadioOption
                                label="Early riser"
                                checked={sleepSchedule === 'Early riser'}
                                onClick={() => setSleepSchedule('Early riser')}
                            />
                            <RadioOption
                                label="Late sleeper"
                                checked={sleepSchedule === 'Late sleeper'}
                                onClick={() => setSleepSchedule('Late sleeper')}
                            />
                            <RadioOption
                                label="Sleep is for the weak"
                                checked={sleepSchedule === 'Sleep is for the weak'}
                                onClick={() => setSleepSchedule('Sleep is for the weak')}
                            />
                            <RadioOption
                                label="Can sleep anytime, anywhere"
                                checked={sleepSchedule === 'Can sleep anytime, anywhere'}
                                onClick={() => setSleepSchedule('Can sleep anytime, anywhere')}
                            />
                        </div>
                    )}

                    {/* Drinking Question */}
                    {step === 7 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    Do you drink?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Your lifestyle matters—pick what fits you best!
                                </p>
                            </div>

                            <RadioOption
                                label="Never"
                                checked={drinking === 'Never'}
                                onClick={() => setDrinking('Never')}
                            />
                            <RadioOption
                                label="Sometimes/Socially"
                                checked={drinking === 'Sometimes/Socially'}
                                onClick={() => setDrinking('Sometimes/Socially')}
                            />
                            <RadioOption
                                label="Regularly"
                                checked={drinking === 'Regularly'}
                                onClick={() => setDrinking('Regularly')}
                            />
                            <RadioOption
                                label="Only on days that end in 'y'"
                                checked={drinking === "Only on days that end in 'y'"}
                                onClick={() => setDrinking("Only on days that end in 'y'")}
                            />
                            <RadioOption
                                label="Prefer not to say"
                                checked={drinking === 'Prefer not to say'}
                                onClick={() => setDrinking('Prefer not to say')}
                            />
                        </div>
                    )}

                    {/* Smoking Question */}
                    {step === 8 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    Do you smoke?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Your lifestyle matters—pick what fits you best!
                                </p>
                            </div>

                            <RadioOption
                                label="Never"
                                checked={smoking === 'Never'}
                                onClick={() => setSmoking('Never')}
                            />
                            <RadioOption
                                label="Sometimes/Socially"
                                checked={smoking === 'Sometimes/Socially'}
                                onClick={() => setSmoking('Sometimes/Socially')}
                            />
                            <RadioOption
                                label="Regularly"
                                checked={smoking === 'Regularly'}
                                onClick={() => setSmoking('Regularly')}
                            />
                            <RadioOption
                                label="Only when I drink"
                                checked={smoking === 'Only when I drink'}
                                onClick={() => setSmoking('Only when I drink')}
                            />
                            <RadioOption
                                label="Trying to quit... again"
                                checked={smoking === 'Trying to quit... again'}
                                onClick={() => setSmoking('Trying to quit... again')}
                            />
                            <RadioOption
                                label="Prefer not to say"
                                checked={smoking === 'Prefer not to say'}
                                onClick={() => setSmoking('Prefer not to say')}
                            />
                        </div>
                    )}

                    {/* Height Question */}
                    {step === 9 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    How tall are you?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    You can change or delete your answer at any time later.
                                </p>
                            </div>

                            {/* Height Display */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
                                <WheelPickerWrapper
                                    className="flex w-full justify-center h-48 py-2 relative"
                                    style={{
                                        backgroundImage: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.2) 55%, transparent)',
                                        backgroundSize: '100% 100%',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    <WheelPicker
                                        options={heightOptions}
                                        value={height}
                                        onValueChange={setHeight}
                                        classNames={{
                                            optionItem: "text-white/40",
                                            highlightWrapper: "bg-white rounded-md",
                                            highlightItem: "text-black font-semibold",
                                        }}
                                        infinite={false}
                                    />
                                </WheelPickerWrapper>
                            </div>
                        </div>
                    )}

                    {/* Date Bill Question */}
                    {step === 10 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    How do you prefer to handle the date bill?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    No right or wrong — just share your style.
                                </p>
                            </div>

                            <RadioOption
                                label="On me"
                                checked={dateBill === 'On me'}
                                onClick={() => setDateBill('On me')}
                            />
                            <RadioOption
                                label="On you"
                                checked={dateBill === 'On you'}
                                onClick={() => setDateBill('On you')}
                            />
                            <RadioOption
                                label="Let's split"
                                checked={dateBill === "Let's split"}
                                onClick={() => setDateBill("Let's split")}
                            />
                            <RadioOption
                                label="Take turns"
                                checked={dateBill === 'Take turns'}
                                onClick={() => setDateBill('Take turns')}
                            />
                            <RadioOption
                                label="Open to discuss"
                                checked={dateBill === 'Open to discuss'}
                                onClick={() => setDateBill('Open to discuss')}
                            />
                        </div>
                    )}

                    {/* Kids Question */}
                    {step === 11 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    What are your thoughts on kids?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Your lifestyle matters—pick what fits you best!
                                </p>
                            </div>

                            <RadioOption
                                label="I don't have kids, But open to the idea"
                                checked={kids === "I don't have kids, But open to the idea"}
                                onClick={() => setKids("I don't have kids, But open to the idea")}
                            />
                            <RadioOption
                                label="I don't have kids, I don't want any"
                                checked={kids === "I don't have kids, I don't want any"}
                                onClick={() => setKids("I don't have kids, I don't want any")}
                            />
                            <RadioOption
                                label="Don't have kids & don't know"
                                checked={kids === "Don't have kids & don't know"}
                                onClick={() => setKids("Don't have kids & don't know")}
                            />
                            <RadioOption
                                label="I have kids, I don't want more"
                                checked={kids === "I have kids, I don't want more"}
                                onClick={() => setKids("I have kids, I don't want more")}
                            />
                            <RadioOption
                                label="I have kids, I want more"
                                checked={kids === 'I have kids, I want more'}
                                onClick={() => setKids('I have kids, I want more')}
                            />
                        </div>
                    )}

                    {/* Religion Question */}
                    {step === 12 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    How Religious are you?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Religion can be a dealbreaker or just background noise. What's your take?
                                </p>
                            </div>

                            {/* Religious Level Slider */}
                            <div className="relative mb-8 px-8">
                                {/* Slider Track */}
                                <div className="relative h-1 bg-white/30 rounded-full mb-6">
                                    <div
                                        className="absolute h-1 bg-white rounded-full transition-all duration-300"
                                        style={{
                                            width: religiousLevel === 'not' ? '0%' : religiousLevel === 'moderately' ? '50%' : '100%',
                                        }}
                                    />

                                    {/* Clickable areas on slider */}
                                    <button
                                        onClick={() => {
                                            setReligiousLevel('not');
                                            setReligion('');
                                            setCustomReligion('');
                                        }}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center z-10"
                                        style={{ transform: 'translate(-50%, -50%)' }}
                                    >
                                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transition-all ${religiousLevel === 'not' ? 'scale-110' : 'scale-90 opacity-60'}`}>
                                            <img src="/notreligious.svg" alt="Not Religious" className="w-6 h-6" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setReligiousLevel('moderately')}
                                        className="absolute left-1/2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center z-10"
                                        style={{ transform: 'translate(-50%, -50%)' }}
                                    >
                                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transition-all ${religiousLevel === 'moderately' ? 'scale-110' : 'scale-90 opacity-60'}`}>
                                            <img src="/moderatereligious.svg" alt="Moderately Religious" className="w-6 h-6" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setReligiousLevel('deeply')}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center z-10"
                                        style={{ transform: 'translate(50%, -50%)' }}
                                    >
                                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transition-all ${religiousLevel === 'deeply' ? 'scale-110' : 'scale-90 opacity-60'}`}>
                                            <img src="/deeplyreligious.svg" alt="Deeply Religious" className="w-6 h-6" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Labels */}
                            <div className="flex justify-between items-center mt-6 px-1">
                                <span className={`text-xs transition-opacity text-center ${religiousLevel === 'not' ? 'text-white font-medium' : 'text-white/50'}`}>
                                    Not<br />Religious
                                </span>
                                <span className={`text-xs transition-opacity text-center ${religiousLevel === 'moderately' ? 'text-white font-medium' : 'text-white/50'}`}>
                                    Moderately<br />religious
                                </span>
                                <span className={`text-xs transition-opacity text-center ${religiousLevel === 'deeply' ? 'text-white font-medium' : 'text-white/50'}`}>
                                    Deeply<br />Religious
                                </span>
                            </div>

                            {/* Religion Options */}
                            <div>
                                <h3 className="text-white text-lg font-semibold mb-4">
                                    What's your religion?
                                </h3>
                                <p className="text-white/70 text-xs mb-4">
                                    Select your faith or belief system. This is optional.
                                </p>

                                <div className="space-y-3">
                                    <RadioOption
                                        label="Hindu"
                                        checked={religion === 'Hindu'}
                                        onClick={() => religiousLevel !== 'not' && setReligion('Hindu')}
                                        disabled={religiousLevel === 'not'}
                                    />
                                    <RadioOption
                                        label="Buddhist"
                                        checked={religion === 'Buddhist'}
                                        onClick={() => religiousLevel !== 'not' && setReligion('Buddhist')}
                                        disabled={religiousLevel === 'not'}
                                    />
                                    <RadioOption
                                        label="Christian"
                                        checked={religion === 'Christian'}
                                        onClick={() => religiousLevel !== 'not' && setReligion('Christian')}
                                        disabled={religiousLevel === 'not'}
                                    />
                                    <div>
                                        <RadioOption
                                            label="Other"
                                            checked={religion === 'Other'}
                                            onClick={() => religiousLevel !== 'not' && setReligion('Other')}
                                            disabled={religiousLevel === 'not'}
                                        />
                                        {religion === 'Other' && religiousLevel !== 'not' && (
                                            <input
                                                type="text"
                                                placeholder="Mention"
                                                value={customReligion}
                                                onChange={(e) => setCustomReligion(e.target.value)}
                                                className="w-full mt-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 13: Favorite Cafe/Restaurant */}
                    {step === 13 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-3">
                                    Your go-to café or restaurant?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Share your favorite café or restaurant. It's a great way to find someone who loves the same places!
                                </p>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type your favorite café or restaurant"
                                    value={favoriteCafe}
                                    onChange={(e) => setFavoriteCafe(e.target.value)}
                                    className="w-full p-4 pr-12 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                />
                                <svg
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <p className="text-white/50 text-xs">
                                E.g. Blue Tokai, Olive Bar, Trishna
                            </p>
                        </div>
                    )}

                    {/* Step 14: Relationship Values */}
                    {step === 14 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-3">
                                    What matters most to you in a relationship?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    This helps others understand what you truly value.
                                </p>
                            </div>

                            <div className="relative">

                                <textarea
                                    placeholder=" Write a few sentences about what's most important to you — whether it's qualities or experiences you look for."
                                    value={relationshipValues.join('\n')}
                                    onChange={(e) => setRelationshipValues(e.target.value ? e.target.value.split('\n') : [])}
                                    rows={6}
                                    className="w-full mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 15: Living Situation */}
                    {step === 15 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-3">
                                    Who do you live with?
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Help us give a little context about your lifestyle
                                </p>
                            </div>

                            <div className="space-y-3">
                                <RadioOption
                                    label="I live alone"
                                    checked={livingSituation === 'I live alone'}
                                    onClick={() => {
                                        setLivingSituation('I live alone');
                                        setLivingSituationCustom('');
                                    }}
                                />
                                <RadioOption
                                    label="I live with family"
                                    checked={livingSituation === 'I live with family'}
                                    onClick={() => {
                                        setLivingSituation('I live with family');
                                        setLivingSituationCustom('');
                                    }}
                                />
                                <RadioOption
                                    label="Other"
                                    checked={livingSituation === 'Other'}
                                    onClick={() => setLivingSituation('Other')}
                                />
                                {livingSituation === 'Other' && (
                                    <input
                                        type="text"
                                        placeholder="Mention"
                                        value={livingSituationCustom}
                                        onChange={(e) => setLivingSituationCustom(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-gray-800/50 backdrop-blur-sm text-white border-2 border-white/30 placeholder-white/60 focus:outline-none focus:border-white transition"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 16: Face Photos */}
                    {step === 16 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-3">
                                    Add Your Face Photos
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Upload at least 4 clear photos of yourself. This will be shared at Level 3 (after 10 messages) to help build trust and genuine connections.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {facePhotos.map((photo, idx) => (
                                    <div key={idx} className="relative aspect-square">
                                        {photo ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={photo}
                                                    alt={`Face ${idx + 1}`}
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFacePhotos(prev => {
                                                            const updated = [...prev];
                                                            updated[idx] = null;
                                                            return updated;
                                                        });
                                                    }}
                                                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="w-full h-full flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:bg-white/15 transition">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            handlePhotoChange(idx, e.target.files[0]);
                                                        }
                                                    }}
                                                    className="hidden"
                                                    disabled={uploading}
                                                />
                                                <svg
                                                    className="w-8 h-8 text-white/50 mb-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                                <span className="text-white/50 text-xs">Add Photo</span>
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                <div className="flex items-start gap-3">
                                    <svg
                                        className="w-5 h-5 text-white/70 flex-shrink-0 mt-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <div className="text-white/70 text-sm">
                                        <p className="font-medium mb-1">Why face photos?</p>
                                        <p>These photos will only be shown at Level 3, after you and your match have exchanged 10 messages. This helps build trust gradually.</p>
                                    </div>
                                </div>
                            </div>

                            {uploading && (
                                <div className="text-center text-white/70 text-sm">
                                    Uploading photo...
                                </div>
                            )}

                            <div className="text-center text-white/70 text-sm">
                                {facePhotos.filter(Boolean).length}/6 photos added
                                <br />
                                (minimum 4 required)
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Save Button */}
                <div className="p-6 pt-4">
                    <button
                        onClick={handleNext}
                        disabled={!canProceed() || loading || uploading}
                        className={`w-full py-4 rounded-xl font-semibold text-base transition-all ${canProceed() && !loading && !uploading
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'bg-white/30 text-white/50 cursor-not-allowed'
                            }`}
                    >
                        {loading ? 'Saving...' : uploading ? 'Uploading...' : step === totalSteps ? 'Save' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}
