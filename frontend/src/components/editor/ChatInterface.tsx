import React, { useState, useRef, useEffect } from "react";
import {
  VStack,
  HStack,
  Input,
  IconButton,
  Box,
  Text,
  Spinner,
} from "@chakra-ui/react";
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import useCustomToast from "@/hooks/useCustomToast";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatInterfaceProps {
  editorContent: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ editorContent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showErrorToast } = useCustomToast();

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: {
            code: editorContent,
            language: "verilog",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Add empty assistant message to start streaming into
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Process Server-Sent Events format if needed, but our backend sends raw chunks mostly
        // The backend sends "data: " prefix for SSE compliance in some cases, let's handle simple text stream first
        // Our backend implementation actually sends raw text chunks in the generator

        assistantMessage += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === "assistant") {
            lastMsg.content = assistantMessage;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      showErrorToast("Failed to get response from AI.");
      // Remove the empty assistant message if it failed immediately?
      // Or leave it as partial?
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      width={isOpen ? "400px" : "50px"}
      bg="gray.900"
      borderLeft="1px solid"
      borderColor="gray.700"
      display="flex"
      flexDirection="column"
      transition="width 0.3s"
      flexShrink={0}
    >
      {/* Header */}
      <HStack
        p={2}
        borderBottom="1px solid"
        borderColor="gray.700"
        justify={isOpen ? "space-between" : "center"}
      >
        {isOpen && (
          <HStack>
            <FaRobot color="#4FD1C5" />
            <Text fontWeight="bold" color="white" fontSize="sm">
              Verilog AI
            </Text>
          </HStack>
        )}
        <IconButton
          aria-label="Toggle chat"
          icon={isOpen ? <FaCompress /> : <FaRobot />}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          colorScheme="teal"
        />
      </HStack>

      {isOpen && (
        <>
          {/* Messages Area */}
          <VStack
            flex={1}
            overflowY="auto"
            p={4}
            spacing={4}
            align="stretch"
            css={{
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-track": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                background: "gray.500",
                borderRadius: "24px",
              },
            }}
          >
            {messages.length === 0 && (
              <Box textAlign="center" py={10} color="gray.500">
                <Text>Ask me anything about your Verilog code!</Text>
              </Box>
            )}

            {messages.map((msg, idx) => (
              <Box
                key={idx}
                alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                maxW="85%"
              >
                <HStack
                  align="flex-start"
                  spacing={2}
                  flexDirection={msg.role === "user" ? "row-reverse" : "row"}
                >
                  <Box
                    mt={1}
                    p={1}
                    borderRadius="full"
                    bg={msg.role === "user" ? "blue.500" : "teal.500"}
                  >
                    {msg.role === "user" ? (
                      <FaUser size={10} color="white" />
                    ) : (
                      <FaRobot size={10} color="white" />
                    )}
                  </Box>
                  <Box
                    bg={msg.role === "user" ? "blue.600" : "gray.700"}
                    color="white"
                    p={3}
                    borderRadius="lg"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                  >
                    {msg.content}
                  </Box>
                </HStack>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </VStack>

          {/* Input Area */}
          <Box p={4} borderTop="1px solid" borderColor="gray.700">
            <HStack>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={isLoading}
                bg="gray.800"
                border="none"
                _focus={{ border: "1px solid teal.500" }}
                color="white"
              />
              <IconButton
                aria-label="Send"
                icon={isLoading ? <Spinner size="sm" /> : <FaPaperPlane />}
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                colorScheme="teal"
              />
            </HStack>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ChatInterface;
