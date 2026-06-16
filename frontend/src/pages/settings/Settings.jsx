import { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import { useState } from "react";

export default function Settings() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

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

  // 2. Save the data to the backend when the button is clicked
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
        setTimeout(() => setMessage(""), 3000); // Hide message after 3 seconds
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (err) {
      setMessage("Failed to save settings.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "/";
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        {message && <div className="p-3 bg-green-100 text-green-700 rounded-lg">{message}</div>}

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
          {/* We make Email read-only because you shouldn't change your login email here! */}
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
        <div className="mt-8">

  <h2 className="text-xl font-semibold mb-4">
    Security
  </h2>

  {!showPasswordSection ? (
    <button
      onClick={() =>
        setShowPasswordSection(true)
      }
      className="bg-blue-600 text-white px-5 py-3 rounded-lg"
    >
      Change Password
    </button>
  ) : (
    <div className="space-y-4">

      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) =>
          setCurrentPassword(e.target.value)
        }
        className="w-full border p-3 rounded-lg"
      />

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) =>
          setNewPassword(e.target.value)
        }
        className="w-full border p-3 rounded-lg"
      />

      <p className="text-sm text-gray-500">
        Password must contain at least
        8 characters, one number and
        one special character.
      </p>

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
        className="w-full border p-3 rounded-lg"
      />

      <div className="flex gap-3">

        <button
          onClick={handlePasswordChange}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg"
        >
          Update Password
        </button>

        <button
          onClick={() =>
            setShowPasswordSection(false)
          }
          className="border px-5 py-3 rounded-lg"
        >
          Cancel
        </button>

      </div>

    </div>
  )}

</div>

        <div className="pt-4 flex gap-3">
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