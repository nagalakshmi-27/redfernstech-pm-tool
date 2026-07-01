import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [inviteDetails, setInviteDetails] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [wrongAccount, setWrongAccount] = useState(false);

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
    const tokenStr = localStorage.getItem("token");
    if (!tokenStr) {
      // Not logged in! Redirect them to signup where the backend will automatically accept the invite during registration
      navigate("/signup");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/invite/accept`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        setMessage("Invite accepted! You are now part of the team.");
        setTimeout(() => navigate("/"), 3000);
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to accept invite.");
        if (response.status === 403) {
          setWrongAccount(true);
        }
      }
    } catch {
      setError("Failed to connect to server.");
    }
  };

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4 py-6">
  <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center text-red-400">
    <p className="leading-relaxed">{error}</p>
    {wrongAccount && (
      <button 
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("userEmail");
          window.location.reload();
        }}
        className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-semibold transition-all border border-white/10"
      >
        Switch Accounts
      </button>
    )}
  </div>
</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Team Invitation</h2>
        {message ? (
          <p className="text-green-400 font-medium">{message}</p>
        ) : inviteDetails ? (
          <div>
            <p className="text-sm sm:text-base text-slate-400 mb-6 leading-relaxed">
              You have been invited to join the team as a <strong>{inviteDetails.role}</strong> in the <strong>{inviteDetails.department}</strong> department.
            </p>
            <button 
              onClick={handleAccept}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] text-white p-3 rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              Accept Invitation
            </button>
          </div>
        ) : (
          <p>Loading invite details...</p>
        )}
      </div>
    </div>
  );
}