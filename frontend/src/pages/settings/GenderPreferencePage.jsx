import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../utils/api';

const RadioOption = ({ label, checked, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between px-5 py-4 mb-4 rounded-2xl transition-all ${checked
        ? 'bg-white/15 border-2 border-white/40'
        : 'bg-white/5 border-2 border-white/20'
      }`}
  >
    <div className="font-medium text-base text-white">{label}</div>
    <span
      className={`ml-4 w-5 h-5 flex items-center justify-center rounded-full border-2 ${checked ? 'border-white' : 'border-white/40'
        }`}
      style={{ minWidth: '20px' }}
    >
      {checked && <span className="block w-2.5 h-2.5 bg-white rounded-full"></span>}
    </span>
  </button>
);

export default function GenderPreferencePage() {
  const navigate = useNavigate();
  const [interestedGender, setInterestedGender] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCurrentPreference = async () => {
      try {
        const userData = await userAPI.getProfile();
        if (userData.intent?.interestedGender) {
          setInterestedGender(userData.intent.interestedGender);
        }
      } catch (err) {
        setError("Failed to load your preference.");
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadCurrentPreference();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await userAPI.updateProfile({
        intent: {
          interestedGender: interestedGender,
        },
      });
      navigate('/settings');
    } catch (err) {
      setError("Failed to save your changes. Please try again.");
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

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: "url('/bgs/faceverifybg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="absolute inset-0 bg-black/40"></div>
      {/* Header */}
      <div className="relative z-10 p-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="text-white text-xl font-semibold">Sundate</div>
          <div style={{ width: 40 }}></div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-white/20 rounded-full mb-8">
          <div className="w-full h-full bg-white rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 pb-6">
        <h1 className="text-[28px] font-normal text-white mb-8 leading-tight">
          Who are you interested in meeting?
        </h1>

        <RadioOption label="Women" checked={interestedGender === 'Women'} onClick={() => setInterestedGender('Women')} />
        <RadioOption label="Men" checked={interestedGender === 'Men'} onClick={() => setInterestedGender('Men')} />
        <RadioOption label="Anyone" checked={interestedGender === 'Anyone'} onClick={() => setInterestedGender('Anyone')} />
      </div>

      {error && (
        <div className="relative z-10 px-6 pb-4">
          <p className="text-red-400 text-center bg-red-900/20 backdrop-blur-sm rounded-xl p-3 border border-red-500/30">{error}</p>
        </div>
      )}

      {/* Bottom button */}
      <div className="relative z-10 p-6 pt-0 pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving || !interestedGender}
          className="w-full py-4 rounded-full text-black font-semibold text-base bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Next'}
        </button>
        {/* Bottom indicator */}
        <div className="flex justify-center mt-4">
          <div className="w-32 h-1 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}