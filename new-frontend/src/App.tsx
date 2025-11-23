import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatSidebar from "./components/ChatSidebar";
import CodeEditor from "./components/CodeEditor";
import Resizer from "./components/Resizer";
import type { FileItem, Message, Version, ExpandedState } from "./types";

async function generateCode(prompt: string, suffix = "") {
    const res = await fetch(`http://localhost:8000/api/v1/chat/stream/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt,
            suffix,
            max_tokens: 150,
            temperature: 0.4,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to generate");
    }

    const data = (await res.json()) as { text: string };
    return data.text;
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

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = { role: "user", content: inputValue };
        setMessages((prev) => [...prev, userMessage]);

        const reply = await generateCode(inputValue);

        // const reply: Message = {
        //     role: "assistant",
        //     content: "placeholder response",
        // };

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

        setInputValue("");
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
                />
            </div>
        </div>
    );
};

export default App;
