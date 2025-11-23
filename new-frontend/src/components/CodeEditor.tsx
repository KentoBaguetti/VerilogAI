import React, { useEffect, useState, useRef, useCallback } from "react";
import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import {
    verilogSnippets,
    detectVerilogContext,
    buildVerilogPromptContext,
    extractModuleInfo,
    type VerilogSnippet,
} from "./editor/verilog-snippets";

interface CodeEditorProps {
    value: string;
    language: string;
    onChange: (value: string | undefined) => void;
    aiEnabled?: boolean;
    apiUrl?: string;
    theme?: "vs" | "vs-dark";
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
            const response = await fetch(`${apiUrl}/api/v1/chat/stream/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: enhancedPrompt,
                    suffix: suffixContext,
                    max_tokens: 150,
                    temperature: 0.3,
                    language: "verilog", // Specify language for better results
                    context_type: verilogContext, // Pass context type to backend
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

        // Verilog snippets provider (highest priority for keywords/patterns)
        const verilogSnippetsProvider =
            monacoInstance.languages.registerCompletionItemProvider(language, {
                triggerCharacters: [" ", "\t", "\n"],
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
                            sortText: `1_${idx}`, // High priority but below AI
                        })),
                    };
                },
            });

        // Inline completions provider (ghost text)
        const inlineProvider =
            monacoInstance.languages.registerInlineCompletionsProvider(
                language,
                {
                    provideInlineCompletions: (model, position) => {
                        return {
                            items: suggestionsRef.current.map((suggestion) => ({
                                insertText: suggestion.insertText,
                                range: new monacoInstance.Range(
                                    position.lineNumber,
                                    position.column,
                                    position.lineNumber,
                                    position.column
                                ),
                                command: undefined,
                            })),
                        };
                    },
                    freeInlineCompletions: () => {},
                }
            );

        // AI completion provider (dropdown with highest priority)
        const completionProvider =
            monacoInstance.languages.registerCompletionItemProvider(language, {
                triggerCharacters: [
                    " ",
                    ",",
                    ";",
                    "(",
                    "=",
                    "{",
                    "[",
                    ":",
                    ".",
                    "@",
                ],
                provideCompletionItems: (model, position) => {
                    return {
                        suggestions: suggestionsRef.current.map((s) => ({
                            label: s.label,
                            kind: monacoInstance.languages.CompletionItemKind
                                .Snippet,
                            insertText: s.insertText,
                            detail:
                                s.detail || "AI-generated Verilog completion",
                            documentation:
                                "Generated by AI based on your Verilog code context",
                            range: new monacoInstance.Range(
                                s.range.startLineNumber,
                                s.range.startColumn,
                                s.range.endLineNumber,
                                s.range.endColumn
                            ),
                            sortText: "0", // Highest priority
                        })),
                    };
                },
            });

        return () => {
            verilogSnippetsProvider.dispose();
            inlineProvider.dispose();
            completionProvider.dispose();
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
                    inlineSuggest: {
                        enabled: aiEnabled,
                        mode: "prefix",
                        suppressSuggestions: false,
                    },
                    quickSuggestions: {
                        other: aiEnabled ? "inline" : true,
                        comments: false,
                        strings: false,
                    },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: "on",
                    tabCompletion: "on",
                    wordBasedSuggestions: "off",
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
