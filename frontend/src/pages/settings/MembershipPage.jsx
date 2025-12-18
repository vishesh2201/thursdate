import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../utils/api';

// --- Static Data for Subscription Plans ---
const basicPlans = [
  { id: 'b1', name: 'Luyona Monthly', price: 'INR 3,000', period: 'per month' },
  { id: 'b2', name: 'Luyona Annual', price: 'INR 25,000', period: 'annually' },
];

const proPlans = [
  { id: 'p1', name: 'Luyona Pro Monthly', price: 'INR 5,000', period: 'per month' },
  { id: 'p2', name: 'Luyona Pro Annual', price: 'INR 40,000', period: 'annually' },
];

// --- Reusable UI Components ---

// Component for each plan item, now aware of the current plan
const PlanItem = ({ name, price, period, isCurrentPlan }) => (
  <div className="flex justify-between items-center py-3">
    <div>
      <p className="font-semibold text-white">{name}</p>
      <p className="text-sm text-white/60">{price} {period}</p>
    </div>
    <button
      disabled={isCurrentPlan}
      className={`text-sm font-semibold px-6 py-2 rounded-lg transition-colors ${isCurrentPlan
          ? 'bg-white/20 text-white/50 cursor-not-allowed'
          : 'bg-white text-black hover:bg-white/90'
        }`}
    >
      {isCurrentPlan ? 'Current' : 'Buy'}
    </button>
  </div>
);

// Modal component for pausing/deleting
const PauseDeleteModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleYes = () => {
    console.log("User chose to pause or delete.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl p-6 text-center animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <img src="/membership-icon.svg" alt="Membership Icon" className="w-20 h-20" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Pause or Delete Membership</h2>
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to pause or cancel your membership?</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-black text-white font-semibold">No</button>
          <button onClick={handleYes} className="flex-1 py-3 rounded-xl bg-white text-black font-semibold border border-gray-300">Yes</button>
        </div>
      </div>
    </div>
  );
};

export default function MembershipPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // For now, we'll define the current plan ID here.
  // In the future, this would come from the userInfo object.
  const currentPlanId = 'b1'; // This corresponds to 'Luyona Monthly'

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userData = await userAPI.getProfile();
        setUserInfo(userData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  if (loading) {
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
      className="min-h-screen flex flex-col font-sans relative"
      style={{
        backgroundImage: "url('/bgs/faceverifybg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-semibold text-white">Manage membership</h1>
          <div style={{ width: 40 }}></div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-4">
            <img src={userInfo?.profilePicUrl || 'https://via.placeholder.com/50'} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <p className="font-bold text-lg text-white">{userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'User Name'}</p>
              <button onClick={() => navigate('/home', { state: { selectedTab: 'profile' } })} className="text-sm text-white/80">My Profile &gt;</button>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <p className="text-white">Current membership: <span className="font-semibold">Luyona monthly</span></p>
            <p className="text-white/60">Renews on: Aug 28, 2025</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-4">
          <h2 className="text-md font-bold text-white mb-2">Basic plans</h2>
          {basicPlans.map(plan => (
            <PlanItem
              key={plan.id}
              {...plan}
              isCurrentPlan={plan.id === currentPlanId}
            />
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-4">
          <h2 className="text-md font-bold text-white mb-2">Pro plans</h2>
          {proPlans.map(plan => (
            <PlanItem
              key={plan.id}
              {...plan}
              isCurrentPlan={plan.id === currentPlanId}
            />
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mb-4">
          <button onClick={() => setIsModalOpen(true)} className="flex justify-between items-center w-full p-4 text-left">
            <div>
              <h2 className="text-md font-bold text-white">Pause or Delete Membership</h2>
              <p className="text-sm text-white/60 mt-1">This is for when you want to take a break from the app. Your profile and connections will be saved, and no one will be able to view or message you while you're away.</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/60 flex-shrink-0">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <PauseDeleteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}