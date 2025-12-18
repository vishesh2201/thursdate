import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../../utils/api";

const CARD_GLASS_ACTIVE =
  "bg-white/20 backdrop-blur-lg border border-white/30 text-white shadow-xl";
const BUTTON_GLASS_ACTIVE_SOLID =
  "bg-white text-black text-base font-medium border border-white/40 shadow-lg transition duration-200 hover:bg-gray-100";
const INPUT_GLASS =
  "w-full p-4 rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/20 placeholder-white/60 focus:ring-1 focus:ring-white focus:border-white transition";
const CARD_BODY_INACTIVE = "text-white/80";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Register user with the backend
      await authAPI.register(email, password);

      // Navigate to user info to start onboarding
      navigate("/user-info");
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center relative px-6">
      <div
        className="absolute inset-0 bg-black/40 z-0"
        style={{
          backgroundImage: `url('/bgs/bg-verification.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
        }}
      ></div>

      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <div className="absolute top-10 w-full text-center text-white text-2xl font-semibold z-10">
        Sundate
      </div>

      <div
        className={`relative z-10 w-full max-w-sm p-6 pt-10 pb-8 rounded-3xl ${CARD_GLASS_ACTIVE} flex flex-col items-center mt-28`}
      >
        <form className="w-full space-y-4" onSubmit={handleSignup}>
          <h2 className="text-white text-2xl font-bold mb-6 text-center">
            Sign Up
          </h2>

          <input
            type="email"
            placeholder="Email"
            className={INPUT_GLASS}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className={INPUT_GLASS}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="text-red-300 text-sm">{error}</div>}

          <button
            type="submit"
            className={BUTTON_GLASS_ACTIVE_SOLID + " w-full py-4 rounded-xl mt-6"}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <div className="pt-4 text-center text-sm">
            <span className={CARD_BODY_INACTIVE}>Already have an account?</span>
            <Link
              to="/login"
              className="text-white font-medium hover:text-white/80 transition ml-1"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
