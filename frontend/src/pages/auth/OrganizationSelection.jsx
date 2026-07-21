import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import AppContext from "../../context/AppContext";
import { Search } from "lucide-react";
export default function OrganizationSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchWorkspaces, fetchCurrentUser } = useContext(AppContext);

  useEffect(() => {
    if (!location.state?.organizations || !location.state?.password) {
      navigate("/login");
    }
  }, [location, navigate]);

  const organizations = location.state?.organizations || [];
  const [search, setSearch] = useState("");

  const filteredOrganizations = organizations.filter((org) =>
  org.name.toLowerCase().includes(search.toLowerCase()) ||
  org.username.toLowerCase().includes(search.toLowerCase())
);
  const handleContinue = async (organization) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: organization.username,
          password: location.state?.password,
          device_id: location.state?.device_id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.temp_token) {
          navigate("/verify-otp", { state: { temp_token: data.temp_token, device_id: location.state?.device_id } });
          return;
        }

        // Save the real token securely! (Known device)
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

        if (location.state?.redirect === "accept-invite") {
          navigate(`/accept-invite?token=${location.state.inviteToken}`);
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
            await fetchCurrentUser();
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
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to login to this organization.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Network error. Please try again.");
    }
  };

  // If no organizations are received
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4">
      <div className="w-full max-w-2xl bg-slate-900/80 border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white text-center">
          Choose Organization
        </h1>

        <p className="text-slate-400 text-center mt-2 mb-8">
          Select the organization you want to continue with.
        </p>
        <div className="relative mb-6">
  <Search
    size={18}
    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
  />

  <input
  type="text"
  placeholder="Search organization..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
/>
</div>

        <div className="space-y-4">
          {filteredOrganizations.map((org) => (
            <div
              key={org.id}
              className="border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
            >
              <div>
                <h2 className="text-white font-semibold">{org.name}</h2>

                <p className="text-slate-400 text-sm">
                  Username: {org.username}
                </p>

                <div className="mt-2">
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium ${
      org.role === "Super Admin"
        ? "bg-purple-500/20 text-purple-300"
        : org.role === "Admin"
        ? "bg-blue-500/20 text-blue-300"
        : org.role === "Member"
        ? "bg-green-500/20 text-green-300"
        : "bg-yellow-500/20 text-yellow-300"
    }`}
  >
    {org.role}
  </span>
</div>
              </div>

              <button
                onClick={() => handleContinue(org)}
                className="bg-cyan-500 hover:bg-cyan-600 px-5 py-2 rounded-lg text-white"
              >
                Continue
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}