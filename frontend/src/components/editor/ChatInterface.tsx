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
import { keyframes } from "@emotion/react";
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import useCustomToast from "@/hooks/useCustomToast";
import { useColorMode } from "@/components/ui/color-mode";
import { ApiError } from "@/client/core/ApiError";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatInterfaceProps {
  editorContent: string;
}

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const ChatInterface: React.FC<ChatInterfaceProps> = ({ editorContent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showErrorToast } = useCustomToast();
  const { colorMode } = useColorMode();

  const isDark = colorMode === "dark";
  const bgColor = isDark ? "gray.900" : "white";
  const borderColor = isDark ? "gray.700" : "gray.200";
  const textColor = isDark ? "white" : "gray.800";
  const inputBg = isDark ? "gray.800" : "gray.100";
  const assistantBg = isDark ? "gray.700" : "gray.100";
  const assistantColor = isDark ? "white" : "gray.800";

  const bounceAnimation = `${bounce} 1s infinite`;

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

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
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
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
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (isFirstChunk) {
          setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
          isFirstChunk = false;
        }

        const chunk = decoder.decode(value, { stream: true });

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
      // Optionally remove the failed message or show an error state
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
      bg={bgColor}
      borderLeft="1px solid"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      transition="width 0.3s"
      flexShrink={0}
    >
      {/* Header */}
      <HStack
        p={2}
        borderBottom="1px solid"
        borderColor={borderColor}
        justify={isOpen ? "space-between" : "center"}
      >
        {isOpen && (
          <HStack>
            <FaRobot color="#4FD1C5" />
            <Text fontWeight="bold" color={textColor} fontSize="sm">
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
                background: isDark ? "gray.500" : "gray.300",
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
                    flexShrink={0}
                  >
                    {msg.role === "user" ? (
                      <FaUser size={10} color="white" />
                    ) : (
                      <FaRobot size={10} color="white" />
                    )}
                  </Box>
                  <Box
                    bg={msg.role === "user" ? "blue.600" : assistantBg}
                    color={msg.role === "user" ? "white" : assistantColor}
                    p={3}
                    borderRadius="lg"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    boxShadow="sm"
                    maxWidth="100%"
                  >
                    {msg.content}
                  </Box>
                </HStack>
              </Box>
            ))}

            {/* Loading Indicator */}
            {isLoading &&
              (messages.length === 0 ||
                messages[messages.length - 1].role === "user") && (
                <Box alignSelf="flex-start" maxW="85%">
                  <HStack align="flex-start" spacing={2}>
                    <Box
                      mt={1}
                      p={1}
                      borderRadius="full"
                      bg="teal.500"
                      flexShrink={0}
                    >
                      <FaRobot size={10} color="white" />
                    </Box>
                    <Box
                      bg={assistantBg}
                      p={3}
                      borderRadius="lg"
                      boxShadow="sm"
                    >
                      <HStack spacing={1}>
                        <Box
                          as="span"
                          w="2"
                          h="2"
                          bg="gray.400"
                          borderRadius="full"
                          animation={bounceAnimation}
                          css={{ animationDelay: "0s" }}
                        />
                        <Box
                          as="span"
                          w="2"
                          h="2"
                          bg="gray.400"
                          borderRadius="full"
                          animation={bounceAnimation}
                          css={{ animationDelay: "0.2s" }}
                        />
                        <Box
                          as="span"
                          w="2"
                          h="2"
                          bg="gray.400"
                          borderRadius="full"
                          animation={bounceAnimation}
                          css={{ animationDelay: "0.4s" }}
                        />
                      </HStack>
                    </Box>
                  </HStack>
                </Box>
              )}

            <div ref={messagesEndRef} />
          </VStack>

          {/* Input Area */}
          <Box p={4} borderTop="1px solid" borderColor={borderColor}>
            <HStack>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={isLoading}
                bg={inputBg}
                border="none"
                _focus={{ border: "1px solid teal.500" }}
                color={textColor}
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
