import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HomeTab from "../tabs/HomeTab";
import ExploreTab from "../tabs/ExploreTab";
import MessagesTab from "../tabs/MessagesTab";
import ProfileTab from "../tabs/ProfileTab";
import GameTab from "../tabs/GameTab";
import { userAPI } from "../../utils/api";
import socketService from "../../utils/socket";

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

  // EFFECT 2: Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    return () => {
      // Don't disconnect on unmount, keep socket alive
      // socketService.disconnect();
    };
  }, []);

  // EFFECT 3: Check if another page has told us which tab to select
  useEffect(() => {
    // If we navigated here with a `selectedTab` in the state, update our selection
    if (location.state?.selectedTab) {
      setSelected(location.state.selectedTab);
    }
  }, [location.state]);

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
    <div className="h-screen flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-hidden pb-28">
        <ContentComponent />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/30 shadow-lg flex justify-around items-center h-24 px-2 rounded-t-3xl">
        {navOptions.map(opt => {
          const isActive = selected === opt.key;
          return (
            <button
              key={opt.key}
              className={`flex-1 flex flex-col items-center justify-center transition-all focus:outline-none px-2 py-2 rounded-2xl max-w-[80px] ${isActive ? "bg-white/40 backdrop-blur-md" : ""
                }`}
              onClick={() => setSelected(opt.key)}
            >
              <img
                src={opt.icon}
                alt={opt.label}
                className="mb-1"
                style={{
                  filter: isActive
                    ? "brightness(0) saturate(100%) invert(85%) sepia(45%) saturate(480%) hue-rotate(358deg) brightness(100%) contrast(92%)"
                    : "brightness(0) invert(1)",
                  width: 24,
                  height: 24,
                }}
              />
              <span className={`text-xs mt-0.5 ${isActive ? "font-semibold" : "font-normal"}`} style={{ color: isActive ? "#F5CA72" : "white" }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}