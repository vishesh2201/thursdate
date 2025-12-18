import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Permissions() {
  const navigate = useNavigate();
  // State to manage the current step: 1 for notifications, 2 for location
  const [currentStep, setCurrentStep] = useState(1);
  // State to control the visibility of the simulated permission modal
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  // State to store the type of permission being requested for the modal
  const [permissionType, setPermissionType] = useState('');

  // Function to handle "Yes" button click for permissions
  const handleAllowPermission = (type) => {
    setPermissionType(type);
    setShowPermissionModal(true);
  };

  // Function to handle actions within the simulated permission modal
  const handleModalAction = (action) => {
    setShowPermissionModal(false);
    if (action === 'allow') {
      // If allowed, move to the next step or navigate away
      if (currentStep === 1) {
        setCurrentStep(2); // Move to location permission
      } else if (currentStep === 2) {
        navigate('/submission-progress'); // Navigate to submission-progress after location permission
      }
    } else {
      // If denied, just close the modal and stay on the current step
      // Or you could add specific logic for denial if needed
      if (currentStep === 1) {
        // For notifications, if denied, still move to location as it's not critical path
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // For location, if denied, still navigate to submission-progress
        navigate('/submission-progress');
      }
    }
  };

  // Function to handle "No, I'll explore on my own" button click
  const handleExploreOnOwn = () => {
    if (currentStep === 1) {
      setCurrentStep(2); // Move to location permission
    } else if (currentStep === 2) {
      navigate('/submission-progress'); // Navigate to submission-progress after location permission
    }
  };

  return (
    <div className="h-screen bg-white px-6 pt-10 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-6 h-6 flex items-center justify-center"
        >
          {/* Back arrow SVG icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.75 19.5L8.25 12L15.75 4.5"
              stroke="#1F2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="text-gray-400 text-[14px] font-semibold mx-auto">
          ThursDate.
        </div>
        <div style={{ width: 24 }}></div> {/* Spacer for alignment */}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 justify-between items-center text-center px-4 pb-6">
        {currentStep === 1 && (
          // Step 1: Notifications Permission
          <div className="flex flex-col items-center justify-center flex-grow">
            <h1 className="text-xl font-semibold mb-2">Stay in the loop with notifications</h1>
            <p className="text-gray-500 text-sm mb-12 max-w-md">
              so you never miss when someone likes you, messages you, or when your profile gets approved
            </p>
          </div>
        )}

        {currentStep === 2 && (
          // Step 2: Location Permission
          <div className="flex flex-col items-center justify-center flex-grow">
            <h1 className="text-xl font-semibold mb-2">Location-based matches</h1>
            <p className="text-gray-500 text-sm mb-12 max-w-md">
              We use your location to help you discover genuine connections around the corner—across the city.
            </p>
          </div>
        )}

        {/* Buttons - stick to the bottom */}
        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={handleExploreOnOwn}
            className="w-full py-4 rounded-xl bg-[#222222] text-white font-medium text-sm hover:bg-[#333333] transition-colors"
          >
            No, I'll explore on my own
          </button>
          <button
            onClick={() => handleAllowPermission(currentStep === 1 ? 'notifications' : 'location')}
            className="w-full py-4 rounded-xl bg-white text-[#222222] border border-gray-300 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            {currentStep === 1 ? 'Yes, send me notifications' : 'Yes, use my location'}
          </button>
        </div>
      </div>

      {/* Simulated iOS-style Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#515151] rounded-xl shadow-lg w-72 text-center overflow-hidden">
            <div className="p-4 pt-5">
              <p className="text-white text-[17px] font-semibold mb-1">
                "ThursDate" would like to {permissionType === 'notifications' ? 'send you notifications' : 'access your location'}
              </p>
              <p className="text-[#D0D0D0] text-[13px] leading-tight px-2">
                {permissionType === 'notifications'
                  ? 'Notifications may include alerts and sound badges. These can be configured in Settings.'
                  : 'We use your location to help you discover genuine connections around the corner—across the city.'}
              </p>
            </div>
            <div className="flex border-t border-[#636363]">
              <button
                onClick={() => handleModalAction('deny')}
                className="flex-1 py-2 text-blue-400 font-normal text-[17px] border-r border-[#636363]"
              >
                Don't Allow
              </button>
              <button
                onClick={() => handleModalAction('allow')}
                className="flex-1 py-2 text-blue-400 font-normal text-[17px]"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}