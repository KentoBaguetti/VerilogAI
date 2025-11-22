import React from "react";

export const ChevronRight: React.FC<{ className?: string }> = ({
    className,
}) => (
    <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
    >
        <path
            d="M6 12L10 8L6 4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ChevronDown: React.FC<{ className?: string }> = ({
    className,
}) => (
    <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
    >
        <path
            d="M4 6L8 10L12 6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
    >
        <path
            d="M9 1H3C2.44772 1 2 1.44772 2 2V14C2 14.5523 2.44772 15 3 15H13C13.5523 15 14 14.5523 14 14V6L9 1Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 1V6H14"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
    >
        <path
            d="M2 3.5C2 2.67157 2.67157 2 3.5 2H6L7.5 4H12.5C13.3284 4 14 4.67157 14 5.5V12.5C14 13.3284 13.3284 14 12.5 14H3.5C2.67157 14 2 13.3284 2 12.5V3.5Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
    >
        <path
            d="M18 2L9 11"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M18 2L12 18L9 11L2 8L18 2Z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({
    className,
}) => (
    <svg
        className={className}
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
    >
        <path
            d="M16 11V14C16 15.1046 15.1046 16 14 16H4C2.89543 16 2 15.1046 2 14V11"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 12V2M9 12L5 8M9 12L13 8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
    >
        <path
            d="M16 11V14C16 15.1046 15.1046 16 14 16H4C2.89543 16 2 15.1046 2 14V11"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 2V12M9 2L5 6M9 2L13 6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const HistoryIcon: React.FC<{ className?: string }> = ({
    className,
}) => (
    <svg
        className={className}
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
    >
        <path
            d="M3 9C3 5.68629 5.68629 3 9 3C12.3137 3 15 5.68629 15 9C15 12.3137 12.3137 15 9 15C7.67392 15 6.44632 14.5582 5.46447 13.8139"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <path
            d="M9 5V9L11.5 11.5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M3 9H1M3 6L1.5 4.5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
