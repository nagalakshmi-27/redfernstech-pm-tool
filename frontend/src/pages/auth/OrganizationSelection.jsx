import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Search } from "lucide-react";
export default function OrganizationSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  // Later this will come from the Login page
  const organizations =
  location.state?.organizations || [
    {
      id: 1,
      name: "RedFerns Tech",
      username: "nagalakshmi_redferns",
      role: "Super Admin",
    },
    {
      id: 2,
      name: "ABC Solutions",
      username: "nagalakshmi_abc",
      role: "Member",
    },
    {
      id: 3,
      name: "InnovateX Pvt Ltd",
      username: "nagalakshmi_innovatex",
      role: "Admin",
    },
    {
      id: 4,
      name: "TechWave Systems",
      username: "nagalakshmi_techwave",
      role: "Client",
    },
  ];
  const [search, setSearch] = useState("");

  const filteredOrganizations = organizations.filter((org) =>
  org.name.toLowerCase().includes(search.toLowerCase()) ||
  org.username.toLowerCase().includes(search.toLowerCase())
);
  const handleContinue = (organization) => {
    console.log("Selected Organization:", organization);

    // Later this will call the backend API
    navigate("/dashboard");
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