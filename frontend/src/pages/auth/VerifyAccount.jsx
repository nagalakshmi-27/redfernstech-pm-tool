import { useNavigate, useSearchParams } from "react-router-dom";

export default function VerifyAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const handleVerify = () => {
  // Temporary frontend flow
  // Later this will call the Verify Account API
  navigate(`/set-password?token=${token}`);
};

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-200 px-4 py-6">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        <h1 className="text-3xl font-bold text-center text-white">
          Verify Your Account
        </h1>

        <p className="text-center text-slate-400 mt-4">
          Click the button below to verify your account and activate it.
        </p>

        <div className="mt-8 space-y-4">

          <button
            onClick={handleVerify}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
          >
            Verify
          </button>

          <button
            onClick={handleCancel}
            className="w-full border border-slate-600 text-slate-300 py-3 rounded-lg hover:bg-slate-800 transition"
          >
            Cancel
          </button>

        </div>

      </div>
    </div>
  );
}