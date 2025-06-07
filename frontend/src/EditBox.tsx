// EditBox.tsx

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

  /** Initial text to load into the editor */
  initialValue?: string;
  /** Called whenever the editor content changes */
  onValueChange?: (newValue: string) => void;
}

const EditBox: React.FC<TextEditorProps> = ({
  language,
  cacheSize = 10,
  initialValue = "// Enter code",
  onValueChange,
}) => {
  const monaco = useMonaco();
  const { colorMode } = useColorMode();

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const debounceTimerRef = useRef<number>();
  const [cachedSuggestions, setCachedSuggestions] = useState<any[]>([]);
  const suggestionsRef = useRef<any[]>([]);
  const suppressSuggestionsRef = useRef(false);

  // Debounced AI fetch
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
      .post("http://localhost:8000/api/v1/generate/", { prompt: textBeforeCursor })
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

  // Debounce wrapper
  const triggerSuggestionsAfterPause = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      suppressSuggestionsRef.current = false;
      debouncedSuggestions();
    }, 2000);
  }, [debouncedSuggestions]);

  // Register inline‐suggest provider
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

  // Trigger Monaco to show suggestions
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

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(debounceTimerRef.current);
  }, []);

  // onMount handler
  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Propagate content changes
    editor.onDidChangeModelContent(() => {
      const val = editor.getValue();
      onValueChange?.(val);
    });

    // KeyUp logic for suppression, skip, and debounce
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

      suppressSuggestionsRef.current = false;
      suggestionsRef.current = [];
      setCachedSuggestions([]);
      triggerSuggestionsAfterPause();
    });
  };

  return (
    <Editor
      height="90vh"
      width="100%"
      defaultLanguage={language}
      defaultValue={initialValue}
      theme={colorMode === "dark" ? "vs" : "vs-dark"}
      options={{
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        formatOnType: true,
        formatOnPaste: true,
        trimAutoWhitespace: true,
        inlineSuggest: { enabled: true },
      }}
      onMount={handleMount}
    />
  );
};

export default EditBox;
