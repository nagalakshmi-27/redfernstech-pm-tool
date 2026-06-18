import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] =
  useState(false);

  const handleLogin = async (e) => { // <-- We added "async" here!
    e.preventDefault();
    if (!email || !password) {
  alert("Please fill all fields");
  return;
}
const passwordChecks = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
};

const isPasswordValid =
  passwordChecks.length &&
  passwordChecks.uppercase &&
  passwordChecks.lowercase &&
  passwordChecks.number &&
  passwordChecks.special;

if (!isPasswordValid) {
  setShowPasswordRules(true);
  return;
}
    
    try {
      // 1. Send the data to your backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      });
      // 2. Check if the backend rejected the login
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }
      // 3. Get the JWT token from the backend
      const data = await response.json();
      console.log(data);
      
      // 4. Save the real token securely!
      localStorage.setItem("token", data.access_token);
localStorage.setItem("isLoggedIn", "true");
localStorage.setItem("userEmail", data.user.email);
localStorage.setItem("userId", data.user.id);
      // 5. Go to the dashboard
      navigate("/dashboard");
      
    } catch (err) {
      alert(err.message); // This will show "Incorrect email or password" if they guess wrong
    }
  };

  const passwordChecks = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-10 rounded-xl shadow-lg w-[450px]">
        <h1 className="text-4xl font-bold text-center mb-2">
          Welcome Back
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Sign in to your account to continue
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded-lg"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Password
            </label>

            <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Enter your password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full border p-3 rounded-lg pr-12"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

{showPasswordRules && (
  <div className="mt-2 text-sm space-y-1">
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
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-blue-600"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            Sign In
          </button>
        </form>

        <p className="text-center mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 font-semibold"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}