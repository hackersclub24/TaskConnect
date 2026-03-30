import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, FileText, Image, Loader, X, Paperclip, Download } from "lucide-react";
import { fetchTaskMessages, getChatWebSocketUrl, uploadPdfToChat, uploadImageToChat, markTaskMessagesSeen } from "../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

/**
 * WhatsApp-style real-time chat component for a task.
 * Only visible to task owner and assigned user (acceptor).
 * Supports text, PDF, and image attachments via Cloudinary.
 */
const TaskChat = ({ taskId, currentUserId, canAccess }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachMenuRef = useRef(null);

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
        await markTaskMessagesSeen(taskId);
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
        if (String(msg.sender_id) !== String(currentUserId)) {
          markTaskMessagesSeen(taskId).catch(() => {
            // no-op: seen update should not block chat UX
          });
        }
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

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };

    if (showAttachMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAttachMenu]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ message: text }));
    setInputText("");
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      setError("Please select a valid PDF file");
      return;
    }

    setUploading(true);
    setError("");
    try {
      await uploadPdfToChat(taskId, file);
      const { data } = await fetchTaskMessages(taskId);
      setMessages(data || []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to upload PDF");
    } finally {
      setUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    setUploading(true);
    setError("");
    try {
      await uploadImageToChat(taskId, file);
      const { data } = await fetchTaskMessages(taskId);
      setMessages(data || []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to upload image");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const isImage = (url, fileName) => {
    return url && (fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes("/image/"));
  };

  const isAutoAttachmentMessage = (message = "") => {
    return message.startsWith("📎 Shared a PDF:") || message.startsWith("🖼️ Shared an image:");
  };

  const toAbsoluteFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
    return `${API_ORIGIN}/${url}`;
  };

  const extractSharedFileName = (message = "") => {
    const match = message.match(/Shared (?:a PDF|an image):\s*(.+)$/);
    return match?.[1]?.trim() || "";
  };

  // Format time HH:MM
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!canAccess) return null;

  return (
    <div className="flex flex-col h-96 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-primary-600 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <MessageCircle className="h-4 w-4" />
          Task Chat
        </h3>
        <span className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-300" : "text-slate-400"}`}>
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          {connected ? "Online" : "Offline"}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/20 border-b border-red-700 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-300 hover:text-red-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-900 to-slate-800/50 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = String(msg.sender_id) === String(currentUserId);
            const imgUrl = msg.file_url;
            const resolvedFileUrl = toAbsoluteFileUrl(imgUrl);
            const fileName = msg.file_name || extractSharedFileName(msg.message || "");
            const showImage = isImage(imgUrl, fileName);
            const showPdfCard = !showImage && !!fileName && /\.pdf$/i.test(fileName);

            return (
              <div
                key={msg.id || `${msg.sender_id}-${msg.timestamp}`}
                className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar for other user */}
                {!isOwn && (
                  <div className="w-7 h-7 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                    {getInitials(msg.sender_name)}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[75%]`}>
                  {/* Sender name for others */}
                  {!isOwn && (
                    <p className="text-[10px] font-semibold text-slate-300 mb-1 ml-2">
                      {msg.sender_name || `User #${msg.sender_id}`}
                    </p>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      isOwn
                        ? "bg-primary-600 text-white rounded-br-none"
                        : "bg-slate-700/70 text-slate-100 rounded-bl-none"
                    }`}
                  >
                    {msg.message && !isAutoAttachmentMessage(msg.message) && (
                      <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                    )}

                    {/* Image attachment */}
                    {showImage && imgUrl && (
                      <a
                        href={resolvedFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block rounded-lg overflow-hidden"
                      >
                        <img
                          src={resolvedFileUrl}
                          alt={fileName}
                          className="h-40 w-auto max-w-xs rounded-lg hover:opacity-80 transition-opacity"
                        />
                      </a>
                    )}

                    {/* PDF attachment */}
                    {showPdfCard && (
                      <div className="mt-2 w-full min-w-[240px] max-w-xs rounded-xl border border-white/10 bg-black/20 p-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/90 text-white">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{fileName}</p>
                            <p className="text-[11px] opacity-80">PDF Document</p>
                          </div>
                        </div>
                        {resolvedFileUrl ? (
                          <a
                            href={resolvedFileUrl}
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-xs font-semibold hover:bg-white/20 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        ) : (
                          <p className="mt-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-center text-xs opacity-80">
                            File link unavailable
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className={`text-[10px] mt-1 ${isOwn ? "text-slate-400" : "text-slate-500"}`}>
                    {formatTime(msg.timestamp)}
                    {isOwn && msg.seen_at ? " • Seen" : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-700 bg-slate-900/50 p-3 flex gap-2 items-end"
      >
        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={!connected || uploading}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          onChange={handlePdfUpload}
          className="hidden"
          disabled={!connected || uploading}
        />

        {/* Attachment button with menu */}
        <div className="relative" ref={attachMenuRef}>
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={!connected || uploading}
            className="p-2 rounded-full hover:bg-slate-700 text-slate-300 hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
            title="Attach file"
          >
            {uploading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>

          {/* Dropdown menu */}
          {showAttachMenu && !uploading && (
            <div className="absolute bottom-12 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
              <button
                type="button"
                onClick={() => {
                  imageInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:text-primary-400 hover:bg-slate-700 transition-colors"
              >
                <Image className="h-4 w-4" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  pdfInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:text-primary-400 hover:bg-slate-700 transition-colors border-t border-slate-700"
              >
                <FileText className="h-4 w-4" />
                <span>PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Text input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
          disabled={!connected || uploading}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!connected || !inputText.trim() || uploading}
          className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default TaskChat;
