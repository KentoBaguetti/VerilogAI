import React, { useEffect, useState, useRef, useCallback } from "react";
import Editor, { OnMount, useMonaco, DiffEditor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import {
    verilogSnippets,
    detectVerilogContext,
    buildVerilogPromptContext,
    extractModuleInfo,
    type VerilogSnippet,
} from "./editor/verilog-snippets";
import { CompletionFormatter } from "./editor/completion-formatter";

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

interface CompletionItem {
    insertText: string;
    range: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
    };
    label: string;
    detail?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    language,
    onChange,
    aiEnabled = false,
    apiUrl = "http://localhost:8000",
    theme = "vs",
    proposedCode = null,
    onAcceptProposal,
    onRejectProposal,
}) => {
    const monacoInstance = useMonaco();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const debounceTimer = useRef<number>();
    const [cachedSuggestions, setCachedSuggestions] = useState<
        CompletionItem[]
    >([]);
    const suggestionsRef = useRef<CompletionItem[]>([]);
    const suppressRef = useRef(false);
    const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);
    const aiEnabledRef = useRef(aiEnabled);

    // Keep aiEnabled in sync
    useEffect(() => {
        aiEnabledRef.current = aiEnabled;
    }, [aiEnabled]);

    // Check if cursor is in a valid context for AI suggestions
    const shouldTriggerAI = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return false;

        const model = editor.getModel();
        const position = editor.getPosition();
        if (!model || !position) return false;

        const lineText = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineText.slice(0, position.column - 1);

        // Don't trigger in comments
        if (textBeforeCursor.includes("//")) return false;
        if (textBeforeCursor.includes("/*") && !textBeforeCursor.includes("*/"))
            return false;

        // Don't trigger in strings
        const quoteCount = (textBeforeCursor.match(/"/g) || []).length;
        if (quoteCount % 2 === 1) return false;

        // Require some context
        const words = textBeforeCursor.trim().split(/\s+/);
        const hasEnoughContext = words.length >= 2;

        // Or trigger after special characters
        const charBefore = lineText[position.column - 2];
        const triggerChars = ["(", "{", "=", ",", ";", ":", "[", "."];
        const hasTriggerChar = triggerChars.includes(charBefore);

        return hasEnoughContext || hasTriggerChar;
    }, []);

    // Fetch AI completions with Verilog-specific context
    const fetchAICompletions = useCallback(async () => {
        const editor = editorRef.current;
        if (suppressRef.current || !editor || !aiEnabledRef.current) return;
        if (!shouldTriggerAI()) return;

        const model = editor.getModel();
        const position = editor.getPosition();
        if (!model || !position) return;

        const offset = model.getOffsetAt(position);
        const fullText = model.getValue();
        const prefix = fullText.slice(0, offset);
        const suffix = fullText.slice(offset);

        // Detect Verilog context
        const verilogContext = detectVerilogContext(prefix);

        // Extract module info if available
        const moduleInfo = extractModuleInfo(fullText);

        // Build Verilog-aware context prompt
        const contextWindow = 500;
        const contextStart = Math.max(0, prefix.length - contextWindow);
        const rawContext = prefix.slice(contextStart);

        // Add Verilog-specific context hints
        const contextPrompt = buildVerilogPromptContext(rawContext);

        // Add module context if available
        let enhancedPrompt = contextPrompt;
        if (moduleInfo) {
            enhancedPrompt = `// Module: ${
                moduleInfo.name
            }\n// Ports: ${moduleInfo.ports.join(", ")}\n${contextPrompt}`;
        }

        // Add context type hint
        if (verilogContext) {
            enhancedPrompt = `// Current context: ${verilogContext}\n${enhancedPrompt}`;
        }

        // Get suffix context (next 200 chars)
        const suffixWindow = 200;
        const suffixContext = suffix.slice(0, suffixWindow);

        if (!contextPrompt.trim()) return;

        setIsLoadingCompletion(true);

        try {
            const response = await fetch(`${apiUrl}/api/v1/generate/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: enhancedPrompt,
                }),
            });

            if (!response.ok) throw new Error("API request failed");

            const data = await response.json();
            let text = data.text as string;

            // Clean up the completion (remove markdown, extra whitespace)
            text = text
                .replace(/^```(?:verilog|systemverilog)?\s*/, "")
                .replace(/```$/, "")
                .replace(/^[\s\n]+/, "")
                .trimEnd();

            if (!text || text.length < 2) return;

            // Limit to reasonable length (15 lines max for Verilog)
            const lines = text.split("\n");
            const maxLines = 15;
            const limitedText = lines.slice(0, maxLines).join("\n");

            const item: CompletionItem = {
                insertText: limitedText,
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                },
                label: "✨ AI Suggestion",
                detail: `Press Tab to accept, Esc to dismiss${
                    verilogContext ? ` (${verilogContext})` : ""
                }`,
            };

            setCachedSuggestions((prev) => {
                const next = [...prev, item].slice(-10); // Keep last 10
                suggestionsRef.current = next;
                return next;
            });
        } catch (error) {
            console.error("AI completion error:", error);
        } finally {
            setIsLoadingCompletion(false);
        }
    }, [apiUrl, shouldTriggerAI]);

    // Debounced AI trigger
    const triggerAI = useCallback(() => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = window.setTimeout(() => {
            suppressRef.current = false;
            fetchAICompletions();
        }, 400);
    }, [fetchAICompletions]);

    // Register completion providers
    useEffect(() => {
        if (!monacoInstance) return;

        // Verilog snippets provider (for keywords/patterns dropdown)
        const verilogSnippetsProvider =
            monacoInstance.languages.registerCompletionItemProvider(language, {
                triggerCharacters: [" ", "\t"],
                provideCompletionItems: (model, position) => {
                    const lineContent = model.getLineContent(
                        position.lineNumber
                    );
                    const textBeforeCursor = lineContent.slice(
                        0,
                        position.column - 1
                    );

                    // Don't provide snippets in comments or strings
                    if (textBeforeCursor.includes("//"))
                        return { suggestions: [] };
                    if ((textBeforeCursor.match(/"/g) || []).length % 2 === 1)
                        return { suggestions: [] };

                    return {
                        suggestions: verilogSnippets.map((snippet, idx) => ({
                            label: snippet.label,
                            kind: monacoInstance.languages.CompletionItemKind
                                .Snippet,
                            insertText: snippet.insertText,
                            insertTextRules:
                                monacoInstance.languages
                                    .CompletionItemInsertTextRule
                                    .InsertAsSnippet,
                            detail: snippet.detail,
                            documentation: snippet.documentation,
                            range: new monacoInstance.Range(
                                position.lineNumber,
                                position.column,
                                position.lineNumber,
                                position.column
                            ),
                            sortText: `1_${idx}`,
                        })),
                    };
                },
            });

        // Inline completions provider (ghost text for AI suggestions)
        const inlineProvider =
            monacoInstance.languages.registerInlineCompletionsProvider(
                language,
                {
                    provideInlineCompletions: (model, position) => {
                        // Use CompletionFormatter to properly format inline suggestions
                        return {
                            items: suggestionsRef.current.map((suggestion) => {
                                const formatted = new CompletionFormatter(
                                    model,
                                    position
                                ).format(suggestion.insertText, suggestion.range);
                                
                                return {
                                    insertText: formatted.insertText,
                                    range: new monacoInstance.Range(
                                        formatted.range.startLineNumber,
                                        formatted.range.startColumn,
                                        formatted.range.endLineNumber,
                                        formatted.range.endColumn
                                    ),
                                    command: undefined,
                                };
                            }),
                        };
                    },
                    freeInlineCompletions: () => {},
                }
            );

        return () => {
            verilogSnippetsProvider.dispose();
            inlineProvider.dispose();
        };
    }, [monacoInstance, language]);

    // Trigger inline suggestions when suggestions change
    useEffect(() => {
        if (!cachedSuggestions.length) return;
        setTimeout(() => {
            editorRef.current?.trigger(
                "keyboard",
                "editor.action.inlineSuggest.trigger",
                {}
            );
        }, 0);
    }, [cachedSuggestions]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            clearTimeout(debounceTimer.current);
        };
    }, []);

    const handleEditorMount: OnMount = (editor) => {
        editorRef.current = editor;

        // Handle content changes
        editor.onDidChangeModelContent(() => {
            onChange?.(editor.getValue());

            if (aiEnabledRef.current) {
                suppressRef.current = false;
                suggestionsRef.current = [];
                setCachedSuggestions([]);
                triggerAI();
            }
        });

        // Handle key events
        editor.onKeyUp((e) => {
            if (e.keyCode === monaco.KeyCode.Escape) {
                suppressRef.current = true;
                suggestionsRef.current = [];
                setCachedSuggestions([]);
                editor.trigger("keyboard", "hideSuggestWidget", {});
                return;
            }

            // Skip trivial keys
            if (
                [monaco.KeyCode.Space, monaco.KeyCode.Tab].includes(e.keyCode)
            ) {
                return;
            }

            if (aiEnabledRef.current) {
                suppressRef.current = false;
                suggestionsRef.current = [];
                setCachedSuggestions([]);
                triggerAI();
            }
        });
    };

    // If we have proposed code, show diff view
    if (proposedCode) {
        return (
            <div className="flex-1 h-full relative">
                {/* Control Bar for Diff */}
                <div className="absolute top-4 right-4 z-50 flex gap-2 bg-white rounded-lg shadow-lg p-2 border"
                     style={{ borderColor: "#D4C4A8" }}>
                    <span className="text-sm font-medium text-ink px-2 py-1">Review Changes</span>
                    <button
                        onClick={onAcceptProposal}
                        className="px-4 py-1.5 rounded-md text-white font-medium text-sm flex items-center gap-2 transition-all hover:scale-105"
                        style={{ background: "#8B9A7E" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                        </svg>
                        Accept
                    </button>
                    <button
                        onClick={onRejectProposal}
                        className="px-4 py-1.5 rounded-md text-white font-medium text-sm flex items-center gap-2 transition-all hover:scale-105"
                        style={{ background: "#C85C3C" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
                        </svg>
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
                    // Inline suggestions (ghost text) - Cursor-like behavior
                    inlineSuggest: {
                        enabled: aiEnabled,
                        mode: "prefix",
                        suppressSuggestions: false,
                    },
                    // Configure quickSuggestions for inline mode when AI is enabled
                    quickSuggestions: {
                        other: aiEnabled ? "inline" : true,
                        comments: false,
                        strings: false,
                    },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: "on",
                    tabCompletion: "on",
                    wordBasedSuggestions: "off", // Prefer AI over word-based
                    snippetSuggestions: "top",
                    suggest: {
                        preview: true,
                        showInlineDetails: true,
                    },
                }}
            />
        </div>
    );
};

export default CodeEditor;
