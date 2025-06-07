// App.tsx
import React, { useState, useEffect } from "react";
import { Box, Heading } from "@chakra-ui/react";
import EditBox from "./EditBox";
import Editor from "@monaco-editor/react";
import { Button } from "./components/ui/button.tsx";
import axios from "axios";

type Tab = "editor" | "testbench";

const App: React.FC = () => {
  // which tab
  const [activeTab, setActiveTab] = useState<Tab>("editor");

  // verilog code & ai testbench
  const [codeValue, setCodeValue] = useState<string>(
    `// Enter code\n`
  );
  const [testbenchValue, setTestbenchValue] = useState<string>("");

  // loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // when we switch to testbench, and it's empty, call the backend
  useEffect(() => {
    if (activeTab !== "testbench") return;
    if (testbenchValue.trim()) return; // already have one

    setLoading(true);
    setError(null);

    const prompt = `
You are a Verilog verification expert. Given this module, generate a complete testbench. Only return the testbench code, do not repeat the module:

${codeValue}
`;

    axios
      .post("http://localhost:8000/api/v1/generate/", { prompt })
      .then((resp) => setTestbenchValue(resp.data.text || ""))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.detail || err.message);
      })
      .finally(() => setLoading(false));
  }, [activeTab, codeValue, testbenchValue]);

  return (
    <Box minH="100vh" bg="#0f0a19" px={6} py={8}>
        <Heading 
        as="h1" 
        size="3xl" 
        color="silver" 
        textAlign="center" 
        mb={6}
      >
        Verilog AI
      </Heading>
      {/* tab buttons */}
      <Box display="flex" mb={4}>
        <Button
          onClick={() => setActiveTab("editor")}
          style={{
            marginRight: 8,
            background: activeTab === "editor" ? "#007acc" : "#444",
            color: "white",
          }}
        >
          Editor
        </Button>
        <Button
          onClick={() => setActiveTab("testbench")}
          style={{
            background: activeTab === "testbench" ? "#007acc" : "#444",
            color: "white",
          }}
        >
          Testbench
        </Button>
      </Box>

      {/* content */}
      {activeTab === "editor" ? (
        <EditBox
          language="verilog"
          cacheSize={10}
          initialValue={codeValue}
          onValueChange={(v) => {
            setCodeValue(v);
            setTestbenchValue(""); // clear old TB so it regenerates
          }}
        />
      ) : (
        <Box>
          <Box
            pb={2}
            mb={2}
            borderBottom="1px solid #333"
            color="white"
            fontWeight="bold"
          >
            AI‐Generated Testbench{" "}
            {loading && <span style={{ marginLeft: 8 }}>Generating…</span>}
            {error && (
              <span style={{ marginLeft: 8, color: "crimson" }}>
                Error: {error}
              </span>
            )}
          </Box>
          <Editor
            height="90vh"
            defaultLanguage="verilog"
            value={testbenchValue}
            options={{
              readOnly: false,
              minimap: { enabled: false },
              inlineSuggest: { enabled: false },
            }}
            onChange={(v) => setTestbenchValue(v || "")}
          />
        </Box>
      )}
    </Box>
  );
};

export default App;
