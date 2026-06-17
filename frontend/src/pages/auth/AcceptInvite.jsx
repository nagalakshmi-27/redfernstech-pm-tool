import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [inviteDetails, setInviteDetails] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/users/invite/${token}`);
        if (response.ok) {
          const data = await response.json();
          setInviteDetails(data);
        } else {
          setError("This invite link is invalid or has already been used.");
        }
      } catch (err) {
        setError("Failed to connect to the server.");
      }
    };
    if (token) fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/users/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        setMessage("Invite accepted! You are now part of the team.");
        setTimeout(() => navigate("/"), 3000);
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to accept invite.");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    }
  };

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="bg-white p-8 rounded-xl shadow-lg text-center text-red-600">{error}</div></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Team Invitation</h2>
        {message ? (
          <p className="text-green-600 font-medium">{message}</p>
        ) : inviteDetails ? (
          <div>
            <p className="text-gray-600 mb-6">
              You have been invited to join the team as a <strong>{inviteDetails.role}</strong> in the <strong>{inviteDetails.department}</strong> department.
            </p>
            <button 
              onClick={handleAccept}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700"
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