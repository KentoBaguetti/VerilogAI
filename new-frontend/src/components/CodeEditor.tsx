import React, { useEffect, useState, useRef, useCallback } from "react";
import Editor, { OnMount, useMonaco, DiffEditor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { API_URL } from "../config";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  aiEnabled?: boolean;
  apiUrl?: string;
  theme?: "vs" | "vs-dark";
  proposedCode?: string | null;
  onAcceptProposal?: () => void;
  onRejectProposal?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
  aiEnabled = false,
  apiUrl = API_URL,
  theme = "vs",
  proposedCode = null,
  onAcceptProposal,
  onRejectProposal,
}) => {
  const monacoInstance = useMonaco();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const debounceTimer = useRef<number | undefined>(undefined);
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);
  const aiEnabledRef = useRef(aiEnabled);
  const inlineProviderRef = useRef<monaco.IDisposable | null>(null);
  const currentSuggestionRef = useRef<string>("");

  useEffect(() => {
    aiEnabledRef.current = aiEnabled;
  }, [aiEnabled]);

  // Fetch AI completion from backend
  const fetchAICompletion = useCallback(
    async (prefix: string): Promise<string> => {
      try {
        console.log("[AI Autocomplete] Fetching completion...");

        const response = await fetch(`${apiUrl}/api/v1/generate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prefix.slice(Math.max(0, prefix.length - 1000)), // Last 1000 chars for context
            max_tokens: 150,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          console.error("[AI Autocomplete] API error:", response.status);
          return "";
        }

        const data = await response.json();
        let text = ((data.text as string) || "").trim();

        // Clean up markdown code fences if present
        text = text
          .replace(/^```(?:verilog|systemverilog|v|sv)?\s*\n?/, "")
          .replace(/\n?```\s*$/, "")
          .trim();

        console.log(
          "[AI Autocomplete] Got suggestion:",
          text.substring(0, 50) + "..."
        );
        return text;
      } catch (error) {
        console.error("[AI Autocomplete] Error:", error);
        return "";
      }
    },
    [apiUrl]
  );

  // Setup inline completions provider using Monaco's built-in API
  useEffect(() => {
    if (!monacoInstance || !aiEnabled) {
      // Clean up provider if AI is disabled
      if (inlineProviderRef.current) {
        inlineProviderRef.current.dispose();
        inlineProviderRef.current = null;
      }
      return;
    }

    console.log("[AI Autocomplete] Registering inline completion provider");

    // Register inline completions provider for all languages
    const provider = monacoInstance.languages.registerInlineCompletionsProvider(
      { pattern: "**" }, // Works for all file types
      {
        provideInlineCompletions: async (model, position) => {
          if (!aiEnabledRef.current) return { items: [] };

          const offset = model.getOffsetAt(position);
          const fullText = model.getValue();
          const prefix = fullText.slice(0, offset);

          // Skip if not enough context
          if (prefix.trim().length < 3) return { items: [] };

          // Skip in comments or strings
          const lineText = model.getLineContent(position.lineNumber);
          const textBeforeCursor = lineText.slice(0, position.column - 1);
          if (textBeforeCursor.includes("//")) return { items: [] };
          if ((textBeforeCursor.match(/"/g) || []).length % 2 === 1)
            return { items: [] };

          setIsLoadingCompletion(true);

          try {
            const completion = await fetchAICompletion(prefix);

            if (!completion) {
              return { items: [] };
            }

            currentSuggestionRef.current = completion;

            // Return inline completion item
            const item: monaco.languages.InlineCompletion = {
              insertText: completion,
              range: new monacoInstance.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
            };

            console.log("[AI Autocomplete] Providing inline completion");
            return { items: [item] };
          } catch (error) {
            console.error("[AI Autocomplete] Provider error:", error);
            return { items: [] };
          } finally {
            setIsLoadingCompletion(false);
          }
        },
        disposeInlineCompletions: () => {
          // Cleanup if needed
        },
      }
    );

    inlineProviderRef.current = provider;

    return () => {
      if (provider) {
        provider.dispose();
      }
    };
  }, [monacoInstance, aiEnabled, fetchAICompletion]);

  // Handle editor mount
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    console.log("[AI Autocomplete] Editor mounted");

    // Handle content changes
    editor.onDidChangeModelContent(() => {
      onChange?.(editor.getValue());
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      if (inlineProviderRef.current) {
        inlineProviderRef.current.dispose();
      }
    };
  }, []);

  // Diff view for proposed code
  if (proposedCode) {
    return (
      <div className="flex-1 h-full relative">
        <div
          className="absolute top-4 right-4 z-50 flex gap-2 bg-white rounded-lg shadow-lg p-2 border"
          style={{ borderColor: "#D4C4A8" }}
        >
          <span className="text-sm font-medium text-ink px-2 py-1">
            Review Changes
          </span>
          <button
            onClick={onAcceptProposal}
            className="px-4 py-1.5 rounded-md text-white font-medium text-sm flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: "#8B9A7E" }}
          >
            Accept
          </button>
          <button
            onClick={onRejectProposal}
            className="px-4 py-1.5 rounded-md text-white font-medium text-sm flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: "#C85C3C" }}
          >
            Reject
          </button>
        </div>

        <DiffEditor
          height="100%"
          language={language}
          original={value}
          modified={proposedCode}
          theme={theme}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            readOnly: true,
            renderSideBySide: true,
            diffWordWrap: "on",
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full relative">
      {/* AI Loading Indicator */}
      {aiEnabled && isLoadingCompletion && (
        <div className="absolute top-4 right-4 z-50 bg-rust text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 shadow-lg">
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span>AI thinking...</span>
        </div>
      )}

      {/* Inline suggestion hint */}
      {aiEnabled && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-lg opacity-0 hover:opacity-100 transition-opacity">
          AI Autocomplete: Press Tab to accept
        </div>
      )}

      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        onMount={handleEditorMount}
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
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          formatOnType: true,
          formatOnPaste: true,
          trimAutoWhitespace: true,
          renderValidationDecorations: "on",
          // Monaco's built-in inline suggestions configuration
          inlineSuggest: {
            enabled: aiEnabled,
            mode: "subwordSmart",
            suppressSuggestions: false,
          },
          // Disable default Monaco suggestions to avoid conflicts
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          wordBasedSuggestions: "off",
          snippetSuggestions: "none",
          acceptSuggestionOnEnter: "off",
          // Tab accepts inline suggestions when available
          tabCompletion: "off",
        }}
      />
    </div>
  );
};

export default CodeEditor;
