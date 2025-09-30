import { useNavigate } from "react-router-dom";

export default function Gateway() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col justify-between items-center px-6 py-10 bg-white">
      {/* Centered logo and text */}
      <div className="flex flex-col items-center justify-center flex-1">
        <img src="/logogray.png" alt="ThursDate Logo" className="h-12 mb-4" />
        <p className="text-center text-[#767F89] text-xs max-w-xs">
          This is a members-only playground, and referrals are your golden ticket. No invite? No entry.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="w-full">
        <button
          onClick={() => navigate("/privacy")}
          className="w-full py-4 mb-3 rounded-xl bg-[#222222] text-white text-sm font-medium"
        >
          I want to join
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full py-4 rounded-xl border border-[#222222] bg-white text-[#222222] text-sm font-medium">
          I want to login
        </button>
      </div>
    </div>
  );
}
