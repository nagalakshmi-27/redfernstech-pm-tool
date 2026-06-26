import { Link } from "react-router-dom";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");
  const handleSubmit = async (e) => { // <-- Add async
    e.preventDefault();
    if (!email) {
  alert("Please enter your email");
  return;
}

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  alert("Please enter a valid email address");
  return;
}
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      });
      
      if (!response.ok) {
        throw new Error("Failed to process request");
      }
      
      setMessage("If that email exists, a reset link was sent to your inbox!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-white">
          Forgot Password?
        </h1>

        <p className="text-center text-sm sm:text-base text-slate-400 mb-8">
          Enter your email address and we'll send a reset link
        </p>
        {message && (
  <p className="text-green-400 text-center text-sm sm:text-base mb-4">
    {message}
  </p>
)}
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
  type="email"
  placeholder="Enter Email Address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
  required
/>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            Send Reset Link
          </button>
        </form>

        <p className="text-center mt-6">
          <Link
            to="/"
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}