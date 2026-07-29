import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  // This automatically grabs "?token=..." from the URL!
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const passwordChecks = {
  length: newPassword.length >= 8,
  uppercase: /[A-Z]/.test(newPassword),
  lowercase: /[a-z]/.test(newPassword),
  number: /\d/.test(newPassword),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
}; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if (!passwordRegex.test(newPassword)) {
  setShowPasswordRules(true);
  setError("");
  return;
}

if (newPassword !== confirmPassword) {
  setError("Passwords do not match");
  return;
}

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, new_password: newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to reset password");
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userId", data.user.id);
      }

      setMessage("Password successfully set! Logging you in...");
      
      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    }
  };

  // If someone tries to visit the page without a token from an email, block them!
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4 py-6">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] text-slate-200">
          <h2 className="text-red-400 font-bold mb-4 text-center text-xl sm:text-2xl">Invalid Link</h2>
          <p className="text-slate-400">No secure reset token found. Please use the exact link sent to your email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-white">Reset Password</h1>
        <p className="text-center text-sm sm:text-base text-slate-400 mb-8">Enter your new secure password below</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg">{error}</div>}
          {message && <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-lg">{message}</div>}

          <div className="relative">
  <input
    type={showNewPassword ? "text" : "password"}
    placeholder="New Password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg pr-12 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
    required
  />

  <button
    type="button"
    onClick={() => setShowNewPassword(!showNewPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
  >
    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

          {showPasswordRules && (
  <div className="text-xs sm:text-sm space-y-1">
    <p className={passwordChecks.length ? "text-green-400" : "text-red-400"}>
      {passwordChecks.length ? "✓" : "✗"} At least 8 characters
    </p>

    <p className={passwordChecks.uppercase ? "text-green-400" : "text-red-400"}>
      {passwordChecks.uppercase ? "✓" : "✗"} One uppercase letter
    </p>

    <p className={passwordChecks.lowercase ? "text-green-400" : "text-red-400"}>
      {passwordChecks.lowercase ? "✓" : "✗"} One lowercase letter
    </p>

    <p className={passwordChecks.number ? "text-green-400" : "text-red-400"}>
      {passwordChecks.number ? "✓" : "✗"} One number
    </p>

    <p className={passwordChecks.special ? "text-green-400" : "text-red-400"}>
      {passwordChecks.special ? "✓" : "✗"} One special character
    </p>
  </div>
)}

          <div className="relative">
  <input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm New Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg pr-12 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
    required
  />

  <button
    type="button"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
  >
    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

          <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            Update Password
          </button>
        </form>

        <p className="text-center mt-6">
          <Link to="/" className="text-cyan-400 font-semibold hover:text-cyan-300 transition">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}