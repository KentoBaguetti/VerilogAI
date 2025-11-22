import { Box, Container, Text, Flex } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import EditBox from "@/EditBox"
import ChatInterface from "@/components/editor/ChatInterface"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const [code, setCode] = useState(`module top(
    input clk,
    input rst_n,
    output reg [7:0] led
);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            led <= 8'h00;
        end else begin
            led <= led + 1;
        end
    end

endmodule
`)
  
  const [modifiedCode, setModifiedCode] = useState<string | null>(null);

  const handleAcceptDiff = () => {
    if (modifiedCode !== null) {
      setCode(modifiedCode);
      setModifiedCode(null);
    }
  };

  const handleRejectDiff = () => {
    setModifiedCode(null);
  };

  return (
    <>
      <Container maxW="full" h="calc(100vh - 100px)">
        <Box pt={12} m={4} h="full">
          <Text fontSize="2xl" truncate maxW="sm" mb={4}>
            Verilog Editor
          </Text>
          
          <Flex h="80vh" border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden">
            <Box flex="1" minW="0">
              <EditBox 
                language="verilog" 
                value={code} 
                onValueChange={setCode}
                aiEnabled={true}
                
                // Diff Mode Props
                modifiedValue={modifiedCode}
                onAcceptDiff={handleAcceptDiff}
                onRejectDiff={handleRejectDiff}
              />
            </Box>
            <ChatInterface 
                editorContent={code} 
                onSuggestCode={setModifiedCode}
            />
          </Flex>
        </Box>
      </Container>
    </>
  )
}
