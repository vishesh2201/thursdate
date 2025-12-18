import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../utils/api';

// A reusable Toggle Switch component to match the design
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 flex-shrink-0 ${checked ? 'bg-white' : 'bg-gray-600'}`}
  >
    <span
      className={`inline-block w-6 h-6 transform rounded-full transition-transform duration-200 ease-in-out ${checked ? 'translate-x-7 bg-black' : 'translate-x-1 bg-white'}`}
    />
  </button>
);

export default function AccountPrivacyPage() {
  const navigate = useNavigate();

  // State for the component
  const [isPrivate, setIsPrivate] = useState(false);
  const [originalIsPrivate, setOriginalIsPrivate] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch the user's data directly when the component mounts
  useEffect(() => {
    const loadPrivacySetting = async () => {
      try {
        const userData = await userAPI.getProfile();
        const initialValue = userData.isPrivate || false;
        setIsPrivate(initialValue);
        setOriginalIsPrivate(initialValue);
      } catch (err) {
        setError("Failed to load your privacy setting.");
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadPrivacySetting();
  }, []); // Empty dependency array means this runs once on mount

  // This function only updates the UI state
  const handleToggle = () => {
    setIsPrivate(currentValue => !currentValue);
  };

  // The save handler for the button
  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await userAPI.updateProfile({
        isPrivate: isPrivate,
      });
      // After saving, navigate back to the settings page
      navigate('/settings');
    } catch (err) {
      setError("Couldn't save change. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div
        className="h-screen flex justify-center items-center relative"
        style={{
          backgroundImage: "url('/bgs/faceverifybg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <p className="relative z-10 text-white">Loading...</p>
      </div>
    );
  }

  const hasChanged = isPrivate !== originalIsPrivate;

  return (
    <div
      className="min-h-screen flex flex-col font-sans relative"
      style={{
        backgroundImage: "url('/bgs/faceverifybg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      {/* Top Bar */}
      <div className="relative z-10 p-6 pt-12">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-semibold text-white -ml-10">Account Privacy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 pb-6">
        <h2 className="text-sm font-semibold text-white/70 mb-3">Preferences</h2>
        <div className="bg-[#2C2C2E] rounded-2xl p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <label className="font-medium text-white text-base block mb-1">
                Private account
              </label>
              <p className="text-sm text-white/60 leading-relaxed pr-4">
                When your account is private, only profiles you've matched with can view your profile.
              </p>
            </div>
            <ToggleSwitch
              checked={isPrivate}
              onChange={handleToggle}
            />
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="relative z-10 px-6 pb-4">
          <p className="text-red-400 text-center bg-red-900/20 backdrop-blur-sm rounded-xl p-3 border border-red-500/30">{error}</p>
        </div>
      )}

      {/* Save Button - only show if changed */}
      {hasChanged && (
        <div className="relative z-10 p-6 pt-0 pb-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 rounded-full text-black font-semibold text-base bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <div className="flex justify-center mt-4">
            <div className="w-32 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}