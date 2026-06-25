import { useState, useEffect, useRef, useContext } from "react";
import { Send, User } from "lucide-react";
import AppContext from "../../context/AppContext";

export default function ProjectChat({ projectId, projectName, currentUserRole }) {
  const { members } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const currentUserId = Number(localStorage.getItem("userId"));

  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
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
    const beforeMention = newMessage.substring(0, mentionIndex);
    const formattedName = firstName.replace(/\s+/g, ""); // Just a safeguard, first names shouldn't have spaces
    setNewMessage(beforeMention + "@" + formattedName + " ");
    setShowMentions(false);
  };
  
  const getDisplayName = (m) => m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : (m.full_name || m.name || m.email);

  const filteredMembers = showMentions ? members.filter(m => getDisplayName(m).toLowerCase().replace(/\s+/g, "").includes(mentionQuery.toLowerCase())) : [];

  useEffect(() => {
    // 0. Fetch historical messages
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/messages`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => setMessages(data))
      .catch(err => console.error("Error fetching messages"));

    // 1. Connect to WebSocket
    // Note: In production, wss:// and proper token auth is required
    const wsUrl = import.meta.env.VITE_API_URL.replace("http", "ws");
    ws.current = new WebSocket(`${wsUrl}/ws/projects/${projectId}/chat`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws.current) return;

    // Send payload to backend WebSocket
    ws.current.send(JSON.stringify({
      user_id: currentUserId,
      content: newMessage
    }));

    setNewMessage("");
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/20 rounded-t-2xl">
        <h2 className="font-bold text-white">Team Chat</h2>
        <p className="text-xs text-slate-400">Real-time discussion for {projectName}</p>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === currentUserId;
            return (
              <div key={idx} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold text-xs">
                  {msg.user?.full_name ? msg.user.full_name[0].toUpperCase() : <User size={14}/>}
                </div>
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                  <span className="text-xs text-slate-500 mb-1">
                    {msg.user?.full_name || "Unknown User"} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isMe ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-tr-sm" : "bg-white/10 text-slate-200 rounded-tl-sm border border-white/5"
                  }`}>
                    {msg.content.split(/(@\w+)/g).map((part, i) => 
                      part.startsWith("@") ? <span key={i} className={`font-bold px-1.5 py-0.5 rounded-md text-xs mx-0.5 shadow-[0_0_10px_rgba(6,182,212,0.2)] border ${isMe ? "bg-cyan-500 text-white border-cyan-400" : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"}`}>{part}</span> : part
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative p-4 border-t border-white/10 bg-black/20 rounded-b-2xl">
        {/* Mention Dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-xl max-h-48 overflow-y-auto w-64 z-10">
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
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message... (use @ to mention)"
            className="flex-1 bg-black/20 border border-white/10 text-white placeholder-slate-500 px-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Send size={16} className="-ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}