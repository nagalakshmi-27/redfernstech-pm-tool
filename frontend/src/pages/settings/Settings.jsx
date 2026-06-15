import MainLayout from "../../layouts/MainLayout";
import { useState } from "react";

export default function Settings() {
  const [fullName, setFullName] = useState("Nagalakshmi");
  const [email, setEmail] = useState("nagalakshmi@redferns.com");
  const [role, setRole] = useState("Frontend Developer");
  const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [showPasswordSection, setShowPasswordSection] =
  useState(false);
const handlePasswordChange = () => {
  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

  if (currentPassword !== "admin123") {
    alert("Current Password is incorrect");
    return;
  }

  if (!passwordRegex.test(newPassword)) {
    alert(
      "Password must be at least 8 characters and contain a number and special character"
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  alert("Password Updated Successfully");

  setCurrentPassword("");
  setNewPassword("");
  setConfirmPassword("");
};
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Settings
      </h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">

        <div>
          <label className="block font-medium mb-2">
            Full Name
          </label>
          <input
  type="text"
  value={fullName}
  onChange={(e) => setFullName(e.target.value)}
  className="w-full border p-3 rounded-lg"
/>
        </div>

        <div>
          <label className="block font-medium mb-2">
            Email
          </label>
          <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full border p-3 rounded-lg"
/>
        </div>

        <div>
          <label className="block font-medium mb-2">
            Role
          </label>
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

  <button
  onClick={() =>
    alert("Settings Saved Successfully")
  }
  className="bg-slate-900 text-white px-5 py-3 rounded-lg"
>
  Save Changes
</button>

  <button
  onClick={() => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/";
  }}
  className="border px-5 py-3 rounded-lg"
>
  Logout
</button>

</div>

      </div>
    </MainLayout>
  );
}