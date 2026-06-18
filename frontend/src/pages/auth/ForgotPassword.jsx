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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-10 rounded-xl shadow-lg w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-2">
          Forgot Password?
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Enter your email address and we'll send a reset link
        </p>
        {message && <p className="text-green-600 text-center">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
  type="email"
  placeholder="Enter Email Address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full border p-3 rounded-lg"
  required
/>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            Send Reset Link
          </button>
        </form>

        <p className="text-center mt-6">
          <Link
            to="/"
            className="text-blue-600 font-semibold"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}