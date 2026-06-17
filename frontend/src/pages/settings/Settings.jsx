import { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";

export default function Settings() {
  // Profile States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

  // Security (Password) States that were missing!
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordValidation, setShowPasswordValidation] =
  useState(false);

  // 1. Load the user's data when the page opens
  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/users/me", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (response.ok) {
          const data = await response.json();
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setRole(data.role || "");
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };
    fetchMyData();
  }, []);

  // 2. Save Profile Data
  const handleSave = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/users/me", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ full_name: fullName, role: role })
      });

      if (response.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (err) {
  console.error("Failed to save settings:", err);
  setMessage("Failed to save settings.");
}
  };


  // 3. Handle Password Change (Dummy function to prevent crashes)
  const handlePasswordChange = async () => {
    setShowPasswordValidation(true);
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match!");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long!");
      return;
    }
    
    try {
      const response = await fetch("http://127.0.0.1:8000/users/me/password", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ 
          current_password: currentPassword, 
          new_password: newPassword 
        })
      });
      if (response.ok) {
        setMessage("Password updated successfully!");
        setShowPasswordSection(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setMessage(""), 4000);
      } else {
        const errData = await response.json();
        setMessage(errData.detail || "Failed to update password.");
      }
    } catch (err) {
      setMessage("Failed to connect to backend.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "/";
  };

  const passwordChecks = {
  length: newPassword.length >= 8,
  uppercase: /[A-Z]/.test(newPassword),
  lowercase: /[a-z]/.test(newPassword),
  number: /\d/.test(newPassword),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
};

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        {message && (
  <div className={`p-3 rounded-lg ${message.toLowerCase().includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
    {message}
  </div>
)}

        <div>
          <label className="block font-medium mb-2">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full border p-3 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* Security Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Security</h2>

          {!showPasswordSection ? (
            <button
              onClick={() => setShowPasswordSection(true)}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
            >
              Change Password
            </button>
          ) : (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border p-3 rounded-lg"
              />

              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border p-3 rounded-lg"
              />
              {showPasswordValidation && (
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

              <div className="flex gap-3">
                <button
                  onClick={handlePasswordChange}
                  className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
                >
                  Update Password
                </button>
                <button
                  onClick={() => setShowPasswordSection(false)}
                  className="border bg-white px-5 py-3 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save/Logout Actions */}
        <div className="pt-6 flex gap-3">
          <button onClick={handleSave} className="bg-slate-900 text-white px-5 py-3 rounded-lg hover:bg-slate-800">
            Save Changes
          </button>
          <button onClick={handleLogout} className="border px-5 py-3 rounded-lg hover:bg-gray-50">
            Logout
          </button>
        </div>
      </div>
    </MainLayout>
  );
}