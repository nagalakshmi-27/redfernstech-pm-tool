import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  validateEmail,
  validatePassword,
} from "../../utils/validation";
export default function Signup() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const passwordChecks = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
};

  const handleSignup = async (e) => { // <-- We added "async" here!
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
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
      // 1. Send the data to your backend
      const response = await fetch("http://127.0.0.1:8000/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email, 
          password: password, 
          role: "team_mate" 
        })
      });
      // 2. Check if the backend rejected it (like if the email is already used)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }
      alert("Account created successfully! Please sign in.");
      navigate("/"); // Send them to the login page
      
    } catch (err) {
      setError(err.message); // This will show the error in your red UI box!
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-10 rounded-xl shadow-lg w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-2">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Sign up to get started
        </p>

        <form onSubmit={handleSignup} className="space-y-5">
          {error && (
  <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg">
    {error}
  </div>
)}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border p-3 rounded-lg"
            />

            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border p-3 rounded-lg"
            />
          </div>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full border p-3 rounded-lg"
/>

{showPasswordRules && (
  <div className="text-sm space-y-1">
    <p className={passwordChecks.length ? "text-green-600" : "text-red-600"}>
      {passwordChecks.length ? "✓" : "✗"} At least 8 characters
    </p>

    <p className={passwordChecks.uppercase ? "text-green-600" : "text-red-600"}>
      {passwordChecks.uppercase ? "✓" : "✗"} One uppercase letter
    </p>

    <p className={passwordChecks.lowercase ? "text-green-600" : "text-red-600"}>
      {passwordChecks.lowercase ? "✓" : "✗"} One lowercase letter
    </p>

    <p className={passwordChecks.number ? "text-green-600" : "text-red-600"}>
      {passwordChecks.number ? "✓" : "✗"} One number
    </p>

    <p className={passwordChecks.special ? "text-green-600" : "text-red-600"}>
      {passwordChecks.special ? "✓" : "✗"} One special character
    </p>
  </div>
)}

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center mt-6">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-blue-600 font-semibold"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}