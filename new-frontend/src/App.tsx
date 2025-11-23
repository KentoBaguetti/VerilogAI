import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatSidebar from "./components/ChatSidebar";
import CodeEditor from "./components/CodeEditor";
import Resizer from "./components/Resizer";
import type { FileItem, Message, Version, ExpandedState } from "./types";

interface ChatContext {
    code: string;
    filePath?: string;
    language?: string;
}

async function streamChatResponse(
    messages: Message[],
    context: ChatContext | undefined,
    onChunk: (chunk: string) => void
): Promise<void> {
    const payload: any = {
        messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
        })),
    };
    
    if (context) {
        payload.context = context;
    }
    
    console.log("Sending chat request:", payload);
    
    const res = await fetch(`http://localhost:8000/api/v1/chat/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Chat error response:", err);
        throw new Error(err.detail || `Server error: ${res.status}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No response body");

    let buffer = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                        onChunk(parsed.content);
                    } else if (parsed.error) {
                        throw new Error(parsed.error);
                    }
                } catch (e) {
                    console.warn("Failed to parse SSE data:", data, e);
                }
            }
        }
    }
}

const App: React.FC = () => {
    const [started, setStarted] = useState(false);
    const [files, setFiles] = useState<FileItem[]>([
        {
            name: "modules",
            type: "folder",
            path: "/modules",
            children: [
                {
                    name: "gate.v",
                    type: "file",
                    path: "/modules/gate.v",
                    content: `module and_gate (
    input  wire a,
    input  wire b,
    output wire y
);

assign y = a & b;

endmodule`,
                },
            ],
        },
    ]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [currentContent, setCurrentContent] = useState("");
    const [currentLanguage, setCurrentLanguage] = useState("typescript");
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [chatWidth, setChatWidth] = useState(400);
    const [expanded, setExpanded] = useState<ExpandedState>({
        "/src": true,
        "/public": true,
    });
    const [versions, setVersions] = useState<Version[]>([]);
    const [aiEnabled, setAiEnabled] = useState(true); // AI autocomplete enabled by default
    const [apiUrl, setApiUrl] = useState("http://localhost:8000"); // Default API URL
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isAgenticMode, setIsAgenticMode] = useState(false);
    const [proposedCode, setProposedCode] = useState<string | null>(null);

    const getLanguageFromFilename = (filename: string): string => {
        const extension = filename.split(".").pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
            ts: "typescript",
            tsx: "typescript",
            js: "javascript",
            jsx: "javascript",
            json: "json",
            html: "html",
            css: "css",
            scss: "scss",
            md: "markdown",
            py: "python",
            java: "java",
            cpp: "cpp",
            c: "c",
            cs: "csharp",
            go: "go",
            rs: "rust",
            php: "php",
            rb: "ruby",
            swift: "swift",
            kt: "kotlin",
            sql: "sql",
            xml: "xml",
            yaml: "yaml",
            yml: "yaml",
        };
        return languageMap[extension || ""] || "plaintext";
    };

    const findFileByPath = (
        items: FileItem[],
        path: string
    ): FileItem | null => {
        for (const item of items) {
            if (item.path === path) {
                return item;
            }
            if (item.children) {
                const found = findFileByPath(item.children, path);
                if (found) return found;
            }
        }
        return null;
    };

    const updateFileContent = (path: string, content: string) => {
        const updateFiles = (items: FileItem[]): FileItem[] => {
            return items.map((item) => {
                if (item.path === path) {
                    return { ...item, content };
                }
                if (item.children) {
                    return { ...item, children: updateFiles(item.children) };
                }
                return item;
            });
        };
        setFiles(updateFiles(files));
    };

    // Create a new file in a folder
    const handleCreateFile = (folderPath: string) => {
        const fileName = prompt("Enter file name:");
        if (!fileName) return;

        // Validate filename
        if (!/^[a-zA-Z0-9_.-]+$/.test(fileName)) {
            alert(
                "Invalid file name. Use only letters, numbers, dots, dashes, and underscores."
            );
            return;
        }

        const newFile: FileItem = {
            name: fileName,
            type: "file",
            path:
                folderPath === "/"
                    ? `/${fileName}`
                    : `${folderPath}/${fileName}`,
            content: "",
        };

        const addFile = (items: FileItem[]): FileItem[] => {
            return items.map((item) => {
                if (item.path === folderPath && item.type === "folder") {
                    const children = item.children || [];
                    // Check for duplicate names
                    if (children.some((child) => child.name === fileName)) {
                        alert("A file with this name already exists!");
                        return item;
                    }
                    return { ...item, children: [...children, newFile] };
                }
                if (item.children) {
                    return { ...item, children: addFile(item.children) };
                }
                return item;
            });
        };

        // Handle root level
        if (folderPath === "/") {
            if (files.some((item) => item.name === fileName)) {
                alert("A file with this name already exists!");
                return;
            }
            setFiles([...files, newFile]);
        } else {
            setFiles(addFile(files));
        }

        // Expand the parent folder
        setExpanded((prev) => ({ ...prev, [folderPath]: true }));
    };

    // Create a new folder
    const handleCreateFolder = (folderPath: string) => {
        const folderName = prompt("Enter folder name:");
        if (!folderName) return;

        // Validate folder name
        if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) {
            alert(
                "Invalid folder name. Use only letters, numbers, dashes, and underscores."
            );
            return;
        }

        const newFolder: FileItem = {
            name: folderName,
            type: "folder",
            path:
                folderPath === "/"
                    ? `/${folderName}`
                    : `${folderPath}/${folderName}`,
            children: [],
        };

        const addFolder = (items: FileItem[]): FileItem[] => {
            return items.map((item) => {
                if (item.path === folderPath && item.type === "folder") {
                    const children = item.children || [];
                    // Check for duplicate names
                    if (children.some((child) => child.name === folderName)) {
                        alert("A folder with this name already exists!");
                        return item;
                    }
                    return { ...item, children: [...children, newFolder] };
                }
                if (item.children) {
                    return { ...item, children: addFolder(item.children) };
                }
                return item;
            });
        };

        // Handle root level
        if (folderPath === "/") {
            if (files.some((item) => item.name === folderName)) {
                alert("A folder with this name already exists!");
                return;
            }
            setFiles([...files, newFolder]);
        } else {
            setFiles(addFolder(files));
        }

        // Expand the parent folder and the new folder
        setExpanded((prev) => ({
            ...prev,
            [folderPath]: true,
            [newFolder.path]: true,
        }));
    };

    // Delete a file or folder
    const handleDeleteFile = (path: string) => {
        const deleteItem = (items: FileItem[]): FileItem[] => {
            return items.filter((item) => {
                if (item.path === path) {
                    return false; // Remove this item
                }
                if (item.children) {
                    item.children = deleteItem(item.children);
                }
                return true;
            });
        };

        setFiles(deleteItem(files));

        // If the deleted file was selected, clear selection
        if (selectedFile === path) {
            setSelectedFile(null);
            setCurrentContent("");
        }
    };

    const handleFileSelect = (file: FileItem) => {
        // Save current file content before switching
        if (selectedFile && currentContent) {
            updateFileContent(selectedFile, currentContent);
        }

        setSelectedFile(file.path);
        setCurrentContent(file.content || "");
        setCurrentLanguage(getLanguageFromFilename(file.name));
    };

    const handleToggle = (path: string) => {
        setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
    };

    // Extract code blocks from markdown
    const extractCodeFromMarkdown = (text: string): string | null => {
        // Match code blocks with optional language specifier
        const codeBlockRegex = /```(?:verilog|systemverilog|v|sv)?\s*\n([\s\S]*?)```/;
        const match = text.match(codeBlockRegex);
        
        if (match && match[1]) {
            return match[1].trim();
        }
        
        // If no code block found, check if the entire response looks like code
        const lines = text.trim().split('\n');
        const hasVerilogKeywords = /\b(module|endmodule|always|assign|wire|reg|input|output|begin|end)\b/.test(text);
        
        if (hasVerilogKeywords && lines.length > 2) {
            return text.trim();
        }
        
        return null;
    };

    const handleSendMessage = async (isAgentic: boolean = false) => {
        if (!inputValue.trim() || isLoadingChat) return;
        
        // Agentic mode requires a file to be open
        if (isAgentic && !selectedFile) {
            return;
        }

        const userMessage: Message = { role: "user", content: inputValue };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputValue("");
        setIsLoadingChat(true);
        setIsAgenticMode(isAgentic);

        // Add empty assistant message that will be filled with streaming content
        const assistantMessageIndex = updatedMessages.length;
        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "" },
        ]);

        try {
            let fullResponse = "";
            // Include code context if a file is selected
            const context = selectedFile ? {
                code: currentContent,
                filePath: selectedFile,
                language: currentLanguage,
            } : undefined;
            
            await streamChatResponse(updatedMessages, context, (chunk) => {
                fullResponse += chunk;
                
                if (isAgentic) {
                    // In agentic mode, try to extract code as we stream
                    const extractedCode = extractCodeFromMarkdown(fullResponse);
                    if (extractedCode) {
                        setProposedCode(extractedCode);
                    }
                }
                
                setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[assistantMessageIndex] = {
                        role: "assistant",
                        content: fullResponse,
                    };
                    return newMessages;
                });
            });
            
            // After streaming completes, finalize agentic mode
            if (isAgentic) {
                const extractedCode = extractCodeFromMarkdown(fullResponse);
                if (extractedCode) {
                    setProposedCode(extractedCode);
                    
                    // Update the message to show it's been applied
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages[assistantMessageIndex] = {
                            role: "assistant",
                            content: `✨ **Code changes proposed**\n\nI've suggested changes to \`${selectedFile}\`. Review the diff and accept or reject the changes.\n\n---\n\n${fullResponse}`,
                        };
                        return newMessages;
                    });
                } else {
                    // No code found, just show the response normally
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages[assistantMessageIndex] = {
                            role: "assistant",
                            content: `⚠️ No code changes detected in response.\n\n${fullResponse}`,
                        };
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[assistantMessageIndex] = {
                    role: "assistant",
                    content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure the backend is running and your OpenAI API key is configured.`,
                };
                return newMessages;
            });
        } finally {
            setIsLoadingChat(false);
            setIsAgenticMode(false);
        }
    };

    const handleSaveVersion = () => {
        if (selectedFile && currentContent) {
            const version: Version = {
                id: Date.now(),
                file: selectedFile,
                content: currentContent,
                timestamp: new Date().toISOString(),
                message: `Version saved at ${new Date().toLocaleTimeString()}`,
            };
            setVersions((prev) => [version, ...prev]);
        }
    };

    const handleDownload = () => {
        if (selectedFile && currentContent) {
            const blob = new Blob([currentContent], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = selectedFile.split("/").pop() || "file.txt";
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const newFile: FileItem = {
                name: file.name,
                type: "file",
                path: `/src/${file.name}`,
                content: e.target?.result as string,
            };

            setFiles((prev) => {
                const newFiles = [...prev];
                const srcFolder = newFiles.find((f) => f.path === "/src");
                if (srcFolder && srcFolder.children) {
                    srcFolder.children.push(newFile);
                }
                return newFiles;
            });
        };
        reader.readAsText(file);

        // Reset input
        e.target.value = "";
    };

    const handleResize = (e: React.MouseEvent, type: "sidebar" | "chat") => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = type === "sidebar" ? sidebarWidth : chatWidth;

        const handleMouseMove = (e: MouseEvent) => {
            const delta =
                type === "sidebar" ? e.clientX - startX : startX - e.clientX;
            const newWidth = Math.max(200, Math.min(600, startWidth + delta));

            if (type === "sidebar") {
                setSidebarWidth(newWidth);
            } else {
                setChatWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleEditorChange = (value: string | undefined) => {
        const newContent = value || "";
        setCurrentContent(newContent);
        if (selectedFile) {
            updateFileContent(selectedFile, newContent);
        }
    };

    const handleAcceptProposedCode = () => {
        if (proposedCode && selectedFile) {
            setCurrentContent(proposedCode);
            updateFileContent(selectedFile, proposedCode);
            setProposedCode(null);
            
            // Add a confirmation message to chat
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "✅ Changes accepted and applied to the file.",
                },
            ]);
        }
    };

    const handleRejectProposedCode = () => {
        setProposedCode(null);
        
        // Add a confirmation message to chat
        setMessages((prev) => [
            ...prev,
            {
                role: "assistant",
                content: "❌ Changes rejected. The original code remains unchanged.",
            },
        ]);
    };

    if (!started) {
        return <LandingPage onStart={() => setStarted(true)} />;
    }

    return (
        <div className="h-screen flex flex-col bg-warmth">
            <Header
                selectedFile={selectedFile}
                onUpload={handleUpload}
                onDownload={handleDownload}
                onSaveVersion={handleSaveVersion}
                aiEnabled={aiEnabled}
                onToggleAI={() => setAiEnabled(!aiEnabled)}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    files={files}
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                    onToggle={handleToggle}
                    expanded={expanded}
                    versions={versions}
                    width={sidebarWidth}
                    onDeleteFile={handleDeleteFile}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                />

                <Resizer onResize={(e) => handleResize(e, "sidebar")} />

                <div className="flex-1 flex flex-col bg-white">
                    {selectedFile ? (
                        <CodeEditor
                            value={currentContent}
                            language={currentLanguage}
                            onChange={handleEditorChange}
                            aiEnabled={aiEnabled}
                            apiUrl={apiUrl}
                            theme="vs"
                            proposedCode={proposedCode}
                            onAcceptProposal={handleAcceptProposedCode}
                            onRejectProposal={handleRejectProposedCode}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-ink opacity-50">
                            <p>Select a file to start editing</p>
                        </div>
                    )}
                </div>

                <Resizer onResize={(e) => handleResize(e, "chat")} />

                <ChatSidebar
                    messages={messages}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onSendMessage={handleSendMessage}
                    width={chatWidth}
                    isLoading={isLoadingChat}
                    hasFileOpen={selectedFile !== null}
                />
            </div>
        </div>
    );
};

export default App;
