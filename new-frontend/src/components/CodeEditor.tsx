import Editor from "@monaco-editor/react";

interface CodeEditorProps {
    value: string;
    language: string;
    onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    language,
    onChange,
}) => {
    return (
        <div className="flex-1 h-full">
            <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                value={value}
                onChange={onChange}
                theme="vs"
                options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    tabSize: 2,
                    wordWrap: "on",
                }}
            />
        </div>
    );
};

export default CodeEditor;
