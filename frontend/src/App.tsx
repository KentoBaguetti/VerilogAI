// App.tsx
import React, { useState, useEffect } from "react";
import { Box, Heading, Spinner, Flex, Text} from "@chakra-ui/react";
import EditBox from "./EditBox";
import Editor from "@monaco-editor/react";
import { Button } from "./components/ui/button.tsx";
import axios from "axios";
import { useColorMode } from "./components/ui/color-mode.tsx";
import Switch from "react-switch";


type Tab = "editor" | "testbench";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [codeValue, setCodeValue] = useState<string>("// Enter code\n");
  const [testbenchValue, setTestbenchValue] = useState<string>("");
  const [loadingTestbench, setLoadingTestbench] = useState(false);
  const [errorTestbench, setErrorTestbench] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simLogs, setSimLogs] = useState<string>("");
  const [aiCopilotMode, setAiCopilotMode] = useState(false);
  const { colorMode } = useColorMode();

  // Generate testbench when switching tabs
  useEffect(() => {
    if (activeTab !== "testbench") return;
    if (testbenchValue.trim()) return;

    setLoadingTestbench(true);
    setErrorTestbench(null);

    const tbprompt = `
You are a Verilog verification expert. Given this module, generate a complete testbench. Only return the testbench:

${codeValue}
`;

    axios
      .post("http://localhost:8000/api/v1/generate/", { prompt: tbprompt })
      .then((resp) => setTestbenchValue(resp.data.text || ""))
      .catch((err) =>
        setErrorTestbench(err.response?.data?.detail || err.message)
      )
      .finally(() => setLoadingTestbench(false));
  }, [activeTab, codeValue, testbenchValue]);

  // Handler for Simulate button
  const handleSimulate = () => {
    setSimLoading(true);
    setSimLogs("");
    axios
      .post<{ logs: string }>("http://localhost:8000/api/v1/simulate/", {
        code: codeValue,
        testbench: testbenchValue,
      })
      .then((resp) => setSimLogs(resp.data.logs))
      .catch((err) => {
        const msg = err.response?.data?.detail || err.message;
        setSimLogs(`[Error] ${msg}`);
      })
      .finally(() => setSimLoading(false));
  };

  return (
    <Box
      minH="100vh"
      bg="#0f0a19"
      px={6}
      py={8}
      fontFamily="Inter, sans-serif"
    >
      <Heading as="h1" size="2xl" color="white" textAlign="center" mb={6} fontWeight="bold">
        VerilogAI
      </Heading>

      {/* Controls: Tabs + AI Copilot toggle */}
      <Flex justify="space-between" align="center" mb={4}>
        <Flex>
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
        </Flex>

        {/* AI Copilot toggle using plain checkbox */}
        <Flex align="center">
          <Text 
          color="white"
          display="inline-block" 
          mr={2}
          fontSize="md"
          fontWeight="semibold"
          >
            AI Copilot
          </Text>
          <Switch
            onChange={() => setAiCopilotMode(!aiCopilotMode)}
            checked={aiCopilotMode}
            uncheckedIcon={false}
            checkedIcon={false}
            height={20}
            width={40}
            offColor="#444"
            onColor="#007acc"
            onHandleColor="#fff"
            offHandleColor="#fff"
            handleDiameter={16}
            boxShadow="0 0 2px rgba(0,0,0,0.5)"
            activeBoxShadow="0 0 2px rgba(0,0,0,0.5)"
            id="ai-copilot-toggle" 
          />           
        </Flex>
      </Flex>

      {/* Editor vs Testbench */}
      {activeTab === "editor" ? (
        aiCopilotMode ? (
          <EditBox
            language="verilog"
            cacheSize={10}
            initialValue={codeValue}
            onValueChange={(v) => {
              setCodeValue(v);
              setTestbenchValue("");
            }}
          />
        ) : (
          <Editor
            height="90vh"
            width="100%"
            defaultLanguage="verilog"
            value={codeValue}
            theme={colorMode === "dark" ? "dark" : "vs-dark"}
            options={{
              readOnly: false,
              minimap: { enabled: false },
              inlineSuggest: { enabled: false },
            }}
            onChange={(v) => setCodeValue(v || "")}
          />
        )
      ) : (
        <Box>
          <Box
            pb={2}
            mb={2}
            borderBottom="1px solid #333"
            color="white"
            fontWeight="bold"
          >
            AI-Generated Testbench{" "}
            {loadingTestbench && <Spinner size="xs" ml={2} />}
            {errorTestbench && (
              <Text as="span" color="crimson" ml={2}>
                Error: {errorTestbench}
              </Text>
            )}
          </Box>

          <Editor
            height="50vh"
            defaultLanguage="verilog"
            value={testbenchValue}
            theme={colorMode === "dark" ? "dark" : "vs-dark"}
            options={{ readOnly: false, minimap: { enabled: false } }}
            onChange={(v) => setTestbenchValue(v || "")}
          />

          <Button
            mt={4}
            colorScheme="green"
            onClick={handleSimulate}
          >
            Simulate
          </Button>

          <Box
            as="pre"
            mt={2}
            p={3}
            bg="#111"
            color="#0f0"
            fontFamily="monospace"
            fontSize="0.85rem"
            maxH="200px"
            overflowY="auto"
            whiteSpace="pre-wrap"
          >
            {simLogs ||
              (simLoading
                ? "Running simulation…"
                : "Logs will appear here.")
            }

          </Box>
        </Box>
      )}
    </Box>
  );
};

export default App;
