import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../utils/api';

export default function WaitlistStatus() {
  const navigate = useNavigate();
  const [isUserApproved, setIsUserApproved] = useState(null); // null = loading
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchApproval = async () => {
      try {
        const userData = await userAPI.getProfile();
        setIsUserApproved(!!userData.approval);
        setUserName(userData.firstName || userData.email || 'User');
      } catch {
        setIsUserApproved(false);
      }
    };
    fetchApproval();
  }, []);

  return (
    <div className="h-screen bg-white px-6 pt-10 flex flex-col font-sans">
      {/* Header - Common to both loading and status screens */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)} // Go back
          className="w-6 h-6 flex items-center justify-center"
        >
          <img src="/backarrow.svg" alt="Back" width={24} height={24} />
        </button>
        <div className="text-gray-400 text-[14px] font-semibold mx-auto">
          ThursDate.
        </div>
        <div style={{ width: 24 }}></div> {/* Spacer */}
      </div>

      {/* Main content area - centered */}
      <div className="flex flex-col flex-1 justify-center items-center text-center px-4">
        {isUserApproved === null ? (
          <div className="text-gray-500">Checking approval status...</div>
        ) : isUserApproved ? (
          // Approved Screen (without confetti)
          <>
            {/* Success icon with green tick and burst animation */}
            <div className="mb-8 w-24 h-24 relative animate-success-burst flex justify-center items-center">
              {/* Green radial background effect as seen in the approved screenshot */}
              {/* This mimics the lighter green glow around the checkmark in the approved state */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center
                          bg-gradient-to-br from-green-300 via-green-200 to-transparent opacity-70 animate-pulse-background-green">
              </div>
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center z-10 animate-fade-in">
                <img src="/success.svg" alt="Approved Check" className="w-10 h-10 filter brightness-0 invert" />
              </div>
            </div>
            <h1 className="text-xl font-semibold mb-2">You're account has been approved</h1>
            <p className="text-gray-500 mb-12">
              Access unlocked. You're no longer waiting — you made it. Now don't make it weird.
            </p>
          </>
        ) : (
          // Waitlist Screen (initial screen)
          <>
            {/* Success icon with gray tick and pulse animation */}
            <div className="mb-8 w-24 h-24 relative animate-success-burst flex justify-center items-center">
              <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse-background"></div>
              <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center z-10">
                <img src="/success.svg" alt="Success Check" className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-xl font-semibold mb-2">Hey {userName}, you're on the waitlist!</h1>
            <p className="text-gray-500 mb-12">
              Your application is in the hands of the pros. Sit tight, sip your favourite beverage, and let us work our magic—matches coming soon.
            </p>
          </>
        )}
      </div>

      {/* Button container - pushed to the bottom */}
      <div className="pb-6 w-full flex justify-center">
        {isUserApproved ? (
          <button
            onClick={() => navigate("/user-intent")}
            className="w-full max-w-xs py-4 rounded-xl bg-[#222222] text-white font-medium text-sm"
          >
            Continue
          </button>
        ) : (
          <button
            className="w-full max-w-xs py-4 rounded-xl bg-gray-300 text-gray-500 font-medium text-sm cursor-not-allowed"
            disabled
          >
            Waiting for Approval
          </button>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes pulse-background {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
        }

        @keyframes pulse-background-green {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; } /* Slightly larger pulse for green */
            100% { transform: scale(1); opacity: 0.7; }
        }

        @keyframes success-burst {
            0% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }

        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .animate-pulse-background {
            animation: pulse-background 2s infinite ease-in-out;
        }
        .animate-pulse-background-green {
            animation: pulse-background-green 2s infinite ease-in-out;
        }

        .animate-success-burst {
            animation: success-burst 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }

        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}