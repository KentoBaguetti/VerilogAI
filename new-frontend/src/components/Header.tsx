import React from "react";
import { UploadIcon, DownloadIcon, HistoryIcon } from "./Icons";

interface HeaderProps {
    selectedFile: string | null;
    onUploadClick: () => void;
    onDownload: () => void;
    onSaveVersion: () => void;
    onGenerateTestbench?: () => void;
    aiEnabled?: boolean;
    onToggleAI?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    selectedFile,
    onUploadClick,
    onDownload,
    onSaveVersion,
    onGenerateTestbench,
    aiEnabled = false,
    onToggleAI,
}) => {
    return (
        <div
            className="flex items-center justify-between px-6 py-4 border-b grain bg-cream"
            style={{ borderColor: "rgba(42, 37, 32, 0.08)" }}
        >
            <div className="flex items-center gap-4">
                <h1 className="font-serif text-2xl font-bold text-ink">
                    ArchiTECH
                </h1>
                <span className="text-sm text-ink opacity-50">
                    {selectedFile
                        ? selectedFile.split("/").pop()
                        : "No file selected"}
                </span>
            </div>
            <div className="flex items-center gap-3">
                {/* AI Toggle */}
                {onToggleAI && (
                    <button
                        onClick={onToggleAI}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all hover:scale-105 ${
                            aiEnabled
                                ? "bg-rust text-black"
                                : "bg-sand text-ink"
                        }`}
                        title={
                            aiEnabled
                                ? "Disable AI Autocomplete"
                                : "Enable AI Autocomplete"
                        }
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                d="M8 2L10 6L14 7L10 8L8 12L6 8L2 7L6 6L8 2Z"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="text-sm font-medium">
                            AI {aiEnabled ? "On" : "Off"}
                        </span>
                    </button>
                )}

                {onGenerateTestbench && (
                    <button
                        onClick={onGenerateTestbench}
                        disabled={!selectedFile}
                        className="flex items-center gap-2 px-4 py-2 rounded-md transition-all hover:scale-105 disabled:opacity-50 text-black"
                        style={{ background: selectedFile ? "#8B9A7E" : "#ccc" }}
                        title="Generate Testbench (VerilogAI-TB)"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                        >
                            <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                        </svg>
                        <span className="text-sm">Gen TB</span>
                    </button>
                )}
                <button
                    onClick={onUploadClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-md transition-all hover:scale-105 bg-sage text-black"
                    title="Upload Files"
                >
                    <UploadIcon />
                    <span className="text-sm">Upload</span>
                </button>
                <button
                    onClick={onDownload}
                    disabled={!selectedFile}
                    className="flex items-center gap-2 px-4 py-2 rounded-md transition-all hover:scale-105 disabled:opacity-50 bg-sage text-black"
                    title="Download File"
                >
                    <DownloadIcon />
                    <span className="text-sm">Download</span>
                </button>
                <button
                    onClick={onSaveVersion}
                    disabled={!selectedFile}
                    className="flex items-center gap-2 px-4 py-2 rounded-md transition-all hover:scale-105 disabled:opacity-50 bg-rust text-black"
                    title="Save Version"
                >
                    <HistoryIcon />
                    <span className="text-sm">Save Version</span>
                </button>
            </div>
        </div>
    );
};

export default Header;
