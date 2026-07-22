import { useState, useEffect, useRef } from "react";
import { Calendar, Sparkles, X, Download, Copy, FolderGit2 } from "lucide-react";

const SmartSummaryModal = ({ isOpen, onClose, workspaceId }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && workspaceId) {
      const fetchProjects = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/?workspace_id=${workspaceId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setProjects(data);
          }
        } catch (error) {
          console.error("Failed to fetch projects:", error);
        }
      };
      fetchProjects();
    }
  }, [isOpen, workspaceId]);

  const handleCopyToClipboard = async () => {
    if (!summary) return;
    try {
      let plainText = summary
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<h[1-6][^>]*>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<ul>/gi, '\n')
        .replace(/<\/ul>/gi, '')
        .replace(/<li>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '') // strip remaining tags
        .replace(/\n\s*\n\s*\n/g, '\n\n') // clean up excessive newlines
        .trim();
      
      if (navigator.clipboard && window.ClipboardItem) {
        const typeHtml = "text/html";
        const typeText = "text/plain";
        const blobHtml = new Blob([summary], { type: typeHtml });
        const blobText = new Blob([plainText], { type: typeText });
        const data = [new ClipboardItem({
            [typeHtml]: blobHtml,
            [typeText]: blobText
        })];
        await navigator.clipboard.write(data);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      alert("Summary copied to clipboard! You can now paste it in email, Slack, or chat.");
    } catch (err) {
      console.error("Failed to copy:", err);
      try {
        await navigator.clipboard.writeText(plainText);
        alert("Summary text copied to clipboard!");
      } catch (err2) {
        alert("Failed to copy to clipboard.");
      }
    }
  };

  const handleDownloadPdf = () => {
    if (!summary) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("Please allow pop-ups to download the PDF.");
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Catch Up Summary</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #000; padding: 2rem; max-width: 800px; margin: 0 auto; }
          h2 { color: #111; border-bottom: 2px solid #ddd; padding-bottom: 0.5rem; font-size: 24px; }
          h3 { color: #222; margin-top: 1.5rem; font-size: 20px; }
          strong { color: #000; }
          ul { margin-top: 0.5rem; }
          li { margin-bottom: 0.5rem; font-size: 14px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${summary}
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleGenerateSummary = async () => {
    if (!startDate) {
      alert("Please select at least a Start Date.");
      return;
    }
    setLoading(true);
    setSummary("");
    
    try {
      const token = localStorage.getItem("token");
      // Use current date if no end date selected
      const finalEndDate = endDate || new Date().toISOString().split("T")[0];
      
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      const endDateTime = new Date(finalEndDate);
      endDateTime.setHours(23, 59, 59, 999);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/smart-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          workspace_id: parseInt(workspaceId),
          project_ids: selectedProjectIds,
          local_start_date: new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          local_end_date: new Date(finalEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummary("<p class='text-red-400'>Error generating summary. Please try again.</p>");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

      {/* Modal */}
      <div className="w-full max-w-4xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              Catch Up Summary
            </h2>

            <p className="mt-1 text-sm text-gray-300">
              Generate an AI summary for one day or a custom date range.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Date and Project Inputs */}
          <div className="grid gap-5 md:grid-cols-3">

            {/* Start Date */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200">
                <Calendar size={16} />
                Start Date *
              </label>

              <input
                type="date"
                max={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none backdrop-blur-lg"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200">
                <Calendar size={16} />
                End Date (Optional)
              </label>

              <input
                type="date"
                max={today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none backdrop-blur-lg"
              />
            </div>
            
            {/* Project Filter */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200">
                <FolderGit2 size={16} />
                Project (Optional)
              </label>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none backdrop-blur-lg"
                >
                  <span className="truncate">
                    {selectedProjectIds.length === 0 
                      ? "All Projects" 
                      : `${selectedProjectIds.length} Project${selectedProjectIds.length > 1 ? 's' : ''} Selected`}
                  </span>
                  <span className="text-gray-400 text-xs">▼</span>
                </button>
                
                {isProjectDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-white/20 bg-slate-900 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                    <label className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/5">
                      <input 
                        type="checkbox" 
                        checked={selectedProjectIds.length === 0}
                        onChange={() => setSelectedProjectIds([])}
                        className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-white text-sm">All Projects</span>
                    </label>
                    {projects.map(p => (
                      <label key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedProjectIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjectIds([...selectedProjectIds, p.id]);
                            } else {
                              setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id));
                            }
                          }}
                          className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="text-white text-sm truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleGenerateSummary}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Sparkles className={loading ? "animate-spin" : "animate-pulse"} size={18} />
              {loading ? "Generating..." : "Generate Catch-Up Summary"}
            </button>

            {summary && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-white/10 hover:scale-105"
                >
                  <Copy size={18} />
                  Copy
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-white/10 hover:scale-105"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            )}
          </div>

          {/* Summary Area */}
          <div className="mt-6 h-[350px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-5">

            {!loading && !summary && (
              <div className="flex h-full items-center justify-center text-gray-400">
                Your AI summary will appear here...
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <div className="h-5 w-3/4 animate-pulse rounded bg-white/10"></div>
                <div className="h-5 w-full animate-pulse rounded bg-white/10"></div>
                <div className="h-5 w-5/6 animate-pulse rounded bg-white/10"></div>
                <div className="h-5 w-2/3 animate-pulse rounded bg-white/10"></div>
                <div className="h-5 w-full animate-pulse rounded bg-white/10"></div>
              </div>
            )}

            {summary && (
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default SmartSummaryModal;