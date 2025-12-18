import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ApplicationStatus() {
  const navigate = useNavigate();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const duration = 4000; // 4 seconds
    const interval = 50; // Update every 50ms
    const totalUpdates = duration / interval;
    let currentUpdate = 0;

    const progressTimer = setInterval(() => {
      currentUpdate += 1;
      const newProgress = (currentUpdate / totalUpdates) * 100;
      setLoadingProgress(Math.min(newProgress, 100));

      if (currentUpdate * interval >= duration) { // Check if total duration has passed
        clearInterval(progressTimer);
        setIsLoading(false);
      }
    }, interval);

    return () => clearInterval(progressTimer);
  }, []);

  return (
    <div className="h-screen bg-white px-6 pt-10 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-6 h-6 flex items-center justify-center"
        >
          <img src="/backarrow.svg" alt="Back" width={24} height={24} />
        </button>
        <div className="text-gray-400 text-[14px] font-semibold mx-auto">
          ThursDate.
        </div>
        <div style={{ width: 24 }}></div>
      </div>

      {isLoading ? (
        // Loading Screen
        <div className="flex flex-col flex-1 items-center justify-center text-center">
          <p className="text-gray-700 text-lg font-medium mb-6">Submitting application...</p>
          <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-[#222222] h-2 rounded-full transition-all ease-linear"
              style={{ width: `${loadingProgress}%`, transitionDuration: '50ms' }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">{Math.round(loadingProgress)}%</p>
        </div>
      ) : (
        // Waitlist Status Screen
        <div className="flex flex-col flex-1 justify-between items-center text-center pb-6"> {/* Added pb-6 for padding bottom */}
          {/* Content (Image and Text) - remains centered */}
          <div className="flex flex-col items-center justify-center flex-grow"> {/* flex-grow helps push button down */}
            <div className="mb-8 w-24 h-24 flex items-center justify-center">
              <img src="/underprocess.svg" alt="Under Process" className="w-20 h-20" />
            </div>

            <h1 className="text-xl font-semibold mb-2">Application Under Process</h1>
            <p className="text-gray-500 text-sm mb-12 max-w-md">
              We’ve received your details and are reviewing them with care. You’ll hear from us soon.
            </p>
          </div>

          {/* Button - sticks to the bottom */}
          <div className="w-full max-w-xs"> {/* Wrapper for button to control its width */}
            <button
              onClick={() => navigate('/waitlist-status')}
              className="w-full py-4 rounded-xl bg-[#222222] text-white font-medium text-sm hover:bg-[#333333] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}