import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Static Data for Permissions ---
// The status is static for this example. The modalText guides the user.
const permissionsData = [
  {
    key: 'camera',
    title: 'Camera',
    status: 'Not allowed',
    modalTitle: 'Camera Access',
    modalText: "To take and upload photos directly in the app, please allow access to your camera in your phone's settings."
  },
  {
    key: 'contacts',
    title: 'Contacts',
    status: 'Allowed',
    modalTitle: 'Contacts Access',
    modalText: 'We use contacts to help you find and connect with people you may know. You can manage this in your phone\'s settings.'
  },
  {
    key: 'location',
    title: 'Location services',
    status: 'Allowed',
    modalTitle: 'Location Access',
    modalText: 'We use your location to show you potential matches nearby. Please manage this in your phone\'s privacy settings.'
  },
  {
    key: 'mic',
    title: 'Microphones',
    status: 'Not allowed',
    modalTitle: 'Microphone Access',
    modalText: 'To send voice messages or use video chat features, please allow access to your microphone in your phone\'s settings.'
  },
  {
    key: 'photos',
    title: 'Photos',
    status: 'Allowed - Full Access',
    modalTitle: 'Photos Access',
    modalText: 'You have granted access to your photos, allowing you to upload them to your profile. Manage this in your phone\'s settings.'
  },
  {
    key: 'notifications',
    title: 'Notifications',
    status: 'Allowed',
    modalTitle: 'Notifications',
    modalText: 'You will receive notifications for new matches and messages. You can turn this off in your phone\'s notification settings.'
  },
];

// --- Reusable UI Components ---

// Modal component to display guidance
const PermissionModal = ({ content, onClose }) => {
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{content.modalTitle}</h2>
        <p className="text-sm text-gray-600 mb-6">{content.modalText}</p>
        <button onClick={onClose} className="w-full py-3 rounded-lg bg-black text-white font-semibold">OK</button>
      </div>
    </div>
  );
};

export default function DevicePermissionsPage() {
  const navigate = useNavigate();
  // State to manage which modal to show. `null` means no modal.
  const [modalContent, setModalContent] = useState(null);

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
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-semibold text-white">Device permissions</h1>
          <div style={{ width: 40 }}></div>
        </div>
      </div>

      {/* Permissions List */}
      <div className="relative z-10 flex-1 px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          {permissionsData.map((permission, index) => (
            <button
              key={permission.key}
              onClick={() => setModalContent(permission)}
              className={`flex items-center justify-between w-full p-4 text-left ${index < permissionsData.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              <div>
                <p className="font-semibold text-white">{permission.title}</p>
                <p className="text-sm text-white/60">{permission.status}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/60">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Render the Modal */}
      <PermissionModal content={modalContent} onClose={() => setModalContent(null)} />
    </div>
  );
}