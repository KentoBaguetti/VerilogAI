import React, { useRef, useEffect } from "react";
import { Message } from "../types";
import { SendIcon } from "./Icons";
import { markdownToHtml } from "../utils/markdown";

interface ChatSidebarProps {
  messages: Message[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: (isAgentic?: boolean) => void;
  width: number;
  isLoading?: boolean;
  hasFileOpen?: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  width,
  isLoading = false,
  hasFileOpen = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Cmd/Ctrl + Enter for agentic mode
      if (e.metaKey || e.ctrlKey) {
        onSendMessage(true);
      } else {
        onSendMessage(false);
      }
    }
  };

  return (
    <div
      className="flex flex-col border-l grain bg-cream flex-shrink-0"
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        borderColor: "rgba(42, 37, 32, 0.08)",
      }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "rgba(42, 37, 32, 0.08)" }}
      >
        <h2 className="text-sm font-semibold text-ink">AI Assistant</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-ink opacity-50">
            <p className="text-sm">Ask me anything about your code</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message p-3 rounded-lg ${
              msg.role === "user" ? "ml-8" : "mr-8"
            }`}
            style={{
              background: msg.role === "user" ? "#C85C3C" : "#8B9A7E",
              color: "white",
            }}
          >
            {msg.content ? (
              <div
                className="text-sm leading-relaxed"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(msg.content),
                }}
              />
            ) : (
              <span className="opacity-50 text-sm">...</span>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div
            className="mr-8 p-3 rounded-lg"
            style={{ background: "#8B9A7E" }}
          >
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-4 border-t"
        style={{ borderColor: "rgba(42, 37, 32, 0.08)" }}
      >
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI for help..."
            className="flex-1 px-4 py-3 rounded-lg border outline-none transition-all focus:border-opacity-100 bg-white text-ink"
            style={{ borderColor: "#D4C4A8" }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => onSendMessage(false)}
              disabled={!inputValue.trim() || isLoading}
              className="flex-1 px-4 py-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 bg-rust text-white font-medium text-sm flex items-center justify-center gap-2"
              style={{ background: hasFileOpen ? "#8B9A7E" : "#ccc" }}
            >
              <SendIcon />
              <span>Chat</span>
            </button>
            <button
              onClick={() => onSendMessage(true)}
              disabled={!inputValue.trim() || isLoading || !hasFileOpen}
              title={
                !hasFileOpen
                  ? "Open a file to use agentic mode"
                  : "Apply changes directly to code (Cmd+Enter)"
              }
              className="flex-1 px-4 py-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2"
              style={{ background: hasFileOpen ? "#8B9A7E" : "#ccc" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>
          {hasFileOpen && (
            <p className="text-xs text-ink opacity-50 text-center">
              Press{" "}
              <kbd
                className="px-1 py-0.5 bg-white rounded border"
                style={{ borderColor: "#D4C4A8" }}
              >
                Cmd+Enter
              </kbd>{" "}
              for Edit mode
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
