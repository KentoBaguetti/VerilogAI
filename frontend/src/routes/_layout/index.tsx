import { Box, Flex } from "@chakra-ui/react"
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

  // Callback for streaming edits
  const handleStreamCode = (codeChunk: string, isFirstChunk: boolean) => {
      // If it's the first chunk of a new edit, we might want to clear previous or just overwrite.
      // Since the backend sends the full generated response incrementally (but as raw chunks of the final text),
      // we probably need to reconstruct it.
      // However, if we want "Cursor-like" streaming update in the diff view:
      // The DiffEditor needs the *full* modified text to show the diff against original.
      // So we set the modifiedCode to whatever we have accumulated so far.
      
      // NOTE: The ChatInterface logic currently accumulates and sends the *full* text so far.
      // So we just need to update the state.
      setModifiedCode(codeChunk);
  };

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
    <Flex h="100vh" w="100vw" overflow="hidden">
      <Box flex="1" minW="0" h="full">
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
          onStreamCode={handleStreamCode}
      />
    </Flex>
  )
}
