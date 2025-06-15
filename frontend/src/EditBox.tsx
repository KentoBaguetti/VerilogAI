import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Editor, { OnMount } from "@monaco-editor/react";
import { useMonaco } from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor";

import { useColorMode } from "./components/ui/color-mode.tsx";
import { CompletionFormatter } from "./components/editor/completion-formatter";

interface TextEditorProps {
  language: "verilog";
  cacheSize?: number;
  value: string; // ✅ Controlled input
  aiEnabled?: boolean;
  onValueChange?: (newValue: string) => void;
}

const EditBox: React.FC<TextEditorProps> = ({
  language,
  cacheSize = 10,
  value,
  aiEnabled = false,
  onValueChange,
}) => {
  const monaco = useMonaco();
  const { colorMode } = useColorMode();

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const debounceTimerRef = useRef<number>();
  const lintTimer = useRef<number>();
  const [cachedSuggestions, setCachedSuggestions] = useState<any[]>([]);
  const suggestionsRef = useRef<any[]>([]);
  const suppressSuggestionsRef = useRef(false);
  const [markers, setMarkers] = useState<monacoEditor.editor.IMarkerData[]>([]);

  const aiEnabledRef = useRef(aiEnabled);
  useEffect(() => {
    aiEnabledRef.current = aiEnabled;
  }, [aiEnabled]);

  const debouncedSuggestions = useCallback(() => {
    const editor = editorRef.current;
    if (suppressSuggestionsRef.current || !editor) return;

    const model = editor.getModel();
    if (!model) {
      setCachedSuggestions([]);
      return;
    }

    const position = editor.getPosition();
    if (!position) return;

    const offset = model.getOffsetAt(position);
    const textBeforeCursor = model.getValue().substring(0, offset);
    if (!textBeforeCursor) return;

    axios
      .post("https://api.34-83-146-113.nip.io/api/v1/generate/", { prompt: textBeforeCursor })
      .then((res) => {
        const newCompletion = res.data.text;
        if (!newCompletion || typeof newCompletion !== "string") return;

        const newSuggestion = {
          insertText: newCompletion,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          label: "AI Suggestion",
        };

        setCachedSuggestions((prev) => {
          const updated = [...prev, newSuggestion].slice(-cacheSize);
          suggestionsRef.current = updated;
          return updated;
        });
      })
      .catch((err) => console.error("Axios request failed:", err));
  }, [cacheSize]);

  const triggerSuggestionsAfterPause = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      suppressSuggestionsRef.current = false;
      debouncedSuggestions();
    }, 2000);
  }, [debouncedSuggestions]);

  const runLint = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const code = editor.getValue();
    axios
      .post("https://api.34-83-146-113.nip.io/api/v1/lint/", { code })
      .then((res) => {
        const diags = res.data.diagnostics.map((d: any) => ({
          severity:
            d.severity === "error"
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
    lintTimer.current = window.setTimeout(runLint, 2000);
  }, [runLint]);

  useEffect(() => {
    if (!monaco) return;
    const provider = monaco.languages.registerInlineCompletionsProvider(language, {
      provideInlineCompletions: (model, position) => ({
        items: suggestionsRef.current.map((s) =>
          new CompletionFormatter(model, position).format(s.insertText, s.range)
        ),
      }),
      freeInlineCompletions: () => {},
    });
    return () => provider.dispose();
  }, [monaco, language]);

  useEffect(() => {
    if (cachedSuggestions.length === 0) return;
    setTimeout(() => {
      editorRef.current?.trigger(
        "keyboard",
        "editor.action.inlineSuggest.trigger",
        {}
      );
    }, 0);
  }, [cachedSuggestions]);

  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (model) monacoEditor.editor.setModelMarkers(model, "lint", markers);
  }, [markers]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceTimerRef.current);
      clearTimeout(lintTimer.current);
    };
  }, []);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      const val = editor.getValue();
      onValueChange?.(val);
      triggerLint();

      if (aiEnabledRef.current) {
        suppressSuggestionsRef.current = false;
        suggestionsRef.current = [];
        setCachedSuggestions([]);
        triggerSuggestionsAfterPause();
      }
    });

    editor.onKeyUp((e) => {
      const skip = [
        monacoEditor.KeyCode.Space,
        monacoEditor.KeyCode.Backspace,
        monacoEditor.KeyCode.Tab,
      ];

      if (e.keyCode === monacoEditor.KeyCode.Escape) {
        suppressSuggestionsRef.current = true;
        suggestionsRef.current = [];
        setCachedSuggestions([]);
        editor.trigger("keyboard", "hideSuggestWidget", {});
        return;
      }
      if (skip.includes(e.keyCode)) return;

      if (aiEnabledRef.current) {
        suppressSuggestionsRef.current = false;
        suggestionsRef.current = [];
        setCachedSuggestions([]);
        triggerSuggestionsAfterPause();
      }

      triggerLint();
    });
  };

  return (
    <Editor
      height="90vh"
      width="100%"
      language={language}
      value={value} // ✅ Fully controlled
      theme={colorMode === "dark" ? "vs" : "vs-dark"}
      options={{
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        formatOnType: true,
        formatOnPaste: true,
        trimAutoWhitespace: true,
        inlineSuggest: { enabled: aiEnabled },
        renderValidationDecorations: "on",
      }}
      onMount={handleMount}
    />
  );
};

export default EditBox;
