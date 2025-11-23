# 🎯 How the RUN Button Works - Complete Explanation

## 📋 Overview

When you click "Run", the system compiles and simulates your Verilog code using **iverilog** (Icarus Verilog) and **vvp** (Verilog simulator).

---

## 🔄 Complete Flow (Step-by-Step)

### **1. Frontend: Button Click (App.tsx)**

When you click "Run":

```typescript
// User clicks Run button
handleCompileAndRun() is called
```

---

### **2. Frontend: Find Module & Testbench**

The system intelligently finds both files:

#### **Step 2a: Extract Module Name**
```typescript
// Read the ACTUAL module name from code content
const content = "module and_gate (...)"
const moduleName = extractModuleName(content) // → "and_gate"
```

**Key Point:** It reads `module and_gate` from your code, NOT from the filename!

#### **Step 2b: Determine File Roles**
```typescript
// Check if current file is a testbench
if (fileName.includes("_tb")) {
  // Current file = testbench → Find the module
  testbenchFile = currentFile
  moduleFile = search for module...
} else {
  // Current file = module → Find the testbench
  moduleFile = currentFile
  testbenchFile = `/testbenches/${moduleName}_tb.v`
}
```

#### **Step 2c: Safety Checks**
```typescript
// Verify we have both files
if (!moduleFile || !testbenchFile) {
  alert("Missing files!")
  return
}

// Verify we're not sending the same file twice
if (moduleFile.path === testbenchFile.path) {
  alert("ERROR: Same file!")
  return
}

// Verify module isn't actually a testbench
if (moduleFile.content.includes("_tb")) {
  alert("Wrong file detected as module!")
  return
}
```

---

### **3. Frontend: Send to Backend**

The frontend makes an API call:

```typescript
fetch(`http://localhost:8000/api/v1/simulate/`, {
  method: "POST",
  body: JSON.stringify({
    code: moduleFile.content,        // Your module code
    testbench: testbenchFile.content // Your testbench code
  })
})
```

**What's Sent:**
```json
{
  "code": "module and_gate (\n  input a,\n  input b,\n  output y\n);\n  assign y = a & b;\nendmodule",
  "testbench": "module and_gate_tb;\n  reg a, b;\n  wire y;\n  and_gate dut (...);\n  initial begin\n    ...\n  end\nendmodule"
}
```

---

### **4. Backend: Receive Request (Python FastAPI)**

Backend receives the code:

```python
@router.post("/", response_model=SimulateResponse)
def simulate(request: SimulateRequest):
    code = request.code        # Module code
    testbench = request.testbench  # Testbench code
```

---

### **5. Backend: Create Temporary Files**

The backend creates temporary files:

```python
import tempfile

# Create a temporary directory
with tempfile.TemporaryDirectory() as tmpdir:
    # Write module to file
    module_path = os.path.join(tmpdir, "module.v")
    with open(module_path, "w") as f:
        f.write(code)
    
    # Write testbench to file
    tb_path = os.path.join(tmpdir, "tb.v")
    with open(tb_path, "w") as f:
        f.write(testbench)
```

**Files Created:**
```
/tmp/tmp17a963l2/
├── module.v      ← Your module code
└── tb.v          ← Your testbench code
```

---

### **6. Backend: Compile with iverilog**

The backend runs the compiler:

```python
# Compile both files together
compile_cmd = [
    "iverilog",
    "-o", "simulation",  # Output executable
    "module.v",          # Module file
    "tb.v"               # Testbench file
]

result = subprocess.run(
    compile_cmd,
    cwd=tmpdir,
    capture_output=True,
    text=True
)
```

**What This Does:**
- `iverilog` compiles your Verilog code
- Checks for syntax errors
- Creates an executable called `simulation`

**If Compilation Fails:**
```python
if result.returncode != 0:
    return {
        "logs": f"[Compiler error]\n{result.stderr}",
        "vcd_content": None
    }
```

---

### **7. Backend: Run Simulation with vvp**

If compilation succeeds, run the simulation:

```python
# Run the compiled simulation
sim_cmd = ["vvp", "simulation"]

result = subprocess.run(
    sim_cmd,
    cwd=tmpdir,
    capture_output=True,
    text=True
)
```

**What This Does:**
- `vvp` runs the compiled Verilog simulation
- Executes your testbench
- Generates output and VCD waveform file

**Example Output:**
```
Time:    0 | a=0, b=0 | y=0
Time:   10 | a=0, b=1 | y=0
Time:   20 | a=1, b=0 | y=0
Time:   30 | a=1, b=1 | y=1
Test completed successfully!
```

---

### **8. Backend: Check for VCD File**

The backend looks for waveform data:

```python
# Look for VCD file (waveform dump)
vcd_files = [f for f in os.listdir(tmpdir) if f.endswith('.vcd')]

if vcd_files:
    vcd_path = os.path.join(tmpdir, vcd_files[0])
    with open(vcd_path, 'r') as f:
        vcd_content = f.read()
else:
    vcd_content = None
    logs += "\n[Warning] No VCD file found."
```

**VCD File:** Contains waveform data for viewing in GTKWave or other tools.

---

### **9. Backend: Return Results**

Backend sends back the response:

```python
return {
    "logs": stdout + stderr,      # All output from simulation
    "vcd_content": vcd_content    # Waveform data (optional)
}
```

---

### **10. Frontend: Display Results**

Frontend receives the response and displays it:

```typescript
const data = await response.json()

// Show output panel
setOutputPanelOpen(true)

// Display logs
setSimulationLogs(data.logs)

// Set status based on content
if (data.logs.includes("error") || data.logs.includes("Error")) {
  setSimulationStatus("error")
  setChatMessages([...messages, {
    role: "assistant",
    content: "❌ Compilation/Simulation failed"
  }])
} else {
  setSimulationStatus("success")
  setChatMessages([...messages, {
    role: "assistant",
    content: "✅ Compilation and simulation successful!"
  }])
}
```

---

## 🎯 Visual Flow Diagram

```
USER CLICKS "RUN"
       ↓
[Frontend: Find Files]
  • Extract module name from code: "and_gate"
  • Find module file: /modules/and_gate.v
  • Find testbench: /testbenches/and_gate_tb.v
  • Validate both files exist
       ↓
[Frontend: Send to Backend]
  POST http://localhost:8000/api/v1/simulate/
  {
    "code": "module and_gate...",
    "testbench": "module and_gate_tb..."
  }
       ↓
[Backend: Create Temp Files]
  /tmp/tmp17a963l2/module.v
  /tmp/tmp17a963l2/tb.v
       ↓
[Backend: Compile]
  $ iverilog -o simulation module.v tb.v
  ✅ Success → simulation executable
  ❌ Error → return error logs
       ↓
[Backend: Simulate]
  $ vvp simulation
  ✅ Runs testbench
  ✅ Generates output
  ✅ Creates waveform.vcd
       ↓
[Backend: Return Results]
  {
    "logs": "Time: 0 | a=0...",
    "vcd_content": "..."
  }
       ↓
[Frontend: Display]
  • Open output panel at bottom
  • Show simulation logs
  • Show success/error status
  • Add message to chat
       ↓
USER SEES RESULTS! ✅
```

---

## 🔧 Key Components

### **Frontend (TypeScript/React)**
- **File:** `new-frontend/src/App.tsx`
- **Function:** `handleCompileAndRun()`
- **Responsibilities:**
  - Find module and testbench files
  - Validate files
  - Send to backend
  - Display results

### **Backend (Python/FastAPI)**
- **File:** `backend/app/api/routes/simulate.py`
- **Endpoint:** `POST /api/v1/simulate/`
- **Responsibilities:**
  - Receive code
  - Create temp files
  - Compile with iverilog
  - Simulate with vvp
  - Return logs and VCD

### **External Tools**
- **iverilog:** Verilog compiler (installed via Homebrew)
- **vvp:** Verilog simulator (comes with iverilog)

---

## ⚡ Why It's Fast

1. **Local execution** - No cloud/Docker overhead
2. **Temporary files** - Auto-cleanup after each run
3. **Direct subprocess calls** - No unnecessary layers
4. **Background processes** - Backend runs in background

---

## 🐛 Error Handling

### **Compilation Errors**
```python
# iverilog finds syntax errors
[Compiler error]
module.v:5: syntax error
```

### **Simulation Errors**
```python
# vvp finds runtime errors
[Simulation error]
Error: Signal 'x' is not defined
```

### **Missing Files**
```typescript
// Frontend catches missing files
alert("No testbench found for and_gate.v")
```

---

## 📊 Example Complete Run

### **Input:**
- Module: `and_gate.v` (2-input AND gate)
- Testbench: `and_gate_tb.v` (tests all combinations)

### **Process:**
1. Frontend extracts module name: `and_gate`
2. Finds testbench: `and_gate_tb.v`
3. Sends both to backend
4. Backend creates temp files
5. Compiles: `iverilog -o simulation module.v tb.v`
6. Simulates: `vvp simulation`
7. Returns output logs
8. Frontend displays in output panel

### **Output:**
```
Testing AND gate...
Time:    0 | a=0, b=0 | y=0 ✅
Time:   10 | a=0, b=1 | y=0 ✅
Time:   20 | a=1, b=0 | y=0 ✅
Time:   30 | a=1, b=1 | y=1 ✅
All tests passed! 🎉
```

---

## ✅ Summary

**RUN button:**
1. ✅ Finds your module and testbench automatically
2. ✅ Sends both to backend API
3. ✅ Backend compiles with iverilog
4. ✅ Backend simulates with vvp
5. ✅ Returns logs and waveforms
6. ✅ Frontend displays results in output panel

**All local, no Docker, super fast!** 🚀

---

## 🎓 Key Insight

The magic is in **smart file finding** + **local Verilog tools** + **FastAPI backend**!

No need for complex Docker setups or cloud services. Everything runs on your machine! ⚡

