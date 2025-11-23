import React, { useState, useRef, useEffect } from "react";
import type { FileItem, ExpandedState } from "../types";
import {
    ChevronRight,
    ChevronDown,
    FileIcon,
    FolderIcon,
    TrashIcon,
    PlusIcon,
} from "./Icons";

interface FileTreeItemProps {
    item: FileItem;
    level?: number;
    onSelect: (file: FileItem) => void;
    selectedFile: string | null;
    onToggle: (path: string) => void;
    expanded: ExpandedState;
    onDelete?: (path: string) => void;
    onCreateFile?: (folderPath: string) => void;
    onCreateFolder?: (folderPath: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
    item,
    level = 0,
    onSelect,
    selectedFile,
    onToggle,
    expanded,
    onDelete,
    onCreateFile,
    onCreateFolder,
}) => {
    const isFolder = item.type === "folder";
    const isExpanded = expanded[item.path];
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showMenu]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            onDelete?.(item.path);
            setShowMenu(false);
        }
    };

    const handleCreateFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder) {
            onCreateFile?.(item.path);
            setShowMenu(false);
        }
    };

    const handleCreateFolder = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder) {
            onCreateFolder?.(item.path);
            setShowMenu(false);
        }
    };

    return (
        <div>
            <div
                className="file-tree-item flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors rounded-md group relative"
                style={{
                    paddingLeft: `${level * 16 + 12}px`,
                    background:
                        selectedFile === item.path
                            ? "rgba(200, 92, 60, 0.12)"
                            : "transparent",
                }}
                onClick={() => {
                    if (isFolder) {
                        onToggle(item.path);
                    } else {
                        onSelect(item);
                    }
                }}
                onContextMenu={handleContextMenu}
            >
                {isFolder && (
                    <span className="flex-shrink-0 text-sage">
                        {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </span>
                )}
                <span
                    className="flex-shrink-0"
                    style={{ color: isFolder ? "#8B9A7E" : "#D4C4A8" }}
                >
                    {isFolder ? <FolderIcon /> : <FileIcon />}
                </span>
                <span className="text-sm truncate text-ink flex-1">
                    {item.name}
                </span>

                {/* Hover actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    {isFolder && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateFile?.(item.path);
                                }}
                                className="p-1 rounded hover:bg-rust hover:text-white transition-colors"
                                title="New File"
                            >
                                <PlusIcon className="w-3 h-3" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleDelete}
                        className="p-1 rounded hover:bg-rust text-gray-500 hover:text-black transition-colors"
                        title="Delete"
                    >
                        <TrashIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Context Menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="fixed bg-cream border rounded-md shadow-lg py-1 z-50"
                    style={{
                        left: `${menuPosition.x}px`,
                        top: `${menuPosition.y}px`,
                        borderColor: "rgba(42, 37, 32, 0.2)",
                        minWidth: "160px",
                    }}
                >
                    {isFolder && (
                        <>
                            <button
                                onClick={handleCreateFile}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-sand transition-colors flex items-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                New File
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-sand transition-colors flex items-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                New Folder
                            </button>
                            <div
                                className="border-t my-1"
                                style={{ borderColor: "rgba(42, 37, 32, 0.1)" }}
                            />
                        </>
                    )}
                    <button
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-rust hover:text-black transition-colors flex items-center gap-2 text-rust"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )}

            {isFolder && isExpanded && item.children && (
                <div>
                    {item.children.map((child, idx) => (
                        <FileTreeItem
                            key={idx}
                            item={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedFile={selectedFile}
                            onToggle={onToggle}
                            expanded={expanded}
                            onDelete={onDelete}
                            onCreateFile={onCreateFile}
                            onCreateFolder={onCreateFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileTreeItem;
