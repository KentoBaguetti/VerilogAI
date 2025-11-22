import React, { useRef, useEffect } from "react";
import { Message } from "../types";
import { SendIcon } from "./Icons";

interface ChatSidebarProps {
    messages: Message[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onSendMessage: () => void;
    width: number;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    messages,
    inputValue,
    onInputChange,
    onSendMessage,
    width,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onSendMessage();
        }
    };

    return (
        <div
            className="flex flex-col border-l grain bg-cream"
            style={{
                width: `${width}px`,
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
                        <p className="text-sm">
                            Ask me anything about your code
                        </p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`message p-3 rounded-lg ${
                            msg.role === "user" ? "ml-8" : "mr-8"
                        }`}
                        style={{
                            background:
                                msg.role === "user" ? "#C85C3C" : "#8B9A7E",
                            color: "white",
                        }}
                    >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
                className="p-4 border-t"
                style={{ borderColor: "rgba(42, 37, 32, 0.08)" }}
            >
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask AI for help..."
                        className="flex-1 px-4 py-3 rounded-lg border outline-none transition-all focus:border-opacity-100 bg-white text-ink"
                        style={{ borderColor: "#D4C4A8" }}
                    />
                    <button
                        onClick={onSendMessage}
                        disabled={!inputValue.trim()}
                        className="px-4 py-3 rounded-lg transition-all hover:scale-105 disabled:opacity-50 bg-rust text-white"
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
