import { useState, useMemo, useEffect, useCallback } from "react";
import {
  WheelPicker,
  WheelPickerWrapper,
} from "@ncdai/react-wheel-picker";
import { useNavigate } from 'react-router-dom';
import backgroundImage from '/bgs/bg-1.png'; // Adjust path if the image is in a different folder (e.g., '../assets/image_dd0111.jpg')
import { authAPI, userAPI, uploadAPI } from '../../utils/api';

// Helper to get days in a month (handles leap years)
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// List of popular locations for autocomplete
const popularLocations = [
  "Paris", "Tokyo", "New York", "London", "Sydney",
  "Rome", "Barcelona", "Amsterdam", "Bangkok", "Cape Town",
  "Dubai", "San Francisco", "Rio de Janeiro", "Kyoto", "Vancouver"
];

// --- Custom Tailwind/CSS Overrides for Glassmorphism ---
const GLASS_BACKGROUND = 'bg-white/10';
const INPUT_GLASS = 'bg-white/20 backdrop-blur-sm placeholder-white/80 text-white border-white/30';
const BUTTON_GLASS_ACTIVE = 'bg-white backdrop-blur-md text-black border border-white/40 shadow-lg';
const BUTTON_GLASS_INACTIVE = 'bg-white/10 text-white/50 cursor-not-allowed border border-white/20';
const CARD_GLASS_ACTIVE = 'bg-white/20 backdrop-blur-lg border border-white/30 text-white shadow-xl';
const CARD_GLASS_INACTIVE = 'bg-white/10 backdrop-blur-md border border-white/10 text-white/70';
// ---

export default function UserInfo() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [customGender, setCustomGender] = useState("");
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [dob, setDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize picker states with a valid date (e.g., current date)
  const [pickerDay, setPickerDay] = useState("");
  const [pickerMonth, setPickerMonth] = useState("");
  const [pickerYear, setPickerYear] = useState("");

  // States for additional steps
  const [currentLocation, setCurrentLocation] = useState("");
  const [favouriteTravelDestination, setFavouriteTravelDestination] = useState("");

  // States for tag-based inputs
  const [lastHolidayPlaces, setLastHolidayPlaces] = useState([]);
  const [currentLastHolidayPlaceInput, setCurrentLastHolidayPlaceInput] = useState("");
  const [lastHolidaySuggestions, setLastHolidaySuggestions] = useState([]);
  const [favouritePlacesToGo, setFavouritePlacesToGo] = useState([]);
  const [currentFavouritePlaceToGoInput, setCurrentFavouritePlaceToGoInput] = useState("");
  const [favouritePlaceSuggestions, setFavouritePlaceSuggestions] = useState([]);

  // Face verification reference photo step state
  const [faceVerificationPic, setFaceVerificationPic] = useState(null);
  const [faceVerificationUrl, setFaceVerificationUrl] = useState("");
  const [showPicModal, setShowPicModal] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [picError, setPicError] = useState("");

  const navigate = useNavigate();

  // Load existing profile data
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const userData = await userAPI.getProfile();
        if (!mounted) return;

        if (userData.firstName) setFirstName(userData.firstName);
        if (userData.lastName) setLastName(userData.lastName);
        if (userData.gender) {
          if (['Male', 'Female', 'Non-binary'].includes(userData.gender)) {
            setGender(userData.gender);
          } else {
            setGender('Other');
            setCustomGender(userData.gender);
          }
        }
        if (userData.dob) setDob(userData.dob);
        if (userData.currentLocation) setCurrentLocation(userData.currentLocation);
        if (userData.favouriteTravelDestination) setFavouriteTravelDestination(userData.favouriteTravelDestination);
        if (userData.lastHolidayPlaces) setLastHolidayPlaces(userData.lastHolidayPlaces);
        if (userData.favouritePlacesToGo) setFavouritePlacesToGo(userData.favouritePlacesToGo);
        if (userData.faceVerificationUrl) setFaceVerificationUrl(userData.faceVerificationUrl);
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, []);

  // Effect to synchronize picker states when DOB changes or picker is shown
  useEffect(() => {
    const initialDate = dob ? new Date(dob) : new Date();
    setPickerDay(String(initialDate.getDate()));
    setPickerMonth(String(initialDate.getMonth() + 1));
    setPickerYear(String(initialDate.getFullYear()));
  }, [dob, showDatePicker]);

  // Effect for autocomplete suggestions for Last Holiday Places
  useEffect(() => {
    if (currentLastHolidayPlaceInput.trim() === "") {
      setLastHolidaySuggestions([]);
      return;
    }
    const input = currentLastHolidayPlaceInput.toLowerCase();
    const suggestions = popularLocations.filter(location =>
      location.toLowerCase().startsWith(input)
    );
    setLastHolidaySuggestions(suggestions);
  }, [currentLastHolidayPlaceInput]);

  // Effect for autocomplete suggestions for Favourite Places to Go
  useEffect(() => {
    if (currentFavouritePlaceToGoInput.trim() === "") {
      setFavouritePlaceSuggestions([]);
      return;
    }
    const input = currentFavouritePlaceToGoInput.toLowerCase();
    const suggestions = popularLocations.filter(location =>
      location.toLowerCase().startsWith(input)
    );
    setFavouritePlaceSuggestions(suggestions);
  }, [currentFavouritePlaceToGoInput]);

  // Adjust pickerDay if month/year changes and the day becomes invalid
  const updatePickerDayBasedOnMonthYear = useCallback((year, month, day) => {
    const maxDays = getDaysInMonth(Number(year), Number(month) - 1);
    if (Number(day) > maxDays) {
      return String(maxDays);
    }
    return day;
  }, []);

  // Total logical steps for the progress bar
  const totalSteps = 8;
  const progress = (step / totalSteps) * 100;

  const handleNext = async () => {
    if (step === 8 && faceVerificationUrl) {
      // Save user info to backend (including faceVerificationUrl for verification)
      try {
        await userAPI.saveProfile({
          firstName,
          lastName,
          gender: gender === "Other" ? customGender : gender,
          dob,
          currentLocation,
          favouriteTravelDestination,
          lastHolidayPlaces,
          favouritePlacesToGo,
          faceVerificationUrl, // Stored for later face matching verification
        });
        navigate('/social-presence');
      } catch (err) {
        alert("Failed to save user info: " + err.message);
      }
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) return navigate(-1);
    setStep(step - 1);
  };

  // Generate options for the WheelPicker components
  const dayOptions = useMemo(() => {
    const days = [];
    const maxDays = getDaysInMonth(Number(pickerYear), Number(pickerMonth) - 1);
    for (let i = 1; i <= maxDays; i++) {
      days.push({ label: String(i).padStart(2, '0'), value: String(i) });
    }
    return days;
  }, [pickerMonth, pickerYear]);

  const monthOptions = useMemo(() => {
    const months = [];
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    for (let i = 0; i < 12; i++) {
      months.push({ label: monthNames[i], value: String(i + 1) });
    }
    return months;
  }, []);

  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    // Assuming the user needs to select a birth year up to 120 years ago
    for (let i = currentYear - 120; i <= currentYear; i++) {
      years.push({ label: String(i), value: String(i) });
    }
    return years.reverse(); // Displaying newest years first
  }, []);

  const handleDateConfirm = () => {
    const year = Number(pickerYear);
    const month = Number(pickerMonth);
    const day = Number(updatePickerDayBasedOnMonthYear(pickerYear, pickerMonth, pickerDay));

    const selectedDate = new Date(year, month - 1, day);
    setDob(selectedDate.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  // Helper function to parse place name and details
  const parsePlaceInput = (input) => {
    const match = input.match(/(.+?)\s*\((.+)\)/);
    if (match) {
      return { name: match[1].trim(), details: match[2].trim() };
    }
    return { name: input.trim(), details: "" };
  };

  // Handlers for Last Holiday Places (Step 6)
  const handleAddLastHolidayPlace = (e) => {
    if (e.key === 'Enter' && currentLastHolidayPlaceInput.trim() !== '') {
      const { name, details } = parsePlaceInput(currentLastHolidayPlaceInput);
      setLastHolidayPlaces(prev => [...prev, { id: Date.now(), name, details }]);
      setCurrentLastHolidayPlaceInput("");
      setLastHolidaySuggestions([]);
    }
  };

  const handleRemoveLastHolidayPlace = (id) => {
    setLastHolidayPlaces(prev => prev.filter(place => place.id !== id));
  };

  const handleLastHolidaySuggestionClick = (suggestion) => {
    setCurrentLastHolidayPlaceInput(suggestion);
    setLastHolidaySuggestions([]);
  };

  // Handlers for Favourite Places to Go (Step 7)
  const handleAddFavouritePlaceToGo = (e) => {
    if (e.key === 'Enter' && currentFavouritePlaceToGoInput.trim() !== '') {
      const { name, details } = parsePlaceInput(currentFavouritePlaceToGoInput);
      setFavouritePlacesToGo(prev => [...prev, { id: Date.now(), name, details }]);
      setCurrentFavouritePlaceToGoInput("");
      setFavouritePlaceSuggestions([]);
    }
  };

  const handleRemoveFavouritePlaceToGo = (id) => {
    setFavouritePlacesToGo(prev => prev.filter(place => place.id !== id));
  };

  const handleFavouritePlaceSuggestionClick = (suggestion) => {
    setCurrentFavouritePlaceToGoInput(suggestion);
    setFavouritePlaceSuggestions([]);
  };

  // Validation for each step's input fields
  const isStepOneValid = firstName.trim() && lastName.trim();
  const isStepTwoValid = gender && (gender !== "Other" || customGender.trim());
  const isStepThreeValid = useMemo(() => {
    if (!dob) return false;
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    return age >= 30;
  }, [dob]);
  const isStepFourValid = currentLocation.trim();
  const isStepFiveValid = favouriteTravelDestination.trim();
  const isStepSixValid = lastHolidayPlaces.length >= 3;
  const isStepSevenValid = favouritePlacesToGo.length >= 3;
  const isStepEightValid = !!faceVerificationUrl;

  const getNextButtonDisabled = () => {
    switch (step) {
      case 1: return !isStepOneValid;
      case 2: return !isStepTwoValid;
      case 3: return !isStepThreeValid;
      case 4: return !isStepFourValid;
      case 5: return !isStepFiveValid;
      case 6: return !isStepSixValid;
      case 7: return !isStepSevenValid;
      case 8: return !isStepEightValid;
      default: return true;
    }
  };

  const getNextButtonText = () => {
    return step === totalSteps ? "Finish" : "Next";
  };

  // Face verification photo upload handler
  const handlePicInput = async (e) => {
    setPicError("");
    const file = e.target.files[0];
    if (!file) return;
    setFaceVerificationPic(file);
    setUploadingPic(true);
    try {
      const result = await uploadAPI.uploadFacePhoto(file);
      setFaceVerificationUrl(result.url);
    } catch (err) {
      setPicError("Failed to upload image. Please try again.");
    } finally {
      setUploadingPic(false);
    }
  };

  return (
    // Set the overall background to the provided image and make content a glass card
    <div
      className="h-screen flex flex-col font-sans"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for a slight darkening effect on the background image */}
      <div className="absolute inset-0 bg-black/30 z-0"></div>

      {/* Main Content Container with Glassmorphism Effect */}
      <div className={`relative z-10 p-6 pt-10 flex flex-col flex-grow ${GLASS_BACKGROUND}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center p-1 rounded-full bg-white/20 backdrop-blur-sm text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="text-white/80 text-[24px] font-semibold mx-auto">
            Sundate.
          </div>
          <div style={{ width: 24 }}></div>
        </div>

        {/* Top Progress Bar */}
        <div className="w-full bg-white/30 rounded-full h-1.5 mb-8">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-300 shadow-md"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Dynamic Step Content */}
        <div className="flex flex-col flex-grow">

          {/* Step 1: Name Details */}
          {step === 1 && (
            <div className="flex flex-col flex-grow ml-4">
              <h1 className="text-xl font-semibold mb-6 text-white drop-shadow-md">Let's start with your Full name.</h1>
              <label htmlFor="firstName" className="text-sm font-medium text-white/90 mb-1">First Name</label>
              <div className="flex gap-2 mb-4 ">
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className={`w-[320px] px-4 py-3 border rounded-xl text-sm transition ${INPUT_GLASS}`}
                />
              </div>
              <label htmlFor="lastName" className="text-sm font-medium text-white/90 mb-1">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={`w-[320px] px-4 py-3 border rounded-xl text-sm mb-auto transition ${INPUT_GLASS}`}
              />
              <button
                disabled={getNextButtonDisabled()}
                onClick={handleNext}
                className={`w-full py-4 rounded-[9999px] font-medium text-lg transition ${getNextButtonDisabled() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE
                  }`}
              >
                {getNextButtonText()}
              </button>
            </div>
          )}

          {/* Step 2: Gender Details */}
          {step === 2 && (
            <div className="flex flex-col flex-grow">
              <h1 className="text-xl font-semibold mb-6 text-white drop-shadow-md">
                Which gender best describes you?
              </h1>
              {[
                "Woman",
                "Man",
                "Non-binary",
                "Other",
              ].map((option) => (
                <label
                  key={option}
                  className={`flex items-center justify-between rounded-xl px-4 py-4 mb-3 cursor-pointer transition ${gender === option ? CARD_GLASS_ACTIVE : CARD_GLASS_INACTIVE
                    }`}
                >
                  <span className="font-medium">{option}</span>
                  <input
                    type="radio"
                    name="gender"
                    value={option}
                    checked={gender === option}
                    onChange={() => {
                      setGender(option);
                      setShowOtherOptions(option === "Other");
                      if (option !== "Other") {
                        setCustomGender("");
                      }
                    }}
                    // Using a custom ring for radio button to match theme
                    className="h-5 w-5 border-2 border-white/50 checked:bg-white checked:ring-white/80 checked:ring-2 appearance-none rounded-full cursor-pointer transition"
                    style={{ backgroundColor: gender === option ? 'white' : 'transparent' }}
                  />
                </label>
              ))}

              {/* Display other gender options when 'Other' is selected */}
              {showOtherOptions && (
                <div className={`rounded-xl p-4 mt-4 transition ${CARD_GLASS_ACTIVE}`}>
                  <p className="text-sm font-semibold mb-3 text-white/90">Please specify:</p>
                  <div className="max-h-32 overflow-y-auto">
                    {[
                      "Non-Binary",
                      "Genderqueer",
                      "Agender",
                      "Bigender",
                      "Genderfluid",
                      "Transgender",
                      "Transmasculine",
                      "Transfeminine",
                      "Two-Spirit",
                      "Intersex",
                      "Demiboy",
                      "Demigirl",
                      "Third Gender",
                    ].map((otherOption) => (
                      <label
                        key={otherOption}
                        className="flex items-center justify-between py-2 cursor-pointer text-sm text-white/90"
                      >
                        <span>{otherOption}</span>
                        <input
                          type="radio"
                          name="customGenderOption"
                          value={otherOption}
                          checked={customGender === otherOption}
                          onChange={() => setCustomGender(otherOption)}
                          className="h-4 w-4 border border-white/50 checked:bg-white checked:ring-white/80 checked:ring-1 appearance-none rounded-full cursor-pointer"
                          style={{ backgroundColor: customGender === otherOption ? 'white' : 'transparent' }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6">
                <button
                  disabled={getNextButtonDisabled()}
                  onClick={handleNext}
                  className={`w-full py-4 rounded-[9999px] font-medium text-lg transition ${getNextButtonDisabled() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE
                    }`}
                >
                  {getNextButtonText()}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Age Details */}
          {step === 3 && (
            <div className="flex flex-col flex-grow">
              <h1 className="text-xl font-semibold mb-6 text-white drop-shadow-md">What's your Age?</h1>
              <div
                className={`w-full px-4 py-4 rounded-xl text-base mb-2 flex justify-between items-center cursor-pointer transition ${INPUT_GLASS}`}
                onClick={() => {
                  setShowDatePicker(true);
                }}
              >
                <span className="font-medium">{dob ? new Date(dob).toLocaleDateString('en-GB') : "DD/MM/YYYY"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar text-white/70"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              </div>
              <p className={`text-xs mb-auto text-white/60 ${isStepThreeValid ? 'text-white/60' : 'text-red-300'}`}>
                {isStepThreeValid ? 'You meet the minimum age requirement.' : 'Must be at least 30 years old.'}
              </p>
              <button
                disabled={getNextButtonDisabled()}
                onClick={handleNext}
                className={`w-full py-4 rounded-[9999px] font-medium text-lg transition ${getNextButtonDisabled() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE
                  }`}
              >
                {getNextButtonText()}
              </button>

              {/* Custom Date Picker Overlay */}
              {showDatePicker && (
                <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
                  <div className={`w-full ${GLASS_BACKGROUND} p-4 rounded-t-3xl backdrop-blur-xl shadow-2xl relative`}>
                    <div className="flex justify-between items-center mb-4 text-white">
                      <button onClick={() => setShowDatePicker(false)} className="text-white/70 font-medium">Cancel</button>
                      <div className="font-semibold text-lg">Select Date</div>
                      <button onClick={handleDateConfirm} className="text-white font-semibold">Done</button>
                    </div>

                    <WheelPickerWrapper
                      className="flex w-full justify-center h-48 py-2 relative"
                      style={{
                        // A more subtle highlight line for the date picker
                        backgroundImage: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 50%, transparent), linear-gradient(to top, transparent, rgba(255,255,255,0.1) 50%, transparent)',
                        backgroundSize: '100% 1px',
                        backgroundRepeat: 'repeat-x',
                        backgroundPosition: 'center',
                      }}
                    >
                      <WheelPicker
                        options={dayOptions}
                        value={pickerDay}
                        onValueChange={(val) => setPickerDay(updatePickerDayBasedOnMonthYear(pickerYear, pickerMonth, val))}
                        classNames={{
                          optionItem: "text-white/40",
                          highlightWrapper: "bg-white/10 rounded-md",
                          highlightItem: "text-white font-semibold",
                        }}
                        infinite={true}
                      />
                      <WheelPicker
                        options={monthOptions}
                        value={pickerMonth}
                        onValueChange={(val) => {
                          setPickerMonth(val);
                          setPickerDay(updatePickerDayBasedOnMonthYear(pickerYear, val, pickerDay));
                        }}
                        classNames={{
                          optionItem: "text-white/40",
                          highlightWrapper: "bg-white/10 rounded-md",
                          highlightItem: "text-white font-semibold",
                        }}
                        infinite={true}
                      />
                      <WheelPicker
                        options={yearOptions}
                        value={pickerYear}
                        onValueChange={(val) => {
                          setPickerYear(val);
                          setPickerDay(updatePickerDayBasedOnMonthYear(val, pickerMonth, pickerDay));
                        }}
                        classNames={{
                          optionItem: "text-white/40",
                          highlightWrapper: "bg-white/10 rounded-md",
                          highlightItem: "text-white font-semibold",
                        }}
                        infinite={false}
                      />
                    </WheelPickerWrapper>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Current Location Details */}
          {step === 4 && (
            <div className="flex flex-col flex-grow">
              <h1 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Where are you living currently?</h1>
              <p className="text-sm text-white/70 mb-6">This will help users see which city you are currently living in so they can connect accordingly.</p>
              <div className="relative mb-auto">
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g., Andheri"
                  className={`w-full px-4 py-3 border rounded-xl text-sm pr-10 ${INPUT_GLASS}`}
                />
                {currentLocation && (
                  <button
                    onClick={() => setCurrentLocation("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 text-lg transition"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                disabled={getNextButtonDisabled()}
                onClick={handleNext}
                className={`w-full py-4 rounded-[9999px] font-medium text-lg transition ${getNextButtonDisabled() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE
                  }`}
              >
                {getNextButtonText()}
              </button>
            </div>
          )}

          {/* Step 5: Favourite Travel Destination */}
          {step === 5 && (
            <div className="flex flex-col flex-grow">
              <h1 className="text-xl font-semibold mb-4 text-white drop-shadow-md">What is your favourite travel destination?</h1>
              <p className="text-sm text-white/70 mb-6">Enter your dream destination</p>
              <div className="relative mb-auto">
                <input
                  type="text"
                  value={favouriteTravelDestination}
                  onChange={(e) => setFavouriteTravelDestination(e.target.value)}
                  placeholder="e.g., Paris"
                  className={`w-full px-4 py-3 border rounded-xl text-sm pr-10 ${INPUT_GLASS}`}
                />
                {favouriteTravelDestination && (
                  <button
                    onClick={() => setFavouriteTravelDestination("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 text-lg transition"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                disabled={getNextButtonDisabled()}
                onClick={handleNext}
                className={`w-full py-4 rounded-[9999px] font-medium text-lg transition ${getNextButtonDisabled() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE
                  }`}
              >
                {getNextButtonText()}
              </button>
            </div>
          )}

          {/* Step 6: Last Holiday Places - Tag Input with Autocomplete */}
          {step === 6 && (
            <div className="flex flex-col flex-grow">
              <h1 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Where did you go on your last holiday?</h1>
              <p className={`text-sm mb-6 ${isStepSixValid ? 'text-white/70' : 'text-red-300'}`}>
                {isStepSixValid ? 'Great! You can add more if you like.' : 'Enter minimum 3 places'}
              </p>

              {/* Input for new tags with autocomplete - MOVED TO TOP */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={currentLastHolidayPlaceInput}
                  onChange={(e) => setCurrentLastHolidayPlaceInput(e.target.value)}
                  onKeyDown={handleAddLastHolidayPlace}
                  placeholder="Type a place & press Enter (e.g., Paris)"
                  className={`w-full px-4 py-3 border rounded-xl text-sm pr-10 ${INPUT_GLASS}`}
                />
                {currentLastHolidayPlaceInput && (
                  <button
                    onClick={() => {
                      setCurrentLastHolidayPlaceInput("");
                      setLastHolidaySuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 text-lg transition"
                  >
                    ×
                  </button>
                )}
                {lastHolidaySuggestions.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white/40 backdrop-blur-lg border border-white/40 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                    {lastHolidaySuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleLastHolidaySuggestionClick(suggestion)}
                        className="px-4 py-2 text-sm text-white hover:bg-white/20 cursor-pointer transition"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Display existing tags - MOVED BELOW INPUT */}
              <div className="flex flex-wrap gap-4 mb-auto max-h-40 overflow-y-auto">
                {lastHolidayPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="px-3 py-2 rounded-full flex items-center justify-between text-sm shadow-md"
                    style={{
                      width: 'full',
                      borderRadius: '50px',
                      background: 'rgba(0, 0, 0, 0.50)',
                      border: '1px solid rgba(255, 255, 255, 0.40)',
                    }}
                  >
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <span className="text-white truncate block">{place.name}</span>
                      {place.details && (
                        <span className="text-white/80 text-xs truncate block">({place.details})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveLastHolidayPlace(place.id)}
                      className="ml-2 text-white/80 hover:text-white transition flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                disabled={getNextButtonDisabled()}
                onClick={handleNext}
                className={`w-full py-4 rounded-[9999px] font-medium text-lg transition mt-6 ${getNextButtonDisabled() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE
                  }`}
              >
                {getNextButtonText()}
              </button>
            </div>
          )}

          {/* Step 7: Favourite Places to Go To - Tag Input with Autocomplete */}
          {step === 7 && (
            <div className="flex flex-col flex-grow">
              <h1 className="text-xl font-semibold mb-4 text-white drop-shadow-md">What are your three favourite places to go to?</h1>
              <p className={`text-sm mb-6 ${isStepSevenValid ? 'text-white/70' : 'text-red-300'}`}>
                {isStepSevenValid ? 'Perfect! Time for the final step.' : 'Enter minimum 3 places'}
              </p>

              {/* Input for new tags with autocomplete - MOVED TO TOP */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={currentFavouritePlaceToGoInput}
                  onChange={(e) => setCurrentFavouritePlaceToGoInput(e.target.value)}
                  onKeyDown={handleAddFavouritePlaceToGo}
                  placeholder="Type a place & press Enter (e.g., Paris)"
                  className={`w-full px-4 py-3 border rounded-xl text-sm pr-10 ${INPUT_GLASS}`}
                />
                {currentFavouritePlaceToGoInput && (
                  <button
                    onClick={() => {
                      setCurrentFavouritePlaceToGoInput("");
                      setFavouritePlaceSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 text-lg transition"
                  >
                    ×
                  </button>
                )}
                {favouritePlaceSuggestions.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white/40 backdrop-blur-lg border border-white/40 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                    {favouritePlaceSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleFavouritePlaceSuggestionClick(suggestion)}
                        className="px-4 py-2 text-sm text-white hover:bg-white/20 cursor-pointer transition"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Display existing tags - MOVED BELOW INPUT */}
              <div className="flex flex-wrap gap-2 mb-auto max-h-40 overflow-y-auto">
                {favouritePlacesToGo.map((place) => (
                  <div
                    key={place.id}
                    className="px-4 py-2 rounded-full flex items-center text-sm shadow-md"
                    style={{
                      borderRadius: '50px',
                      background: 'rgba(0, 0, 0, 0.50)',
                      border: '1px solid rgba(255, 255, 255, 0.40)',
                      flex: '0 0 calc(50% - 0.25rem)', // Makes 2 per row with gap
                      minWidth: '150', // Prevents overflow
                    }}
                  >
                    <span className="text-white truncate">{place.name}</span>
                    {place.details && (
                      <span className="text-white/80 ml-1 text-xs truncate">({place.details})</span>
                    )}
                    <button
                      onClick={() => handleRemoveFavouritePlaceToGo(place.id)}
                      className="ml-2 text-white/80 hover:text-white transition flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                disabled={getNextButtonDisabled()}
                onClick={handleNext}
                className={`w-full py-4 rounded-[9999px] font-medium text-lg transition mt-6 ${getNextButtonDisabled() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE
                  }`}
              >
                {getNextButtonText()}
              </button>
            </div>
          )}

          {/* Step 8: Face Verification Reference Photo */}
          {step === 8 && (
            <div className="flex flex-col flex-grow items-center">
              <h1 className="text-xl font-semibold mb-2 text-white drop-shadow-md">Face Verification - Step 1</h1>
              <p className="text-sm text-white/70 mb-6 text-center">Upload a clear photo of your face for verification.</p>

              <div className="flex flex-col items-center mb-auto">
                <div
                  className="w-36 h-36 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden mb-4 border-4 border-white/50 relative cursor-pointer shadow-xl transition"
                  onClick={() => setShowPicModal(true)}
                >
                  {faceVerificationUrl ? (
                    <img src={faceVerificationUrl} alt="Face Verification Preview" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-6xl text-white/70">+</span>
                  )}
                  {uploadingPic && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-sm text-white">Uploading...</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-white/60 text-center">
                  <div className="mb-2 font-semibold text-white/80">Important Guidelines:</div>
                  <ul className="list-disc list-inside text-xs text-white/70 text-left w-max mx-auto">
                    <li>Face clearly visible and well-lit</li>
                    <li>Look directly at the camera</li>
                    <li>No sunglasses, hats, or face coverings</li>
                    <li>This photo is for security verification only</li>
                  </ul>
                </div>
                {picError && <div className="text-red-300 text-xs mt-2">{picError}</div>}
              </div>
              <button
                disabled={getNextButtonDisabled()}
                onClick={handleNext}
                className={`w-full py-4 rounded-[9999px] font-medium text-lg transition ${getNextButtonDisabled() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE
                  }`}
              >
                {getNextButtonText()}
              </button>

              {/* Modal for Gallery/Camera selection (Using a darker Glassmorphism for pop-ups) */}
              {showPicModal && (
                <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
                  <div className={`w-full p-6 pb-8 shadow-2xl rounded-t-3xl bg-black/30 backdrop-blur-xl border-t border-white/20`}>
                    <div className="mb-4 text-center font-semibold text-white">Upload verification photo</div>
                    <div className="flex flex-col gap-3">
                      {/* Gallery Button - Styled for Glassmorphism */}
                      <label className="w-full py-3 rounded-xl bg-white/20 backdrop-blur-sm text-center cursor-pointer text-sm font-medium text-white/90 border border-white/30 hover:bg-white/30 transition">
                        Gallery
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            setShowPicModal(false);
                            handlePicInput(e);
                          }}
                        />
                      </label>
                      {/* Camera Button - Styled for Glassmorphism */}
                      <label className="w-full py-3 rounded-xl bg-white/20 backdrop-blur-sm text-center cursor-pointer text-sm font-medium text-white/90 border border-white/30 hover:bg-white/30 transition">
                        Camera
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            setShowPicModal(false);
                            handlePicInput(e);
                          }}
                        />
                      </label>
                    </div>
                    {/* Cancel Button - Styled for Glassmorphism */}
                    <button
                      className="w-full mt-4 py-3 rounded-xl bg-black/30 backdrop-blur-sm text-white/70 text-sm font-medium border border-white/20 hover:bg-black/40 transition"
                      onClick={() => setShowPicModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}