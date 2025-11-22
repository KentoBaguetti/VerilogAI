import React from "react";
import { FileItem, ExpandedState } from "../types";
import { ChevronRight, ChevronDown, FileIcon, FolderIcon } from "./Icons";

interface FileTreeItemProps {
    item: FileItem;
    level?: number;
    onSelect: (file: FileItem) => void;
    selectedFile: string | null;
    onToggle: (path: string) => void;
    expanded: ExpandedState;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
    item,
    level = 0,
    onSelect,
    selectedFile,
    onToggle,
    expanded,
}) => {
    const isFolder = item.type === "folder";
    const isExpanded = expanded[item.path];

    return (
        <div>
            <div
                className="file-tree-item flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors rounded-md"
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
                <span className="text-sm truncate text-ink">{item.name}</span>
            </div>
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileTreeItem;
