export interface FileItem {
    name: string;
    type: "file" | "folder";
    path: string;
    content?: string;
    children?: FileItem[];
}

export interface Message {
    role: "user" | "assistant";
    content: string;
}

export interface Version {
    id: number;
    file: string;
    content: string;
    timestamp: string;
    message: string;
}

export interface ExpandedState {
    [key: string]: boolean;
}
