import { useState, useEffect, useContext } from "react";
import { User, MessageSquare, Send } from "lucide-react";
import AppContext from "../../context/AppContext";

export default function ProjectComments({ projectId }) {
  const { members } = useContext(AppContext);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);

  useEffect(() => {
    if (projectId) {
      fetchActivity();
    }
  }, [projectId]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/activity`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        setFeed(await response.json());
      }
    } catch {
      console.error("Error fetching project activity");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewComment(val);
    const match = val.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
      setMentionIndex(val.lastIndexOf("@"));
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (firstName) => {
    const beforeMention = newComment.substring(0, mentionIndex);
    const formattedName = firstName.replace(/\s+/g, "");
    setNewComment(beforeMention + "@" + formattedName + " ");
    setShowMentions(false);
  };
  
  const getDisplayName = (m) => m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : (m.full_name || m.name || m.email);

  const filteredMembers = showMentions ? members.filter(m => getDisplayName(m).toLowerCase().replace(/\s+/g, "").includes(mentionQuery.toLowerCase())) : [];

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (response.ok) {
        setNewComment("");
        fetchActivity();
      }
    } catch {
      console.error("Failed to post project comment");
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 p-6 flex flex-col h-[600px]">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <MessageSquare className="text-cyan-400" size={24} />
        <h2 className="text-xl font-bold text-white">Project Activity Feed</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
        {loading ? (
          <div className="text-center text-slate-500 py-10">Loading activity...</div>
        ) : feed.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            No activity yet. Start the conversation!
          </div>
        ) : (
          feed.map(item => {
            const isEvent = item.type === "event";
            const ticketId = isEvent ? item.ticket_id : (item.task?.ticket_id || null);
            const displayTaskId = !isEvent && item.task_id;
            
            return (
              <div key={`${item.type}-${item.id}`} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold text-sm">
                  {item.user?.full_name ? item.user.full_name[0].toUpperCase() : <User size={18}/>}
                </div>
                <div className="flex-1 bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-200">{item.user?.full_name || "Unknown User"}</span>
                    {ticketId ? (
                      <span className="text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)] px-2 py-1 rounded-md">
                        {ticketId}
                      </span>
                    ) : displayTaskId ? (
                      <span className="text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)] px-2 py-1 rounded-md">
                        Task #{item.task_id}
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)] px-2 py-1 rounded-md">
                        Project
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {isEvent ? (
                      <span>
                        {item.action}{" "}
                        {item.target_name && <span className="font-medium text-slate-200">'{item.target_name}'</span>}
                      </span>
                    ) : (
                      item.content?.split(/(@\w+)/g).map((part, i) => 
                        part.startsWith("@") ? <span key={i} className="font-bold px-1.5 py-0.5 rounded-md text-xs mx-0.5 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-cyan-500/30">{part}</span> : part
                      )
                    )}
                  </p>
                  <div className="mt-3 text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="relative mt-auto border-t border-white/10 pt-4">
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-xl max-h-48 overflow-y-auto w-64 z-10">
            {filteredMembers.map(m => (
              <button 
                key={m.id} 
                type="button"
                onClick={() => insertMention(m.first_name || m.full_name?.split(" ")[0] || m.email)}
                className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm font-medium border-b border-white/10 text-slate-300 last:border-0 transition"
              >
                {getDisplayName(m)}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handlePostComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={handleInputChange}
            placeholder="Add a comment to the project... (use @ to mention)"
            className="flex-1 bg-black/20 border border-white/10 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
          />
          <button 
            type="submit" 
            disabled={!newComment.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] disabled:opacity-50 text-white px-5 rounded-xl transition flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
