import { useState } from "react";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, new_password: newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to reset password");
      }

      setMessage("Password successfully reset! Redirecting to login...");
      
      // Send them back to Login after 3 seconds!
      setTimeout(() => navigate("/"), 3000);
      
    } catch (err) {
      setError(err.message);
    }
  };

  // If someone tries to visit the page without a token from an email, block them!
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-xl shadow-lg">
          <h2 className="text-red-500 font-bold mb-4 text-center text-2xl">Invalid Link</h2>
          <p className="text-gray-600">No secure reset token found. Please use the exact link sent to your email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-10 rounded-xl shadow-lg w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-center text-gray-500 mb-8">Enter your new secure password below</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg">{error}</div>}
          {message && <div className="bg-green-100 border border-green-300 text-green-700 p-3 rounded-lg">{message}</div>}

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
            required
          />

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300">
            Update Password
          </button>
        </form>

        <p className="text-center mt-6">
          <Link to="/" className="text-blue-600 font-semibold hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}