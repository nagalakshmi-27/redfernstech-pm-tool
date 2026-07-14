import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  validateEmail,
  validatePassword,
} from "../../utils/validation";

export default function Signup() {
  const navigate = useNavigate();

  const [accountName, setAccountName] = useState("");

const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (
  !accountName ||
  !firstName ||
  !lastName ||
  !email ||
  !password ||
  !confirmPassword
) {
  setError("Please fill all fields");
  return;
}

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
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

    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            role: "team_mate",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      alert("Account created successfully! Please sign in.");
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">

      <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 text-white">
          Create Account
        </h1>

        <p className="text-center text-sm sm:text-base text-slate-400 mb-8">
          Sign up to get started
        </p>

        <form
          onSubmit={handleSignup}
          className="space-y-4 sm:space-y-5"
        >

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          <input
  type="text"
  placeholder="Account Name"
  value={accountName}
  onChange={(e) => setAccountName(e.target.value)}
  className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
/>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />

            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <input
            type="email"
            placeholder="User Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />

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
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {showPasswordRules && (
            <div className="text-xs sm:text-sm space-y-1">

              <p
                className={
                  passwordChecks.length
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {passwordChecks.length ? "✓" : "✗"} At least 8 characters
              </p>

              <p
                className={
                  passwordChecks.uppercase
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {passwordChecks.uppercase ? "✓" : "✗"} One uppercase letter
              </p>

              <p
                className={
                  passwordChecks.lowercase
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {passwordChecks.lowercase ? "✓" : "✗"} One lowercase letter
              </p>

              <p
                className={
                  passwordChecks.number
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {passwordChecks.number ? "✓" : "✗"} One number
              </p>

              <p
                className={
                  passwordChecks.special
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
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
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
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
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 sm:py-3.5 rounded-lg font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
          >
            Sign Up
          </button>

        </form>

        <p className="text-center mt-6 text-slate-400 text-sm sm:text-base">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-cyan-400 font-semibold hover:text-cyan-300 transition"
          >
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}