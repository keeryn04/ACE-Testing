import React, { useEffect, useRef, useState }from "react";
import "../index.css"
import HeaderTeal from "../components/header";
import ReactMarkdown from "react-markdown";
import PersonaDropup from "../components/dropup"
import Tutorial from "../components/Tutorial";

const API_BASE = import.meta.env.VITE_API_BASE;

//Chat Bubble Component
const ChatBubble = ({ role, content, timestamp }) => {
  const isAssistant = role === "assistant";
  const time = timestamp ? new Date(timestamp).toLocaleString() : "";

  return (
    <div className={`flex w-full my-1 ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 shadow
          ${isAssistant ? "bg-gray-100 text-gray-900" : "bg-blue-600 text-white"}`}
      >
        <div className="text-sm"> <ReactMarkdown>{content}</ReactMarkdown></div>
        <div
          className={`text-[11px] mt-1 opacity-70 ${
            isAssistant ? "text-gray-600" : "text-white"
          }`}
        >
          {time}
        </div>
      </div>
    </div>
  );
};

//Main Component
export default function ChatPage() {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const [personas, setPersonas] = useState([]);     // [{id, name}]
  const [personaId, setPersonaId] = useState(null); // selected persona id
  const [dropupOpen, setDropupOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const currentPersona = personas.find((p) => p.id === personaId) ?? null;
  const currentPersonaName = currentPersona?.name ?? "—";
  const currentPersonaRole = currentPersona?.role ?? "";
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [userHasTeam, setUserHasTeam] = useState(false);
  const [userId, setUserId] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [canSendMessages, setCanSendMessages] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/personas`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const formatted = data.map((p) => ({ id: p.persona_id, name: p.persona_name, role: p.role}));
        setPersonas(formatted);

  
        // Prefer Alex if present; else first
        setPersonaId((prev) => {
          if (prev) return prev;
          const alex = formatted.find(p => p.name === "Alex");
          return alex ? alex.id : (formatted[0]?.id ?? null);
        });
      } catch (e) {
        console.error("Failed to load personas:", e);
        setErr(`Failed to load personas: ${e.message}`);
      }
    })();
  }, []);

  //Decoding Token function
  const getTokenData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/api/decode_token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const decoded = await res.json();
      return { teamId: decoded.team_id, userId: decoded.current_user };
    } catch (err) {
      console.error("Error decoding token:", err);
      return null;
    }
  };
  //Decode token data on page reload (TeamId, UserId)
  useEffect(() => {
    (async () => {
      const data = await getTokenData();
      if (data) {
        setTeamId(data.teamId);
        setUserId(data.userId);
        setUserHasTeam(!!data.teamId);
        
        const canSend = localStorage.getItem("canSendMessages") === "true";
        setCanSendMessages(canSend);
      }
    })();
  }, []);

  //Download PDF
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    const name = currentPersonaName;
    try {
      const url = `${API_BASE}/api/export/conversations/${encodeURIComponent(teamId)}/${encodeURIComponent(name)}.pdf`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { "Accept": "application/pdf" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `conversation_team_${teamId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objUrl);
    } catch (e) {
        console.error(e);
        alert("Failed to download PDF.");
    } finally {
        setDownloading(false);
    }
  };
    useEffect(() => {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/personas`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const formatted = data.map((p) => ({ id: p.persona_id, name: p.persona_name }));
          setPersonas(formatted);
          setPersonaId((prev) => prev ?? formatted[0]?.id ?? null);
        } catch (e) {
          console.error("Failed to load personas:", e);
          setErr(`Failed to load personas: ${e.message}`);
        }
      })();
    }, []);

    //Loading previous messages
    const loadMessages = async () => {
      const name = currentPersonaName;

      if (!name || name === "—") return;

      try {
        setLoading(true);
        setErr("");

        const res = await fetch(
          `${API_BASE}/api/past_messages` +
          `?team_id=${encodeURIComponent(teamId)}` +
          `&persona_name=${encodeURIComponent(name)}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setMessages(data);
      } catch (e) {
        setErr(`Failed to load messages: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (currentPersonaName && currentPersonaName !== "—") {
      loadMessages();
    }
  }, [currentPersonaName]);
  
  //Auto-scroll on update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  //Sending a new message
  const sendMessage = async () => {
    if (!userHasTeam) {
      alert("Join a team before messaging.");
      return;
    }

    if (!userMessage.trim() || sending) return;

    setSending(true);
    setErr("");

    //optimistic UI --> ensures users text can be seen as sent immediately and they dont wait until everythings updated in the db
    const optimistic = {
      role: "user",
      content: userMessage.trim(),
      timestamp: new Date().toISOString(),
      persona_name: currentPersonaName,
    };

    setMessages((prev) => [...prev, optimistic]);
      
    try {
      const body = {
        team_id: teamId,
        persona_name: currentPersonaName,  
        user_message: userMessage.trim(),
        user_id: userId
      };

      const res = await fetch(`${API_BASE}/api/send_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        //User not on team, or session controlled by another user
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const aiMsg = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setUserMessage("");
    } catch (e) {
      setErr(`Failed to send: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  //Message input key
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full h-full">
      <Tutorial key={tourKey} run={runTour} setRun={setRunTour} />
      <div className="sticky w-screen left-0 top-0 h-20 bg-darkteal rounded-b-xl border-1 shadow-md z-50">
        <div className="flex justify-between w-full h-full">
          <div className="flex flex-col justify-start pl-1 pt-1">
            <h1 className="app-header font-semibold italic pl-10">ACE</h1>
            <p className="text-sm pl-10">AI Client for Engineering</p>
          </div>
          <div className="flex flex-1 justify-end pr-10 items-center gap-2">
            <button>Profile</button>
            <button
              onClick={() => {
                setRunTour(false);
                setTourKey((k) => k + 1);
                requestAnimationFrame(() => setRunTour(true));
              }}
            >Tutorial
            </button>
          </div>
         
        </div>
      </div>
      <div className="current-agent text-sm text-gray-600 text-center pt-4">
        Current agent:{" "}
        <span className="font-medium text-gray-900">
          {currentPersonaName}
        </span>
        {currentPersonaRole && (
          <span className="ml-1 text-gray-500">
            ({currentPersonaRole})
          </span>
        )}
      </div>

      {/* Messages / chat area */}
      <div
        ref={scrollRef}
        className="chat-window flex flex-col border-2 my-4  mx-4 h-[70vh] bg-white overflow-y-auto p-3 rounded-2xl"
      >
        {loading && <div className="text-sm text-gray-500">Loading…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}
        {!loading && !err && messages.length === 0 && (
          <div className="text-sm text-gray-500">No messages yet.</div>
        )}
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role}
            content={m.content}
            timestamp={m.timestamp}
          />
        ))}
      </div>

      {/* Error / info message */}
      {!userHasTeam && (
        <div className="text-red-600 mb-2">
          Join a team in Profile before chatting.
        </div>
      )}
      {userHasTeam && !canSendMessages && (
        <div className="text-red-600 mb-2">
          Another team member currently controls the session.
        </div>
      )}

      {/*Input field and button */}
      <div className="input-area flex justify-stretch pl-5 pr-5">
        <textarea
          className="w-full rounded-md p-3 bg-white border"
          placeholder="Ask a question..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={!userHasTeam || !canSendMessages  || sending}
        />
        <button onClick={sendMessage}
         disabled={!userHasTeam || !canSendMessages  || sending || !userMessage.trim()}
         className={`send-message px-4 py-2 rounded text-black ${sending ? "bg-white-400" : "bg-blue-600"}`}
        >
          {sending ? "Sending…" : "Send"}
        </button>                        
      </div>

      {/* Bottom controls */}
      <div className="justify-around flex h-15">
      <div className="relative">
       <button
        onClick={() => setDropupOpen((o) => !o)}
        className="change-persona inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm bg-white hover:bg-gray-50"
      >
        {currentPersonaName !== "—"
          ? (
            <>
              <span>{currentPersonaName}</span>
              {currentPersonaRole && (
                <span className="text-xs text-gray-500">
                  – {currentPersonaRole}
                </span>
              )}
            </>
          )
          : "Change Agent"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
        <path d="M5.23 12.79a.75.75 0 0 0 1.06-.02L10 9.06l3.71 3.71a.75.75 0 0 0 1.06-1.06l-4.24-4.25a.75.75 0 0 0-1.06 0L5.21 11.71a.75.75 0 0 0 .02 1.08z" />
        </svg>
      </button>


        <PersonaDropup
          open={dropupOpen}
          personas={personas}
          selected={personaId}
          onSelect={setPersonaId}
          onClose={() => setDropupOpen(false)}
        />
        </div>
        <button
              onClick={handleDownload}
              disabled={downloading}
              className={`download-pdf inline-flex items-center h-4 gap-2 rounded-lg border px-3 py-2 text-sm ${
                downloading ? "bg-gray-200 text-gray-500" : "bg-white hover:bg-gray-50"
              }`}
              title="Export this chat as a time-sorted PDF"
            >
              {downloading ? "Preparing PDF…" : "Save as PDF"}
        </button>
      </div>
    </div>
  );
};