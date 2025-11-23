import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

from app.core.config import settings

router = APIRouter(prefix="/tb", tags=["tb"])


class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    text: str
    module_name: str


def strip_code_fences(code: str) -> str:
    """
    Remove triple backticks and optional 'verilog' tags from fenced code blocks.
    Handles multiple formats.
    """
    # Remove markdown code fences with optional language tags
    cleaned = re.sub(r"^```(?:verilog|systemverilog|v|sv)?\s*\n(.*?)\n```$", r"\1", code.strip(), flags=re.DOTALL)
    # Also handle cases where code might have multiple blocks
    cleaned = re.sub(r"```(?:verilog|systemverilog|v|sv)?\s*\n(.*?)\n```", r"\1", cleaned, flags=re.DOTALL)
    return cleaned.strip()


def extract_module_name(verilog_code: str) -> str:
    """
    Extract the module name from Verilog code.
    Returns the module name or 'module' if not found.
    """
    # Match: module <name> ( ... or module <name>;
    match = re.search(r'^\s*module\s+(\w+)', verilog_code, re.MULTILINE)
    if match:
        return match.group(1)
    return "module"


@router.post("/", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    """Generate Verilog testbench using OpenAI"""
    # 1) Validate prompt
    user_code = req.prompt.strip()
    if not user_code:
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    # 2) Check for OpenAI API key
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured. Please add it to your .env file."
        )
    
    # VerilogAI-TB System Prompt
    system_prompt = """You are VerilogAI-TB, an expert hardware verification assistant.

## Your Task:
Generate a simple, high-quality Verilog testbench for the provided module.

## Requirements:
1. **Module instantiation**: Correctly instantiate the DUT with all ports
2. **Clock generator**: If clock port detected (clk, clock), generate a clock signal (#5 toggle)
3. **Reset generator**: If reset detected (rst, reset, rst_n, reset_n), generate proper reset sequence
4. **VCD dumping**: MUST include these exact lines in initial block:
   ```
   $dumpfile("test.vcd");
   $dumpvars(0, tb);
   ```
5. **Test naming**: Module must be named `tb` or `<module_name>_tb`
6. **Stimulus**: Generate simple smoke test with basic input patterns
7. **Finish**: End simulation with `$finish;` after reasonable delay
8. **Display**: Use `$display()` to show test progress

## Code Format:
- Return ONLY pure Verilog code
- NO markdown formatting, NO triple backticks, NO comments outside code
- Start directly with `module tb;` or similar
- Keep it simple but complete

## Example Structure:
```
module <name>_tb;
  // Signal declarations
  reg clk, rst;
  reg [7:0] input_signal;
  wire [7:0] output_signal;
  
  // Clock generator (if needed)
  initial begin
    clk = 0;
    forever #5 clk = ~clk;
  end
  
  // DUT instantiation
  <module_name> dut (
    .clk(clk),
    .rst(rst),
    .input_signal(input_signal),
    .output_signal(output_signal)
  );
  
  // Test stimulus
  initial begin
    $dumpfile("test.vcd");
    $dumpvars(0, tb);
    
    // Reset sequence
    rst = 1;
    #20;
    rst = 0;
    
    // Test cases
    input_signal = 8'd10;
    #10;
    $display("Test 1: input=%d, output=%d", input_signal, output_signal);
    
    input_signal = 8'd20;
    #10;
    $display("Test 2: input=%d, output=%d", input_signal, output_signal);
    
    #50;
    $finish;
  end
endmodule
```

Now generate a testbench for this module:
"""

    try:
        # 3) Create OpenAI client
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # 4) Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",  # or "gpt-4-turbo" or "gpt-3.5-turbo"
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate testbench for:\n\n{user_code}"}
            ],
            temperature=0.6,
            max_tokens=2000,  # Testbenches can be longer
        )

        # 5) Extract generated text
        generated_text = response.choices[0].message.content or ""
        
        # 6) Clean and return
        cleaned_text = strip_code_fences(generated_text)
        module_name = extract_module_name(user_code)
        
        return GenerateResponse(text=cleaned_text, module_name=module_name)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(e)}"
        )
