import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { fetchTaskMessages, getChatWebSocketUrl } from "../services/api";

/**
 * Real-time chat component for a task.
 * Only visible to task owner and assigned user (acceptor).
 * Connects via WebSocket for instant messaging.
 */
const TaskChat = ({ taskId, currentUserId, canAccess }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Auto-scroll to newest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message history
  useEffect(() => {
    if (!canAccess || !taskId) return;
    const load = async () => {
      try {
        const { data } = await fetchTaskMessages(taskId);
        setMessages(data || []);
      } catch (err) {
        const detail = err.response?.data?.detail;
        const msg = typeof detail === "string" ? detail : "Failed to load messages.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId, canAccess]);

  // WebSocket connection
  useEffect(() => {
    if (!canAccess || !taskId) return;
    setError("");
    const url = getChatWebSocketUrl(taskId);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      setError("");
    };
    ws.onclose = (event) => {
      setConnected(false);
      if (event.code !== 1000 && event.code !== 1001 && !event.wasClean) {
        setError((prev) => prev || "Disconnected. Check that you have access to this chat.");
      }
    };
    ws.onerror = () => {
      setError("Unable to connect. Ensure the backend is running and try again.");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch {
        // Ignore invalid messages
      }
    };

    wsRef.current = ws;
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [taskId, canAccess]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ message: text }));
    setInputText("");
  };

  if (!canAccess) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-50">
          <MessageCircle className="h-4 w-4 text-primary-400" />
          Task Chat
        </h3>
        {connected ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        ) : (
          <span className="text-xs text-slate-500">Connecting...</span>
        )}
      </div>

      {error && (
        <div className="border-b border-slate-800 px-4 py-2 text-xs text-amber-300">
          {error}
        </div>
      )}

      {/* Scrollable message area */}
      <div className="h-64 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-sm text-slate-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id || `${msg.sender_id}-${msg.timestamp}`}
                className={`flex flex-col ${String(msg.sender_id) === String(currentUserId) ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    String(msg.sender_id) === String(currentUserId)
                      ? "bg-primary-600/80 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {String(msg.sender_id) !== String(currentUserId) && (
                    <p className="mb-0.5 text-[10px] font-medium text-slate-400">
                      {msg.sender_email || `User #${msg.sender_id}`}
                    </p>
                  )}
                  <p className="break-words text-sm">{msg.message}</p>
                </div>
                {msg.timestamp && (
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-slate-800 p-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={!connected}
        />
        <button
          type="submit"
          disabled={!connected || !inputText.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default TaskChat;
