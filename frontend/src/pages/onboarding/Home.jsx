import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HomeTab from "../tabs/HomeTab";
import ExploreTab from "../tabs/ExploreTab";
import MessagesTab from "../tabs/MessagesTab";
import ProfileTab from "../tabs/ProfileTab";
import GameTab from "../tabs/GameTab";
import { userAPI } from "../../utils/api";

const navOptions = [
  { key: "matches", label: "Matches", icon: "/matches-icon.svg" },
  { key: "game", label: "Game", icon: "/game-icon.svg" },
  { key: "discover", label: "Discover", icon: "/discover-icon.svg" },
  { key: "chats", label: "Chats", icon: "/chats-icon.svg" },
  { key: "profile", label: "Profile", icon: "/profile-icon.svg" },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location object

  // The default selected tab is 'matches'
  const [selected, setSelected] = useState("matches");

  // EFFECT 1: Check if the user is approved to view this page
  useEffect(() => {
    const checkApproval = async () => {
      try {
        const userData = await userAPI.getProfile();
        if (userData && !userData.approval) {
          navigate("/waitlist-status", { replace: true });
        }
      } catch (err) {
        console.error("Failed to check approval status:", err);
        // Optional: navigate to login if profile fetch fails
        // navigate('/login');
      }
    };
    checkApproval();
  }, [navigate]);

  // EFFECT 2: Check if another page has told us which tab to select
  useEffect(() => {
    // If we navigated here with a `selectedTab` in the state, update our selection
    if (location.state?.selectedTab) {
      setSelected(location.state.selectedTab);
    }
  }, [location.state]);


  const handleBack = () => {
    navigate(-1);
  };

  // Switch statement to determine which component to show based on the selected tab
  let ContentComponent;
  switch (selected) {
    case "matches":
      ContentComponent = HomeTab;
      break;
    case "game":
      ContentComponent = GameTab;
      break;
    case "discover":
      ContentComponent = ExploreTab;
      break;
    case "chats":
      ContentComponent = MessagesTab;
      break;
    case "profile":
      ContentComponent = ProfileTab;
      break;
    default:
      ContentComponent = HomeTab;
  }

  return (
    <div className="h-screen flex flex-col bg-white font-sans">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleBack} className="w-6 h-6 flex items-center justify-center">
            <img src="/backarrow.svg" alt="Back" width={24} height={24} />
          </button>
          <div className="text-gray-400 text-[14px] font-semibold mx-auto">
            ThursDate.
          </div>
          <div style={{ width: 24 }}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4">
        <ContentComponent />
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm flex justify-around items-center h-16">
        {navOptions.map(opt => {
          const isActive = selected === opt.key;
          return (
            <button
              key={opt.key}
              className={`flex-1 flex flex-col items-center justify-center transition-all focus:outline-none ${
                isActive ? "text-black font-bold" : "text-gray-400 font-normal"
              }`}
              onClick={() => setSelected(opt.key)}
            >
              <img
                src={opt.icon}
                alt={opt.label}
                className="mb-1"
                style={{
                  filter: isActive
                    ? "invert(0%) brightness(0)"
                    : "invert(60%) brightness(1)",
                  width: 24,
                  height: 24,
                }}
              />
              <span className="text-xs mt-0.5">{opt.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}