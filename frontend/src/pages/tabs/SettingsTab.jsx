import { authAPI, userAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

const SettingItem = ({ title, value, onClick, isDestructive = false, isButton = false, disabled = false }) => (
  <div
    onClick={!disabled ? onClick : null}
    className={`flex justify-between items-center py-3.5 ${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex-1">
      <p className={`text-base font-medium ${isDestructive ? "text-red-400" : "text-white"}`}>{title}</p>
      {value && <p className="text-sm text-white/60 mt-0.5">{value}</p>}
    </div>
    {onClick && !isDestructive && (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/60">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

const SettingsGroup = ({ title, children }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-2xl mb-4 border border-white/20 overflow-hidden">
    {title && <h3 className="text-sm font-semibold text-white/50 px-4 pt-4 pb-2">{title}</h3>}
    <div className="px-4 pb-2 divide-y divide-white/10">
      {children}
    </div>
  </div>
);

export default function SettingsTab() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Wrap fetchUserInfo in useCallback to keep its reference stable
  const fetchUserInfo = useCallback(async () => {
    setError("");
    try {
      const userData = await userAPI.getProfile();
      setUserInfo(userData);
    } catch (err) {
      setError("Failed to fetch user data. Please try again.");
    } finally {
      // Only show the main loading spinner on the first load
      if (loading) {
        setLoading(false);
      }
    }
  }, [loading]);

  // This effect runs once on initial mount
  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  // This effect adds a listener to re-fetch data when the window is focused
  useEffect(() => {
    // When the user navigates back to this tab, it will re-fetch the data
    window.addEventListener('focus', fetchUserInfo);

    // Cleanup function to remove the listener
    return () => {
      window.removeEventListener('focus', fetchUserInfo);
    };
  }, [fetchUserInfo]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate("/login");
    } catch (err) {
      setError("Failed to logout. Please try again.");
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await authAPI.deleteAccount();
      authAPI.logout();
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    navigate("/home", { state: { selectedTab: "profile" } });
  };

  const formatAgePreference = (intent) => {
    if (!intent || !intent.preferredAgeRange || intent.preferredAgeRange.length < 2) {
      return "Not set";
    }
    const [min, max] = intent.preferredAgeRange;
    return `${min}-${max} years`;
  };

  const formatInterestedIn = (intent) => {
    if (!intent || !intent.interestedGender) {
      return "Not set";
    }
    return intent.interestedGender;
  };

  const formatAccountPrivacy = (user) => {
    if (!user) return "Public"; // Default value
    return user.isPrivate ? "Private" : "Public";
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen relative"
        style={{
          backgroundImage: "url('/bgs/faceverifybg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <p className="relative z-10 text-white">Loading settings...</p>
      </div>
    );
  }

  if (error && !userInfo) {
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
        <div className="relative z-10">
          <div className="p-6 pt-12">
            <div className="flex items-center justify-between mb-6">
              <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex-1 text-center text-xl font-semibold text-white">Settings</div>
              <div style={{ width: 40 }}></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-20 px-4 text-center text-red-400">
            {error}
          </div>
        </div>
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
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="p-6 pt-12">
          <div className="flex items-center justify-between mb-6">
            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex-1 text-center text-xl font-semibold text-white">
              Settings
            </div>
            <div style={{ width: 40 }}></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 px-4">
          {error && <div className="text-red-400 text-center mb-4 bg-red-900/20 backdrop-blur-sm rounded-xl p-3 border border-red-500/30">{error}</div>}

          <SettingsGroup title="Preferences">
            <SettingItem
              title="Age preference"
              value={formatAgePreference(userInfo?.intent)}
              onClick={() => navigate("/settings/age-preference")}
            />
            <SettingItem
              title="Interested in"
              value={formatInterestedIn(userInfo?.intent)}
              onClick={() => navigate("/settings/gender-preference")}
            />
          </SettingsGroup>

          <SettingsGroup title="Account Details">
            <SettingItem title="Direct Requests" value="2" onClick={() => navigate('/settings/direct-requests')} />
            <SettingItem title="Direct Personal Image" value="3/month" onClick={() => navigate('/settings/personal-image')} />
            <SettingItem title="Email address" value={userInfo?.email || "Not set"} />
            <SettingItem
              title="Account privacy"
              value={formatAccountPrivacy(userInfo)}
              onClick={() => navigate("/settings/account-privacy")}
            />
            <SettingItem
              title="Blocked"
              value="05"
              onClick={() => navigate("/settings/blocked-accounts")}
            />
          </SettingsGroup>

          <SettingsGroup title="Manage subscription">
            <SettingItem
              title="Membership"
              value="Monthly"
              onClick={() => navigate("/settings/membership")}
            />
            <SettingItem
              title="App and media"
              value="Device permissions"
              onClick={() => navigate("/settings/device-permissions")}
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingItem title="Email us" onClick={() => window.location.href = 'mailto:support@sundate.app'} />
            <SettingItem title="Terms & Conditions" onClick={() => navigate("/terms")} />
            <SettingItem title="Privacy Policy" onClick={() => navigate("/privacy")} />
            <SettingItem
              title="Logout"
              onClick={handleLogout}
              isDestructive={true}
              isButton={true}
            />
          </SettingsGroup>
        </div>
      </div>
    </div>
  );
}