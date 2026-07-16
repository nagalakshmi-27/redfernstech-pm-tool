import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { validatePassword } from "../../utils/validation";

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [successUsername, setSuccessUsername] = useState("");

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      setShowPasswordRules(true);
      setError("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!token) {
      setError("Invalid or missing verification token");
      return;
    }

    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to set password");
      }
      
      const data = await response.json();
      setSuccessUsername(data.username);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        <h1 className="text-3xl font-bold text-center text-white">
          {successUsername ? "Account Ready!" : "Set Password"}
        </h1>

        <p className="text-center text-sm text-slate-400 mt-2 mb-8">
          Create a password to activate your account.
        </p>

        {successUsername ? (
          <div className="text-center">
            <p className="text-lg text-slate-300 mb-6">
              Your account has been successfully created.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left inline-block w-full">
              <p className="text-sm text-slate-400 mb-1">Your unique User-Name is:</p>
              <p className="text-2xl font-bold text-cyan-400 select-all font-mono tracking-wide">{successUsername}</p>
              <p className="text-xs text-slate-500 mt-3">You will use this to log in instead of your email. Make sure to remember it!</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : (
        <form onSubmit={handleSetPassword} className="space-y-5">

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Password */}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg pr-12 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {showPasswordRules && (
            <div className="text-xs sm:text-sm space-y-1">

              <p className={passwordChecks.length ? "text-green-500" : "text-red-500"}>
                {passwordChecks.length ? "✓" : "✗"} At least 8 characters
              </p>

              <p className={passwordChecks.uppercase ? "text-green-500" : "text-red-500"}>
                {passwordChecks.uppercase ? "✓" : "✗"} One uppercase letter
              </p>

              <p className={passwordChecks.lowercase ? "text-green-500" : "text-red-500"}>
                {passwordChecks.lowercase ? "✓" : "✗"} One lowercase letter
              </p>

              <p className={passwordChecks.number ? "text-green-500" : "text-red-500"}>
                {passwordChecks.number ? "✓" : "✗"} One number
              </p>

              <p className={passwordChecks.special ? "text-green-500" : "text-red-500"}>
                {passwordChecks.special ? "✓" : "✗"} One special character
              </p>

            </div>
          )}

          {/* Confirm Password */}

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg pr-12 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
          >
            Create Password
          </button>
        </form>
        )}
      </div>
    </div>
  );
}