import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { Eye, EyeOff } from "lucide-react";
import AppContext from "../../context/AppContext";

export default function Login() {
  const navigate = useNavigate();
  const { fetchWorkspaces } = useContext(AppContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] =
  useState(false);

  const handleLogin = async (e) => { // <-- We added "async" here!
    e.preventDefault();
    if (!username || !password) {
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
      // 1. Manage Device ID
      let device_id = localStorage.getItem("device_id");
      if (!device_id) {
        device_id = 'device-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
        localStorage.setItem("device_id", device_id);
      }

      // 2. Send the data to your backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password, device_id: device_id })
      });

      // 3. Check if the backend rejected the login
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      // 4. Get the response
      const data = await response.json();
      console.log("Login Success");
console.log(data);
      // 5. Check if we got a temporary token (OTP needed)
      if (data.temp_token) {
        console.log("OTP Required");
        navigate("/verify-otp", {
          state: {
            temp_token: data.temp_token,
            device_id: device_id,
          },
        });
        return;
      }
      console.log("Known Device Login");

      // 6. Save the real token securely! (Known device)
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

      // 7. Check if there's a redirect pending
const searchParams = new URLSearchParams(window.location.search);
const redirect = searchParams.get("redirect");

if (redirect === "accept-invite") {
  const inviteToken = searchParams.get("token");
  navigate(`/accept-invite?token=${inviteToken}`);
} else {
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

    console.log("Workspaces:", workspaces);
    console.log("Length:", workspaces.length);

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
}
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-white">
          Welcome Back
        </h1>

        <p className="text-center text-sm sm:text-base text-slate-400 mb-8">
          Sign in to your account to continue
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium text-slate-300">
              User-Name
            </label>

            <input
              type="text"
              placeholder="Enter your User-Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-slate-300">
              Password
            </label>

            <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Enter your password"
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
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
          >
            Sign In
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-cyan-400 font-semibold hover:text-cyan-300 transition"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}