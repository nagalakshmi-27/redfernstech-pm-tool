import { useState, useEffect, useContext } from "react";
import { User, Send } from "lucide-react";
import AppContext from "../context/AppContext";

export default function TaskComments({ taskId }) {
  const { members } = useContext(AppContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const currentUserId = Number(localStorage.getItem("userId"));

  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);

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
    const formattedName = firstName.replace(/\s+/g, ""); // Just a safeguard, first names shouldn't have spaces
    setNewComment(beforeMention + "@" + formattedName + " ");
    setShowMentions(false);
  };
  
  const getDisplayName = (m) => m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : (m.full_name || m.name || m.email);

  const filteredMembers = showMentions ? members.filter(m => getDisplayName(m).toLowerCase().replace(/\s+/g, "").includes(mentionQuery.toLowerCase())) : [];

  useEffect(() => {
    if (taskId) {
      fetchComments();
    }
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}/comments`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        setComments(await response.json());
      }
    } catch {
      console.error("Error fetching comments");
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        const postedComment = await response.json();
        setComments([...comments, postedComment]);
        setNewComment("");
      }
    } catch {
      alert("Error posting comment");
    }
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <h3 className="text-lg font-bold text-white mb-4">Comments</h3>
      
      <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-400">No comments yet.</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold text-xs">
                {comment.user?.full_name ? comment.user.full_name[0].toUpperCase() : <User size={14}/>}
              </div>
              <div className="flex-1 bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-slate-200">{comment.user?.full_name}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {comment.content.split(/(@\w+)/g).map((part, i) => 
                    part.startsWith("@") ? <span key={i} className="font-bold px-1.5 py-0.5 rounded-md text-xs mx-0.5 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-cyan-500/30">{part}</span> : part
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="relative">
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
            placeholder="Write a comment... (use @ to mention)"
            className="flex-1 bg-black/20 border border-white/10 text-white placeholder-slate-500 px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
          />
          <button 
            type="submit"
            disabled={!newComment.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
          >
            <Send size={16} /> Post
          </button>
        </form>
      </div>
    </div>
  );
}
