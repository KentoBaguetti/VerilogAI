import React, { useState, useRef, useEffect } from "react";
import {
  VStack,
  HStack,
  Input,
  IconButton,
  Box,
  Text,
  Spinner,
  Button,
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
  onSuggestCode?: (code: string) => void;
  onStreamCode?: (codeChunk: string, isFirstChunk: boolean) => void;
  isStreamingCode?: boolean;
}

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const ChatInterface: React.FC<ChatInterfaceProps> = ({ editorContent, onSuggestCode, onStreamCode, isStreamingCode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showErrorToast } = useCustomToast();
  const { colorMode } = useColorMode();
  
  // New state to track if we are in "Apply Mode" (direct to editor)
  const [isApplyMode, setIsApplyMode] = useState(false);

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

  const handleSendMessage = async (applyToEditor = false) => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    
    const promptText = input;
    setInput("");
    setIsLoading(true);
    
    if (applyToEditor) {
        setIsApplyMode(true);
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    try {
      const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
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
      
      // If applying to editor, we'll accumulate code separately to handle potential text+code mix
      let codeAccumulator = "";
      let inCodeBlock = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        if (applyToEditor && onStreamCode) {
            // Simple heuristic: If we find code block markers, try to extract code
            // For direct streaming, ideally the backend would just return code if requested.
            // For now, let's just stream everything to the diff editor so the user sees it building up.
            // To do this cleanly, we might need to strip markdown if present, but for a "Cursor-like" feel,
            // usually the agent returns JUST the code when asked to edit.
            
            // Let's assume for "Apply Edit" mode, we want to stream the raw content to the DiffEditor
            // But we need to handle the case where the LLM wraps it in ```verilog
            
            assistantMessage += chunk;
            
            // VERY BASIC parsing for streaming:
            // If we detect ```verilog, we start capturing.
            // Real-time parsing is tricky. 
            // Simpler approach: Stream raw text to the editor, and let the user clean it up, 
            // OR, wait for the full response to "Apply" (which is what we had).
            
            // Better approach for "Agentic" feel:
            // Send the chunk directly. 
            // However, the diff editor expects the FULL "modified" string to calculate diffs.
            // So we must accumulate and send the FULL string so far.
            
            // Let's try to be smart: If the chunk contains code block markers, we might need to filter.
            // For now, let's send the accumulated message as the "modified code".
            
            // Use a regex to strip Markdown wrapping if it looks like a wrapped block
            let cleanCode = assistantMessage;
            
            // Robust extraction: Find ONLY the content inside the LAST incomplete or complete code block
            // If multiple blocks, usually we want the last one or the one matching "verilog"
            
            // Strategy:
            // 1. Check if there is a ```verilog marker.
            // 2. If so, extract content after it.
            // 3. Remove any trailing ``` if present.
            // 4. If NO code block, assume the whole text is code (fallback), but usually LLM wraps it.
            
            const codeBlockMatch = assistantMessage.match(/```(?:verilog)?\n([\s\S]*?)(?:```|$)/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                cleanCode = codeBlockMatch[1];
            } else if (assistantMessage.includes("```")) {
                 // Maybe the block hasn't started the content yet or is just opening
                 // Keep cleanCode as is or handle partial state
            }
            
            onStreamCode(cleanCode, isFirstChunk);
        } else {
            // Normal Chat Mode
            if (isFirstChunk) {
              setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
            }
            
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
        isFirstChunk = false;
      }
    } catch (error) {
      console.error("Chat error:", error);
      showErrorToast("Failed to get response from AI.");
    } finally {
      setIsLoading(false);
      setIsApplyMode(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Default to normal chat if just pressing enter. 
      // To do "Apply", we might want a separate button or a modifier key (e.g. Cmd+Enter)
      if (e.metaKey || e.ctrlKey) {
          handleSendMessage(true); // Command+Enter to Apply
      } else {
          handleSendMessage(false);
      }
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
                <Text fontSize="xs" mt={2}>ProTip: Cmd+Enter to Edit Code directly</Text>
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
                    {/* Legacy "Apply Edit" button for chat history items */}
                    {msg.role === "assistant" && msg.content.includes("```verilog") && onSuggestCode && (
                        <Box mt={2}>
                            <IconButton 
                                aria-label="Apply Changes" 
                                size="xs" 
                                colorScheme="teal" 
                                icon={<Text fontSize="xs" px={1}>Apply Edit</Text>}
                                onClick={() => {
                                    const match = msg.content.match(/```verilog\n([\s\S]*?)\n```/);
                                    if (match && match[1]) {
                                        onSuggestCode(match[1]);
                                    }
                                }}
                            />
                        </Box>
                    )}
                  </Box>
                </HStack>
              </Box>
            ))}

            {/* Loading Indicator */}
            {isLoading && !isApplyMode &&
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
              
             {/* Applying to Editor Indicator */}
             {isLoading && isApplyMode && (
                 <Box textAlign="center" color="teal.500" fontSize="sm" py={2}>
                     <Spinner size="xs" mr={2} />
                     Writing to editor...
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
                placeholder="Type message... (Cmd+Enter to Edit)"
                disabled={isLoading}
                bg={inputBg}
                border="none"
                _focus={{ border: "1px solid teal.500" }}
                color={textColor}
              />
              <Button
                size="sm"
                colorScheme="teal"
                isLoading={isLoading}
                onClick={() => handleSendMessage(false)}
                mr={1}
              >
                  Chat
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                isLoading={isLoading}
                onClick={() => handleSendMessage(true)}
                title="Edit Code Directly"
              >
                  Edit
              </Button>
            </HStack>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ChatInterface;
