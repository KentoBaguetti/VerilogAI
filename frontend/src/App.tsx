import React, { useState } from "react";
import { Box, Heading, Spinner, Flex, Text } from "@chakra-ui/react";
import EditBox from "./EditBox";
import { Button } from "./components/ui/button.tsx";
import axios from "axios";
import { useColorMode } from "./components/ui/color-mode.tsx";
import Switch from "react-switch";

type Tab = "editor" | "testbench";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [codeValue, setCodeValue] = useState("// Enter code\n");
  const [testbenchValue, setTestbenchValue] = useState("");
  const [loadingTestbench, setLoadingTestbench] = useState(false);
  const [errorTestbench, setErrorTestbench] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simLogs, setSimLogs] = useState("");
  const [aiCopilotMode, setAiCopilotMode] = useState(false);
  const { colorMode } = useColorMode();

  const handleSimulate = () => {
    setSimLoading(true);
    setSimLogs("");
    axios
      .post<{ logs: string }>("https://api.34-83-146-113.nip.io/api/v1/simulate/", {
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

  const handleTestbench = () => {
    setLoadingTestbench(true);
    setErrorTestbench(null);
    const tbprompt = `
You are a Verilog verification expert. Given this module, generate a complete testbench. Only return the testbench, No explanations, just code:
${codeValue}
`;
    axios
      .post("https://api.34-83-146-113.nip.io/api/v1/tb/", { prompt: tbprompt })
      .then((resp) => setTestbenchValue(resp.data.text || ""))
      .catch((err) =>
        setErrorTestbench(err.response?.data?.detail || err.message)
      )
      .finally(() => setLoadingTestbench(false));
  };

  return (
    <Box minH="100vh" bg="#282c34" px={6} py={8} fontFamily="Inter, sans-serif">
      <Heading
        as="h1"
        size="2xl"
        color="white"
        textAlign="center"
        mb={6}
        fontWeight="bold"
      >
        VerilogAI
      </Heading>

      {/* Controls */}
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

        <Flex align="center">
          <Text color="white" mr={2} fontSize="md" fontWeight="semibold">
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

      {/* Editor & Testbench */}
      <Box position="relative" minH="90vh">
        <Box
          position={activeTab === "editor" ? "relative" : "absolute"}
          visibility={activeTab === "editor" ? "visible" : "hidden"}
          width="100%"
          top={0}
          left={0}
        >
          <EditBox
            language="verilog"
            value={codeValue}
            aiEnabled={aiCopilotMode}
            onValueChange={(v) => setCodeValue(v)}
          />
          <Button mt={4} colorScheme="green" onClick={handleTestbench}>
            Generate Testbench
          </Button>
        </Box>

        <Box
          position={activeTab === "testbench" ? "relative" : "absolute"}
          visibility={activeTab === "testbench" ? "visible" : "hidden"}
          width="100%"
          top={0}
          left={0}
        >
          <Box mb={2} color="white" fontWeight="bold">
            {loadingTestbench && <Spinner size="xs" ml={2} />}
            {errorTestbench && (
              <Text as="span" color="crimson" ml={2}>
                Error: {errorTestbench}
              </Text>
            )}
          </Box>
          <EditBox
            language="verilog"
            value={testbenchValue}
            aiEnabled={aiCopilotMode}
            onValueChange={(v) => setTestbenchValue(v)}
          />
         <Flex mt={4} gap={3}>
            <Button colorScheme="green" onClick={handleSimulate}>
              Simulate
            </Button>
            <Button colorScheme="green" onClick={handleTestbench}>
              Generate Testbench
            </Button>
          </Flex>
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
              (simLoading ? "Running simulation…" : "Logs will appear here.")}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default App;
