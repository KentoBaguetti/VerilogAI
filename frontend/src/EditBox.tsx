import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Editor, { DiffEditor, OnMount } from "@monaco-editor/react";
import { useMonaco } from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor";
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { FaCheck, FaTimes } from "react-icons/fa";

import { useColorMode } from "./components/ui/color-mode.tsx";
import { CompletionFormatter } from "./components/editor/completion-formatter";
import { verilogSnippets, detectVerilogContext } from "./components/editor/verilog-snippets";

interface TextEditorProps {
  language: "verilog";
  cacheSize?: number;
  value: string;
  height?: string;
  aiEnabled?: boolean;
  onValueChange?: (newValue: string) => void;
  
  // Diff Mode Props
  modifiedValue?: string | null;
  onAcceptDiff?: () => void;
  onRejectDiff?: () => void;
}

const EditBox: React.FC<TextEditorProps> = ({
  language,
  cacheSize = 10,
  value,
  height = "100%",
  aiEnabled = false,
  onValueChange,
  modifiedValue = null,
  onAcceptDiff,
  onRejectDiff,
}) => {
  const monaco = useMonaco();
  const { colorMode } = useColorMode();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const debounceTimer = useRef<number>();
  const lintTimer    = useRef<number>();
  const [cachedSuggestions, setCachedSuggestions] = useState<any[]>([]);
  const suggestionsRef = useRef<any[]>([]);
  const suppressRef    = useRef(false);
  const [markers, setMarkers] = useState<monacoEditor.editor.IMarkerData[]>([]);
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);

  // Keep latest aiEnabled in a ref
  const aiRef = useRef(aiEnabled);
  useEffect(() => { aiRef.current = aiEnabled }, [aiEnabled]);

  // LINTING
  const runLint = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    axios.post(`${API_URL}/api/v1/lint/`, { code: ed.getValue() })
      .then(res => {
        const diags = res.data.diagnostics.map((d: any) => ({
          severity: d.severity === "error"
            ? monacoEditor.MarkerSeverity.Error
            : monacoEditor.MarkerSeverity.Warning,
          startLineNumber: d.line,
          startColumn: d.column,
          endLineNumber: d.line,
          endColumn: d.column + 1,
          message: d.message,
        }));
        setMarkers(diags);
      })
      .catch(() => {});
  }, []);
  const triggerLint = useCallback(() => {
    clearTimeout(lintTimer.current);
    lintTimer.current = window.setTimeout(runLint, 1500);
  }, [runLint]);

  // Check if cursor is in a context where AI should trigger
  const shouldTriggerAI = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return false;
    
    const model = ed.getModel();
    const pos = ed.getPosition();
    if (!model || !pos) return false;
    
    const lineText = model.getLineContent(pos.lineNumber);
    const charBefore = lineText[pos.column - 2];
    const textBeforeCursor = lineText.slice(0, pos.column - 1);
    
    // Don't trigger in comments
    if (textBeforeCursor.includes('//')) return false;
    if (textBeforeCursor.includes('/*') && !textBeforeCursor.includes('*/')) return false;
    
    // Don't trigger in strings (simple check)
    const quoteCount = (textBeforeCursor.match(/"/g) || []).length;
    if (quoteCount % 2 === 1) return false;
    
    // Require at least some context (2+ words or special trigger)
    const words = textBeforeCursor.trim().split(/\s+/);
    const hasEnoughContext = words.length >= 2;
    
    // Or trigger after special characters that typically need completion
    const triggerChars = ['(', '{', '=', ',', ';', ':', '['];
    const hasTriggerChar = triggerChars.includes(charBefore);
    
    return hasEnoughContext || hasTriggerChar;
  }, []);

  // AI SUGGESTIONS with streaming
  const fetchAICmds = useCallback(() => {
    const ed = editorRef.current;
    if (suppressRef.current || !ed) return;
    if (!shouldTriggerAI()) return;
    
    const model = ed.getModel();
    const pos = ed.getPosition();
    if (!model || !pos) return;
    
    const offset = model.getOffsetAt(pos);
    const fullText = model.getValue();
    const ctx = fullText.slice(0, offset);
    const suffix = fullText.slice(offset);
    
    // Get more context (last 500 chars before cursor)
    const contextWindow = 500;
    const contextStart = Math.max(0, ctx.length - contextWindow);
    const contextPrompt = ctx.slice(contextStart);
    
    // Get suffix context (next 200 chars)
    const suffixWindow = 200;
    const suffixContext = suffix.slice(0, suffixWindow);
    
    if (!contextPrompt.trim()) return;

    setIsLoadingCompletion(true);
    
    // Use streaming endpoint for better UX
    axios.post(`${API_URL}/api/v1/generate/`, { 
      prompt: contextPrompt, 
      suffix: suffixContext,
      max_tokens: 150,
      temperature: 0.3  // Lower temperature for more deterministic completions
    })
      .then(res => {
        let txt = res.data.text as string;
        
        // Additional cleanup
        txt = txt
          .replace(/^```(?:verilog)?\s*/, "")
          .replace(/```$/, "")
          .replace(/^[\s\n]+/, "")
          .trimEnd();
        
        if (!txt || txt.length < 2) return;
        
        // Split by newlines and limit to reasonable length
        const lines = txt.split('\n');
        const maxLines = 15;  // Limit to 15 lines for readability
        const limitedText = lines.slice(0, maxLines).join('\n');
        
        const item = {
          insertText: limitedText,
          range: {
            startLineNumber: pos.lineNumber,
            startColumn: pos.column,
            endLineNumber: pos.lineNumber,
            endColumn: pos.column,
          },
          label: "✨ AI Suggestion",
          detail: "Press Tab to accept, Esc to dismiss",
        };
        
        setCachedSuggestions(prev => {
          const next = [...prev, item].slice(-cacheSize);
          suggestionsRef.current = next;
          return next;
        });
      })
      .catch(err => {
        console.error("AI completion error:", err);
        // Don't show error to user, just silently fail
      })
      .finally(() => {
        setIsLoadingCompletion(false);
      });
  }, [cacheSize, shouldTriggerAI]);

  const triggerAI = useCallback(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      suppressRef.current = false;
      fetchAICmds();
    }, 400);  // Reduced from 600ms to 400ms for snappier response
  }, [fetchAICmds]);

  // REGISTER PROVIDERS
  useEffect(() => {
    if (!monaco) return;

    // inline ghost suggestions
    const inlineProv = monaco.languages.registerInlineCompletionsProvider(language, {
      provideInlineCompletions: (model, position) => ({
        items: suggestionsRef.current.map(s =>
          new CompletionFormatter(model, position).format(s.insertText, s.range)
        )
      }),
      freeInlineCompletions: () => {},
    });

    // Verilog snippets provider
    const snippetProv = monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: [" ", "\t"],
      provideCompletionItems: (model, position) => ({
        suggestions: verilogSnippets.map((snippet, idx) => ({
          label: snippet.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: snippet.detail,
          documentation: snippet.documentation,
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          sortText: `1_${idx}`,  // Lower priority than AI but still high
        })),
      }),
    });

    // AI completion items provider
    const complProv = monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: [" ", ",", ";", "(", "=", "{", "[", ":", "."],
      provideCompletionItems: (model, position) => ({
        suggestions: suggestionsRef.current.map(s => ({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: s.insertText,
          detail: s.detail || "AI-generated completion",
          documentation: "Generated by Codestral AI",
          range: new monaco.Range(
            s.range.startLineNumber,
            s.range.startColumn,
            s.range.endLineNumber,
            s.range.endColumn
          ),
          sortText: "0",  // Highest priority for AI suggestions
        })),
      }),
    });

    return () => {
      inlineProv.dispose();
      snippetProv.dispose();
      complProv.dispose();
    };
  }, [monaco, language]);

  // whenever suggestions change, trigger the inline widget
  useEffect(() => {
    if (!cachedSuggestions.length) return;
    setTimeout(() => {
      editorRef.current?.trigger("keyboard", "editor.action.inlineSuggest.trigger", {});
    }, 0);
  }, [cachedSuggestions]);

  // apply markers
  useEffect(() => {
    const ed = editorRef.current;
    const model = ed?.getModel();
    if (model) {
      monacoEditor.editor.setModelMarkers(model, "lint", markers);
    }
  }, [markers]);

  // clean up timers
  useEffect(() => () => {
    clearTimeout(debounceTimer.current);
    clearTimeout(lintTimer.current);
  }, []);

  const handleMount: OnMount = editor => {
    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      onValueChange?.(editor.getValue());
      triggerLint();
      if (aiRef.current) {
        suppressRef.current = false;
        suggestionsRef.current = [];
        setCachedSuggestions([]);
        triggerAI();
      }
    });

    editor.onKeyUp(e => {
      if (e.keyCode === monacoEditor.KeyCode.Escape) {
        suppressRef.current = true;
        suggestionsRef.current = [];
        setCachedSuggestions([]);
        editor.trigger("keyboard", "hideSuggestWidget", {});
        return;
      }
      // skip trivial keys
      if ([monacoEditor.KeyCode.Space, monacoEditor.KeyCode.Tab].includes(e.keyCode)) {
        triggerLint();
        return;
      }
      if (aiRef.current) {
        suppressRef.current = false;
        suggestionsRef.current = [];
        setCachedSuggestions([]);
        triggerAI();
      }
      triggerLint();
    });
  };

  // If in diff mode, render DiffEditor with overlay buttons
  if (modifiedValue !== null) {
    return (
      <Box position="relative" h={height} w="100%">
         {/* Control Bar */}
        <HStack 
          position="absolute" 
          top={2} 
          right={4} 
          zIndex={10} 
          bg="gray.800" 
          p={1} 
          borderRadius="md" 
          boxShadow="lg"
          spacing={2}
        >
            <Text color="white" fontSize="xs" px={2} fontWeight="bold">Review Changes</Text>
            <Button 
                size="xs" 
                colorScheme="green" 
                leftIcon={<FaCheck />} 
                onClick={onAcceptDiff}
            >
                Accept
            </Button>
            <Button 
                size="xs" 
                colorScheme="red" 
                leftIcon={<FaTimes />} 
                onClick={onRejectDiff}
            >
                Reject
            </Button>
        </HStack>

        <DiffEditor
          height="100%"
          width="100%"
          language={language}
          original={value}
          modified={modifiedValue}
          theme={colorMode === "dark" ? "vs-dark" : "vs"}
          options={{
            renderSideBySide: true,
            readOnly: true,
            originalEditable: false,
            diffWordWrap: "off",
          }}
        />
      </Box>
    );
  }

  return (
    <Box position="relative" height={height} width="100%">
      {/* AI Loading Indicator */}
      {aiEnabled && isLoadingCompletion && (
        <Box
          position="absolute"
          top={2}
          right={4}
          zIndex={1000}
          bg="rgba(0, 122, 204, 0.9)"
          color="white"
          px={3}
          py={1}
          borderRadius="md"
          fontSize="xs"
          fontWeight="bold"
          display="flex"
          alignItems="center"
          gap={2}
          boxShadow="lg"
        >
          <Box
            as="span"
            display="inline-block"
            width="8px"
            height="8px"
            borderRadius="full"
            bg="white"
            animation="pulse 1.5s ease-in-out infinite"
          />
          <Text as="span">AI thinking...</Text>
        </Box>
      )}
      
      <Editor
        height={height}
        width="100%"
        language={language}
        value={value}
        theme={colorMode === "dark" ? "vs-dark" : "vs"}
        onMount={handleMount}
        options={{
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
            strings: false 
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          tabCompletion: "on",
          wordBasedSuggestions: "off",  // Prefer AI over word-based
          snippetSuggestions: "top",
          suggest: {
            preview: true,
            showInlineDetails: true,
          },
        }}
      />
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </Box>
  );
};

export default EditBox;
