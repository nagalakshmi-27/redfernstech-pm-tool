import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, useContext } from "react";
import AppContext from "../../context/AppContext";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchWorkspaces, fetchCurrentUser } = useContext(AppContext);
  const { temp_token, email, device_id } = location.state || {};
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!temp_token) {
      navigate("/");
    }
  }, [temp_token, navigate]);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const handleChange = (value, index) => {
  // Allow only numbers
  if (!/^\d?$/.test(value)) return;

  const updatedOtp = [...otp];
  updatedOtp[index] = value;
  setOtp(updatedOtp);

  // Move to next input automatically
  if (value && index < 5) {
    inputRefs.current[index + 1].focus();
  }
};

const handleKeyDown = (e, index) => {
  if (e.key === "Backspace") {
    if (!otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  }

  // Verify OTP when Enter is pressed
  if (e.key === "Enter" && isOtpComplete && !loading) {
    handleVerifyOTP();
  }
};

const handlePaste = (e) => {
  e.preventDefault();

  const pastedData = e.clipboardData.getData("text").trim();

  // Allow only exactly 6 digits
  if (!/^\d{6}$/.test(pastedData)) return;

  const newOtp = pastedData.split("");
  setOtp(newOtp);

  // Focus last input
  inputRefs.current[5]?.focus();
};

useEffect(() => {
  if (timeLeft <= 0) return;

  const timer = setInterval(() => {
    setTimeLeft((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [timeLeft]);
const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
const seconds = String(timeLeft % 60).padStart(2, "0");
const isOtpComplete = otp.every((digit) => digit !== "");

const handleVerifyOTP = async () => {
    setLoading(true);
    setError("");
    const otpCode = otp.join("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token, otp_code: otpCode, device_id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Verification failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userId", data.user.id);
      
      if (data.user.profile_image) {
        const backendHost = import.meta.env.VITE_API_URL.replace("/api", "").replace(/\/$/, "");
        localStorage.setItem("profileImage", `${backendHost}${data.user.profile_image}`);
      } else {
        localStorage.removeItem("profileImage");
      }

      const workspaceRes = await fetch(
  `${import.meta.env.VITE_API_URL}/workspaces/`,
  {
    headers: {
      Authorization: `Bearer ${data.access_token}`,
    },
  }
);

if (workspaceRes.ok) {
  const workspaces = await workspaceRes.json();
  
  await fetchCurrentUser();
  await fetchWorkspaces();

  if (workspaces.length === 0) {
    if (data.user?.is_owner) {
      navigate("/organization");
    } else {
      navigate("/workspace-pending");
    }
  } else {
    navigate("/dashboard");
  }
} else {
  navigate("/dashboard");
}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        <h1 className="text-3xl font-bold text-center text-white">
          Verify OTP
        </h1>

        <p className="text-center text-slate-400 mt-4">
          Enter the 6-digit verification code sent to {email ? <strong className="text-cyan-400">{email}</strong> : "your email"}.
        </p>

        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-3 mt-8">
  {otp.map((digit, index) => (
    <input
  key={index}
  ref={(el) => (inputRefs.current[index] = el)}
  type="text"
  value={digit}
  maxLength={1}
  onChange={(e) => handleChange(e.target.value, index)}
  onKeyDown={(e) => handleKeyDown(e, index)}
  onPaste={index === 0 ? handlePaste : undefined}
  className="w-12 h-14 bg-black/20 border border-white/10 rounded-lg text-center text-2xl text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
/>
  ))}
</div>

        <div className="mt-6 text-center text-cyan-400 font-semibold text-lg">
  {minutes}:{seconds}
</div>

        <button
  disabled={!isOtpComplete || loading}
  onClick={handleVerifyOTP}
  className={`w-full mt-8 py-3 rounded-lg font-semibold transition-all ${
    isOtpComplete && !loading
      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
      : "bg-slate-700 text-slate-500 cursor-not-allowed"
  }`}
>
  {loading ? "Verifying..." : "Verify OTP"}
</button>

        <button
  disabled={timeLeft > 0}
  className={`w-full mt-4 py-3 rounded-lg transition ${
    timeLeft > 0
      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
      : "border border-slate-600 text-slate-300 hover:bg-slate-800"
  }`}
>
  Resend OTP
</button>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-4 text-cyan-400 hover:text-cyan-300 transition"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}