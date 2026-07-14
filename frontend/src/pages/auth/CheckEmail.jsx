import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

export default function CheckEmail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        <div className="flex justify-center mb-6">
          <div className="bg-cyan-500/20 p-4 rounded-full">
            <Mail className="w-10 h-10 text-cyan-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white">
          Check Your Email
        </h1>

        <p className="text-center text-slate-400 mt-4 leading-7">
          We've sent a verification link to your email address.
          <br />
          Please verify your account before signing in.
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-8 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}