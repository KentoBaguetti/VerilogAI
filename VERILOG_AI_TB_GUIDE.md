# VerilogAI-TB: Automatic Testbench Generation Guide

## Overview

VerilogAI-TB is an integrated testbench generation assistant built into VerilogAI IDE. It automatically generates high-quality Verilog testbenches for your hardware modules with a single click.

## Features

✅ **One-Click Generation** - Generate testbenches instantly from any Verilog module  
✅ **Smart Analysis** - Automatically detects clocks, resets, and port configurations  
✅ **VCD Waveform Dumping** - All testbenches include proper VCD generation for GTKWave  
✅ **Organized Storage** - Testbenches saved to dedicated `/testbenches/` folder  
✅ **Standard Naming** - Follows `<module_name>_tb.v` convention  
✅ **Simple & Scalable** - Basic smoke tests with room for future enhancements

---

## How to Use

### 1. Open a Verilog Module

Select any `.v` or `.sv` file in the file explorer. For example:

```verilog
module and_gate (
    input  wire a,
    input  wire b,
    output wire y
);

assign y = a & b;

endmodule
```

### 2. Click "Gen TB" Button

In the header toolbar, click the **"Gen TB"** button (enabled when a Verilog file is open).

### 3. Wait for Generation

The system will:

- Analyze your module (ports, clocks, resets)
- Generate appropriate testbench code
- Create `/testbenches/` folder (if needed)
- Save as `<module_name>_tb.v`
- Auto-open the generated testbench

### 4. Review & Simulate

The generated testbench will include:

```verilog
module and_gate_tb;
  // Signal declarations
  reg a, b;
  wire y;

  // DUT instantiation
  and_gate dut (
    .a(a),
    .b(b),
    .y(y)
  );

  // Test stimulus
  initial begin
    $dumpfile("test.vcd");
    $dumpvars(0, tb);

    // Test cases
    a = 0; b = 0; #10;
    $display("Test: a=%b, b=%b, y=%b", a, b, y);

    a = 0; b = 1; #10;
    $display("Test: a=%b, b=%b, y=%b", a, b, y);

    a = 1; b = 0; #10;
    $display("Test: a=%b, b=%b, y=%b", a, b, y);

    a = 1; b = 1; #10;
    $display("Test: a=%b, b=%b, y=%b", a, b, y);

    #10;
    $finish;
  end
endmodule
```

---

## What VerilogAI-TB Generates

### Automatic Detection

VerilogAI-TB analyzes your module and automatically includes:

#### Clock Generation

If your module has clock ports (`clk`, `clock`):

```verilog
initial begin
  clk = 0;
  forever #5 clk = ~clk;
end
```

#### Reset Sequence

If your module has reset ports (`rst`, `reset`, `rst_n`, `reset_n`):

```verilog
initial begin
  rst = 1;
  #20;
  rst = 0;
  // ... rest of tests
end
```

#### VCD Dumping (Always Included)

```verilog
$dumpfile("test.vcd");
$dumpvars(0, tb);
```

#### Proper Simulation End

```verilog
#50;
$finish;
```

### Simple Smoke Tests

Current version generates basic stimulus patterns:

- Boundary values (min/max)
- Simple state transitions
- Basic functional checks
- Display statements for debugging

---

## File Organization

```
/
├── modules/
│   └── and_gate.v          ← Your design
├── testbenches/             ← Auto-created
│   └── and_gate_tb.v       ← Generated testbench
└── ...
```

### Naming Convention

- **Design**: `<module_name>.v`
- **Testbench**: `<module_name>_tb.v`

This is the standard convention in hardware verification!

---

## Backend Architecture

### OpenAI Integration

VerilogAI-TB uses **OpenAI's GPT-4o** model for testbench generation, providing:

- High-quality Verilog code generation
- Understanding of hardware verification patterns
- Proper clock/reset detection
- Clean code output without markdown artifacts

### System Prompt

VerilogAI-TB uses a specialized system prompt that instructs the AI to:

1. Analyze the module structure
2. Detect clock/reset signals
3. Generate proper signal declarations
4. Create correct DUT instantiation
5. Include VCD dumping
6. Generate simple test patterns
7. Return clean Verilog code (no markdown)

### API Endpoint

**Endpoint**: `POST /api/v1/tb/`

**Request**:

```json
{
  "prompt": "<verilog_module_code>"
}
```

**Response**:

```json
{
  "text": "<generated_testbench_code>",
  "module_name": "and_gate"
}
```

### Module Name Extraction

The backend automatically extracts the module name using regex:

```python
def extract_module_name(verilog_code: str) -> str:
    match = re.search(r'^\s*module\s+(\w+)', verilog_code, re.MULTILINE)
    if match:
        return match.group(1)
    return "module"
```

---

## Frontend Integration

### UI Component

Location: **Header toolbar** (between AI toggle and Upload button)

Button appearance:

- **Enabled**: Green background when Verilog file is open
- **Disabled**: Gray when no file selected or non-Verilog file

### Auto-Save Logic

1. Checks if `/testbenches/` folder exists
2. Creates folder if missing
3. Saves testbench as `<module_name>_tb.v`
4. Handles duplicate files (replaces existing)
5. Auto-expands folder
6. Auto-opens generated file

### User Feedback

Success message added to chat:

```
✅ Testbench generated successfully!

Created `and_gate_tb.v` in `/testbenches/` folder.

The testbench includes:
- Clock and reset generation
- DUT instantiation
- Basic stimulus
- VCD waveform dumping
```

---

## Future Enhancements (Scalable Design)

The current implementation is intentionally simple to allow easy scaling:

### Phase 2 (Planned)

- ✨ More sophisticated test patterns
- ✨ Randomized input generation
- ✨ Assertions and self-checking
- ✨ Coverage metrics
- ✨ Protocol-specific sequences (AXI, APB, UART)

### Phase 3 (Agentic)

- 🤖 Iterative test improvement
- 🤖 Coverage-driven test generation
- 🤖 Bug detection and regression tests
- 🤖 Automatic corner case identification

---

## Troubleshooting

### "Please select a Verilog file"

**Problem**: Non-Verilog file is open  
**Solution**: Select a `.v` or `.sv` file

### "Failed to generate testbench"

**Problem**: Backend connection issue  
**Solution**:

1. Check backend is running (`docker-compose up`)
2. Verify API URL is `http://localhost:8000`
3. Check OpenAI API key is configured in `.env` file:
   ```
   OPENAI_API_KEY=sk-...
   ```

### "File already exists"

**Problem**: Testbench with same name exists  
**Solution**: The system automatically replaces it with the new version

### Module name is "module_tb.v"

**Problem**: Module name couldn't be extracted  
**Solution**: Ensure your Verilog has proper `module <name>` declaration

---

## Implementation Files

### Backend

- `backend/app/api/routes/tb.py` - API endpoint with VerilogAI-TB prompt

### Frontend

- `new-frontend/src/components/Header.tsx` - "Gen TB" button
- `new-frontend/src/App.tsx` - Generation logic and auto-save

---

## Example Workflow

### 1. Create a Counter Module

```verilog
module counter (
    input wire clk,
    input wire rst,
    output reg [3:0] count
);

always @(posedge clk or posedge rst) begin
    if (rst)
        count <= 4'd0;
    else
        count <= count + 1;
end

endmodule
```

### 2. Click "Gen TB"

### 3. Review Generated Testbench

```verilog
module counter_tb;
  reg clk, rst;
  wire [3:0] count;

  // Clock generator
  initial begin
    clk = 0;
    forever #5 clk = ~clk;
  end

  // DUT instantiation
  counter dut (
    .clk(clk),
    .rst(rst),
    .count(count)
  );

  // Test stimulus
  initial begin
    $dumpfile("test.vcd");
    $dumpvars(0, tb);

    // Reset
    rst = 1;
    #20;
    rst = 0;

    // Let it count
    #100;
    $display("Count reached: %d", count);

    // Reset again
    rst = 1;
    #10;
    rst = 0;

    #50;
    $finish;
  end
endmodule
```

### 4. Simulate

Use the existing simulation pipeline - the testbench is ready to run!

---

## Design Philosophy

### Simple First

Start with basic smoke tests that verify:

- ✅ Module compiles
- ✅ Signals connect properly
- ✅ Basic functionality works
- ✅ VCD waveforms generate

### Quality Over Quantity

Each testbench includes:

- ✅ Clean, readable code
- ✅ Proper formatting
- ✅ Meaningful variable names
- ✅ Helpful display statements

### Scalable Architecture

The system is designed to grow:

- ✅ Modular backend prompt
- ✅ Extensible frontend hooks
- ✅ Standard file organization
- ✅ Room for agentic features

---

## Technical Specifications

### Supported File Types

- `.v` (Verilog)
- `.sv` (SystemVerilog)

### Naming Standard

- `<module_name>_tb.v` (industry standard)

### Storage Location

- `/testbenches/` folder (auto-created)

### AI Model

- GPT-4o via OpenAI

### Temperature

- 0.6 (balanced creativity and consistency)

### Max Tokens

- 2000 (testbenches can be longer than typical completions)

---

## Best Practices

### 1. Start Simple

Generate testbench for small modules first to verify functionality.

### 2. Review Generated Code

Always review the testbench before running simulation.

### 3. Iterate

If testbench needs changes, you can:

- Edit manually
- Regenerate (replaces existing file)
- Use AI chat for modifications

### 4. Version Control

Save important testbenches with the version history feature.

### 5. Organize

Keep all testbenches in `/testbenches/` folder for easy management.

---

## Summary

VerilogAI-TB provides **fast, automated testbench generation** integrated seamlessly into your VerilogAI workflow. With one click:

1. ✅ Analyze your module
2. ✅ Generate proper testbench
3. ✅ Save to organized location
4. ✅ Ready to simulate

**Simple now. Powerful later. Integrated always.**

---

_For questions or issues, check the backend logs or contact support._
