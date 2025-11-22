import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Editor, { DiffEditor, OnMount } from "@monaco-editor/react";
import { useMonaco } from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor";
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { FaCheck, FaTimes } from "react-icons/fa";

import { useColorMode } from "./components/ui/color-mode.tsx";
import { CompletionFormatter } from "./components/editor/completion-formatter";

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

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const debounceTimer = useRef<number>();
  const lintTimer    = useRef<number>();
  const [cachedSuggestions, setCachedSuggestions] = useState<any[]>([]);
  const suggestionsRef = useRef<any[]>([]);
  const suppressRef    = useRef(false);
  const [markers, setMarkers] = useState<monacoEditor.editor.IMarkerData[]>([]);

  // Keep latest aiEnabled in a ref
  const aiRef = useRef(aiEnabled);
  useEffect(() => { aiRef.current = aiEnabled }, [aiEnabled]);

  // LINTING
  const runLint = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    axios.post("https://api.34-83-146-113.nip.io/api/v1/lint/", { code: ed.getValue() })
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

  // AI SUGGESTIONS
  const fetchAICmds = useCallback(() => {
    const ed = editorRef.current;
    if (suppressRef.current || !ed) return;
    const model = ed.getModel();
    const pos   = ed.getPosition();
    if (!model || !pos) return;
    const offset = model.getOffsetAt(pos);
    const ctx = model.getValue().slice(0, offset);
    if (!ctx.trim()) return;

    axios.post("https://api.34-83-146-113.nip.io/api/v1/generate/", { prompt: ctx })
      .then(res => {
        let txt = res.data.text as string;
        // ─── strip fences + leading whitespace ───
        txt = txt
          .replace(/^```(?:verilog)?\s*/, "")
          .replace(/```$/, "")
          .replace(/^[\s\n]+/, "");
        if (!txt) return;
        const item = {
          insertText: txt,
          range: {
            startLineNumber: pos.lineNumber,
            startColumn: pos.column,
            endLineNumber: pos.lineNumber,
            endColumn: pos.column,
            endLineNumber: pos.lineNumber,
            endColumn: pos.column,
          },
          label: "AI Suggestion",
        };
        setCachedSuggestions(prev => {
          const next = [...prev, item].slice(-cacheSize);
          suggestionsRef.current = next;
          return next;
        });
      })
      .catch(console.error);
  }, [cacheSize]);

  const triggerAI = useCallback(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      suppressRef.current = false;
      fetchAICmds();
    }, 2000);
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

    // also normal completion items
    const complProv = monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: [" ", ",", ";", "("],
      provideCompletionItems: (model, position) => ({
        suggestions: suggestionsRef.current.map(s => ({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: s.insertText,
          range: new monaco.Range(
            s.range.startLineNumber,
            s.range.startColumn,
            s.range.endLineNumber,
            s.range.endColumn
          ),
        })),
      }),
    });

    return () => {
      inlineProv.dispose();
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
        inlineSuggest: { enabled: aiEnabled },
        quickSuggestions: { other: true, comments: false, strings: false },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: "on",
      }}
    />
  );
};

export default EditBox;
