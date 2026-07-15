import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [inviteDetails, setInviteDetails] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/invite/${token}`);
        if (response.ok) {
          const data = await response.json();
          setInviteDetails(data);
        } else {
          setError("This invite link is invalid or has already been used.");
        }
      } catch {
        setError("Failed to connect to the server.");
      }
    };
    if (token) fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!inviteDetails?.user_exists && (!password || password.length < 8)) {
      setError("Please enter a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, password: password })
      });

      if (response.ok) {
        const data = await response.json();
        
        let device_id = localStorage.getItem("device_id");
        if (!device_id) {
          device_id = 'device-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
          localStorage.setItem("device_id", device_id);
        }
        
        setMessage("Invite accepted! Redirecting to verify your login...");
        setTimeout(() => navigate("/verify-otp", { state: { temp_token: data.temp_token, email: inviteDetails?.email, device_id } }), 2000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || "Failed to accept invite.");
      }
    } catch {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/invite/${token}/decline`, {
        method: "POST",
      });

      if (response.ok) {
        setMessage("You have declined the invitation.");
        setTimeout(() => navigate("/"), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || "Failed to decline invite.");
      }
    } catch {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4 py-6">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center text-red-400">
          <p className="leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-semibold transition-all border border-white/10"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Team Invitation</h2>
        {message ? (
          <p className="text-cyan-400 font-medium text-lg mt-4">{message}</p>
        ) : inviteDetails ? (
          <div>
            <p className="text-sm sm:text-base text-slate-400 mb-8 leading-relaxed">
              You have been invited to join the team as a <strong>{inviteDetails.role}</strong> in the <strong>{inviteDetails.department}</strong> workspace.
            </p>
            
            <div className="flex flex-col gap-4">
              {inviteDetails.user_exists ? (
                <div className="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                  <p>You already have a RedFlow account. Click below to accept the invitation.</p>
                </div>
              ) : (
                <div className="relative text-left">
                  <label className="block mb-2 font-medium text-slate-300">Set Your Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a secure password"
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
                </div>
              )}

              <button 
                onClick={handleAccept}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white p-3 rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {inviteDetails.user_exists ? "Accept Invitation" : "Accept Invitation & Sign In"}
              </button>
              
              <button 
                onClick={handleDecline}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 p-3 rounded-lg font-semibold transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
                Decline
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-8 text-cyan-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        )}
      </div>
    </div>
  );
}