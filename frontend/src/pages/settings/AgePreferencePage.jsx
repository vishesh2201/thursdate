import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../utils/api';

export default function AgePreferencePage() {
  const navigate = useNavigate();
  const [ageRange, setAgeRange] = useState([40, 60]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const minAge = 30;
  const maxAge = 85;
  const [activeThumb, setActiveThumb] = useState(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const loadCurrentPreference = async () => {
      try {
        const userData = await userAPI.getProfile();
        if (userData.intent?.preferredAgeRange) {
          setAgeRange(userData.intent.preferredAgeRange);
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
          preferredAgeRange: ageRange,
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

  useEffect(() => {
    const onMove = (e) => {
      if (activeThumb === null || !sliderRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = sliderRef.current.getBoundingClientRect();
      let percent = (clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      let value = Math.round(minAge + percent * (maxAge - minAge));
      let newRange = [...ageRange];
      if (activeThumb === 0) {
        newRange[0] = Math.min(value, newRange[1] - 1);
      } else {
        newRange[1] = Math.max(value, newRange[0] + 1);
      }
      setAgeRange(newRange);
    };
    const onUp = () => setActiveThumb(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, [activeThumb, ageRange, minAge, maxAge]);

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

  const minThumbPos = ((ageRange[0] - minAge) / (maxAge - minAge)) * 100;
  const maxThumbPos = ((ageRange[1] - minAge) / (maxAge - minAge)) * 100;

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
      <div className="relative z-10 flex-1 px-6 pb-6 flex flex-col">
        <div className="text-left mb-12">
          <h1 className="text-[28px] font-normal text-white mb-3 leading-tight">
            Preferred age range?
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Tell us your preferred age range for potential matches.
          </p>
        </div>

        <div ref={sliderRef} className="relative w-full max-w-md mx-auto">
          {/* Age labels above slider */}
          <div className="absolute w-full" style={{ top: '-48px' }}>
            <div className="absolute transform -translate-x-1/2" style={{ left: `${minThumbPos}%` }}>
              <div className="bg-white/90 text-gray-900 text-base font-medium rounded-lg px-4 py-1.5 relative z-10 shadow-lg">
                {ageRange[0]}
              </div>
            </div>
            <div className="absolute transform -translate-x-1/2" style={{ left: `${maxThumbPos}%` }}>
              <div className="bg-white/90 text-gray-900 text-base font-medium rounded-lg px-4 py-1.5 relative z-10 shadow-lg">
                {ageRange[1]}
              </div>
            </div>
          </div>

          {/* Slider track and thumbs */}
          <div className="relative h-3 flex items-center mt-4">
            <div className="absolute left-0 right-0 h-2 rounded-full bg-white/20"></div>
            <div
              className="absolute h-2 rounded-full bg-white"
              style={{ left: `${minThumbPos}%`, width: `${maxThumbPos - minThumbPos}%` }}
            ></div>
            <button
              type="button"
              className="absolute z-10 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ left: `calc(${minThumbPos}% - 14px)` }}
              onMouseDown={() => setActiveThumb(0)}
              onTouchStart={() => setActiveThumb(0)}
            >
              <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
            </button>
            <button
              type="button"
              className="absolute z-10 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ left: `calc(${maxThumbPos}% - 14px)` }}
              onMouseDown={() => setActiveThumb(1)}
              onTouchStart={() => setActiveThumb(1)}
            >
              <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
            </button>
          </div>
        </div>
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
          disabled={isSaving}
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