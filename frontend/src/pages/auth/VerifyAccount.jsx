import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function VerifyAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        
        if (response.ok) {
          setStatus("success");
          setTimeout(() => navigate("/"), 3000);
        } else {
          setStatus("error");
        }
      } catch (err) {
        setStatus("error");
      }
    };
    
    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center">
        
        {status === "verifying" && (
          <>
            <h1 className="text-3xl font-bold text-white mb-4">Verifying Account...</h1>
            <p className="text-slate-400">Please wait while we verify your email address.</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <h1 className="text-3xl font-bold text-green-400 mb-4">Account Verified!</h1>
            <p className="text-slate-400">Your account has been successfully activated. Redirecting to login...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Verification Failed</h1>
            <p className="text-slate-400 mb-8">The verification link is invalid or has expired.</p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-semibold transition-all border border-white/10"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}