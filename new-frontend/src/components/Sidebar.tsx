import React from "react";
import type { FileItem, ExpandedState, Version } from "../types";
import FileTreeItem from "./FileTreeItem";
import { PlusIcon, FolderPlusIcon } from "./Icons";

interface SidebarProps {
    files: FileItem[];
    selectedFile: string | null;
    onFileSelect: (file: FileItem) => void;
    onToggle: (path: string) => void;
    expanded: ExpandedState;
    versions: Version[];
    width: number;
    onDeleteFile?: (path: string) => void;
    onCreateFile?: (folderPath: string) => void;
    onCreateFolder?: (folderPath: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    files,
    selectedFile,
    onFileSelect,
    onToggle,
    expanded,
    versions,
    width,
    onDeleteFile,
    onCreateFile,
    onCreateFolder,
}) => {
    return (
        <div
            className="flex flex-col border-r grain bg-cream"
            style={{
                width: `${width}px`,
                borderColor: "rgba(42, 37, 32, 0.08)",
            }}
        >
            <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: "rgba(42, 37, 32, 0.08)" }}
            >
                <h2 className="text-sm font-semibold text-ink">Files</h2>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onCreateFile?.("/")}
                        className="p-1.5 rounded hover:bg-sand transition-colors"
                        title="New File"
                    >
                        <PlusIcon className="w-4 h-4 text-ink" />
                    </button>
                    <button
                        onClick={() => onCreateFolder?.("/")}
                        className="p-1.5 rounded hover:bg-sand transition-colors"
                        title="New Folder"
                    >
                        <FolderPlusIcon className="w-4 h-4 text-ink" />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {files.map((item, idx) => (
                    <FileTreeItem
                        key={idx}
                        item={item}
                        onSelect={onFileSelect}
                        selectedFile={selectedFile}
                        onToggle={onToggle}
                        expanded={expanded}
                        onDelete={onDeleteFile}
                        onCreateFile={onCreateFile}
                        onCreateFolder={onCreateFolder}
                    />
                ))}
            </div>

            {/* Version History */}
            {versions.length > 0 && (
                <div
                    className="border-t p-3"
                    style={{ borderColor: "rgba(42, 37, 32, 0.08)" }}
                >
                    <h3 className="text-xs font-semibold mb-2 text-ink opacity-70">
                        Version History ({versions.length})
                    </h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {versions.slice(0, 5).map((v) => (
                            <div
                                key={v.id}
                                className="text-xs p-2 rounded cursor-pointer transition-colors"
                                style={{
                                    background: "rgba(139, 154, 126, 0.1)",
                                }}
                                title={v.message}
                            >
                                <div className="truncate text-ink">
                                    {v.file.split("/").pop()}
                                </div>
                                <div className="text-ink opacity-50">
                                    {new Date(v.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
