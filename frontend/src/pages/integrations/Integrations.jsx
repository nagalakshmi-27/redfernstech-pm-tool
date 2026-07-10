import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import MainLayout from "../../layouts/MainLayout";
import AppContext from "../../context/AppContext";
import { Plug, Settings2, GitBranch, Hash, Calendar, MessageSquare, Check, X } from "lucide-react";

export default function Integrations() {
  const { activeWorkspaceId, workspaces } = useContext(AppContext);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  
  const [configuringApp, setConfiguringApp] = useState(null);
  const [configValues, setConfigValues] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);
  
  const currentUserId = Number(localStorage.getItem("userId"));
  const activeWorkspace = workspaces?.find(w => w.id === Number(activeWorkspaceId));
  const isOwner = activeWorkspace?.owner_id === currentUserId;

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchIntegrations();
    }
  }, [activeWorkspaceId]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${activeWorkspaceId}/integrations`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (err) {
      console.error("Failed to fetch integrations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider) => {
    if (!isOwner) return;
    setConnecting(provider);
    
    if (provider === "google_calendar") {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${activeWorkspaceId}/integrations/google/auth-url`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (response.ok) {
          const data = await response.json();
          window.location.href = data.auth_url;
          return;
        }
      } catch (err) {
        console.error("Failed to get Google Auth URL", err);
      }
      setConnecting(null);
      return;
    }
    
    // Simulated instant connection for V1
    const dummyToken = `simulated_token_${Math.random().toString(36).substring(7)}`;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${activeWorkspaceId}/integrations/connect/${provider}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: provider,
          access_token: dummyToken,
          config: { simulated: true }
        })
      });
      
      if (response.ok) {
        fetchIntegrations();
      }
    } catch (err) {
      console.error(`Failed to connect ${provider}`, err);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!isOwner) return;
    if (!window.confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${activeWorkspaceId}/integrations/${provider}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      if (response.ok) {
        fetchIntegrations();
      }
    } catch (err) {
      console.error(`Failed to disconnect ${provider}`, err);
    }
  };

  const openConfigModal = (app) => {
    const existingIntegration = integrations.find(i => i.provider === app.provider);
    setConfigValues(existingIntegration?.config || {});
    setConfiguringApp(app);
  };

  const handleSaveConfig = async () => {
    if (!configuringApp) return;
    setSavingConfig(true);
    
    const existingIntegration = integrations.find(i => i.provider === configuringApp.provider);
    if (!existingIntegration) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${activeWorkspaceId}/integrations/connect/${configuringApp.provider}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: configuringApp.provider,
          access_token: existingIntegration.access_token,
          refresh_token: existingIntegration.refresh_token,
          config: { ...existingIntegration.config, ...configValues }
        })
      });
      
      if (response.ok) {
        await fetchIntegrations();
        setConfiguringApp(null);
      }
    } catch (err) {
      console.error(`Failed to save config for ${configuringApp.provider}`, err);
    } finally {
      setSavingConfig(false);
    }
  };

  const apps = [
    {
      provider: "github",
      name: "GitHub",
      description: "Link pull requests to tasks and automate status updates on merges.",
      icon: <GitBranch size={32} className="text-white" />,
      color: "from-slate-700 to-slate-900",
      accent: "border-slate-500",
      configFields: [
        { key: "default_repo", label: "Default Repository (e.g. org/repo)", placeholder: "redfernstech/pm-tool" }
      ]
    },
    {
      provider: "slack",
      name: "Slack",
      description: "Receive project notifications and create tasks directly from chat.",
      icon: <Hash size={32} className="text-pink-400" />,
      color: "from-[#4A154B]/80 to-[#36C5F0]/20",
      accent: "border-pink-500",
      configFields: [
        { key: "default_channel", label: "Default Channel", placeholder: "#general" }
      ]
    },
    {
      provider: "msteams",
      name: "Microsoft Teams",
      description: "Sync project updates to your Teams channels instantly.",
      icon: <MessageSquare size={32} className="text-blue-400" />,
      color: "from-blue-900/50 to-indigo-900/50",
      accent: "border-blue-500",
      configFields: [
        { key: "default_channel", label: "Default Channel", placeholder: "General" }
      ]
    },
    {
      provider: "google_calendar",
      name: "Google Calendar",
      description: "Sync task due dates and project deadlines to your calendar.",
      icon: <Calendar size={32} className="text-yellow-400" />,
      color: "from-yellow-900/30 to-red-900/30",
      accent: "border-yellow-500",
      configFields: [
        { key: "calendar_name", label: "Target Calendar", placeholder: "Work Calendar" }
      ]
    }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Plug className="text-cyan-400" />
            App Integrations
          </h1>
          <p className="text-slate-400">
            Connect your favorite tools to automate your project management workflow.
          </p>
        </div>
        
        {!isOwner && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-xl">
            Only workspace owners can configure app integrations.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apps.map((app) => {
            const isConnected = integrations.some(i => i.provider === app.provider && i.is_active);
            const isConnecting = connecting === app.provider;
            
            return (
              <div 
                key={app.provider} 
                className={`bg-gradient-to-br ${app.color} border ${isConnected ? app.accent : 'border-white/5'} backdrop-blur-md p-6 rounded-2xl shadow-xl transition-all duration-300 relative group`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                    {app.icon}
                  </div>
                  
                  {isConnected ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Check size={14} /> Connected
                      </span>
                      {isOwner && (
                        <button 
                          onClick={() => handleDisconnect(app.provider)}
                          className="bg-black/30 hover:bg-red-500/20 text-slate-300 hover:text-red-400 p-2 rounded-lg transition"
                          title="Disconnect"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {app.provider !== "google_calendar" && (
                        <span className="bg-slate-500/20 text-slate-400 border border-slate-500/30 px-3 py-1 rounded-full text-xs font-bold">
                          Coming Soon
                        </span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleConnect(app.provider)}
                          disabled={isConnecting}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
                        >
                          {isConnecting ? "Connecting..." : "Connect"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{app.name}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {app.description}
                </p>
                
                {isConnected && (
                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                    <button 
                      onClick={() => openConfigModal(app)}
                      className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition"
                    >
                      <Settings2 size={16} /> Configure defaults
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Config Modal */}
      {configuringApp && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#141a2d] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Settings2 className="text-cyan-400" size={20} />
              Configure {configuringApp.name}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Set workspace-wide default settings for this integration.
            </p>
            
            <div className="space-y-4 mb-6">
              {configuringApp.configFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={configValues[field.key] || ""}
                    onChange={(e) => setConfigValues({...configValues, [field.key]: e.target.value})}
                    placeholder={field.placeholder}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setConfiguringApp(null)}
                className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition disabled:opacity-50"
              >
                {savingConfig ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </MainLayout>
  );
}
