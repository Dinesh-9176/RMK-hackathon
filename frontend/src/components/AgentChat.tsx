"use client";

/**
 * AgentChat — Aegis Copilot conversational panel.
 * Drop this into any page for an always-on AI assistant.
 */
import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { api } from "../services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AgentChat() {
  const { state } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Aegis Copilot online. I'm monitoring your cold-chain in real time. Ask me anything — or send current telemetry for an instant analysis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show agent message from autonomous analysis
  useEffect(() => {
    if (state.agentMessage) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `[Auto-Analysis] ${state.agentMessage}` },
      ]);
    }
  }, [state.agentMessage]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.agent.chat({
        message: userMsg,
        session_id: sessionId,
        telemetry: {
          temperature: state.telemetry.temperature,
          humidity: state.telemetry.humidity,
          vibration: state.telemetry.vibration,
          ethylene: state.telemetry.ethylene,
          co2: state.telemetry.co2,
          door_status: state.telemetry.doorStatus,
          battery_level: state.telemetry.batteryLevel,
          signal_strength: state.telemetry.signalStrength,
        },
        history: messages.slice(-6),
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.message },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${(err as Error).message}. Is the backend running on port 8000?`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isCrisis = state.systemStatus === "crisis";

  return (
    <div
      className={`flex flex-col h-full rounded-xl border ${
        isCrisis ? "border-red-500/40 bg-red-950/20" : "border-[var(--border-color)] bg-[var(--bg-secondary)]"
      }`}
      style={{ minHeight: 360 }}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b ${
          isCrisis ? "border-red-500/40" : "border-[var(--border-color)]"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            loading ? "bg-yellow-400 animate-pulse" : isCrisis ? "bg-red-400 animate-pulse-red" : "bg-green-400"
          }`}
        />
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Aegis Copilot
        </span>
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          GPT-4o mini · function calling
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[var(--accent-blue)]/20 text-[var(--text-primary)] border border-[var(--accent-blue)]/30"
                  : isCrisis
                  ? "bg-red-900/30 text-red-200 border border-red-500/20"
                  : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]"
              }`}
            >
              {m.role === "assistant" && (
                <span className="block text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wide">
                  Aegis Copilot
                </span>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-muted)]">
              <span className="animate-pulse">Analysing telemetry…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className={`flex gap-2 p-3 border-t ${
          isCrisis ? "border-red-500/40" : "border-[var(--border-color)]"
        }`}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask the copilot… (Enter to send)"
          className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)]"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Send
        </button>
      </div>
    </div>
  );
}
