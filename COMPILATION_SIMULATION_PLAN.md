# 🔨 Compilation & Simulation Implementation Plan

## Current State Analysis

### ✅ What You Already Have

#### Backend (Complete)
- ✅ **Simulation API** (`/api/v1/simulate/`) - iverilog + vvp
- ✅ **Linting API** (`/api/v1/lint/`) - Verilator syntax checking
- ✅ **VCD Generation** - Waveform files created
- ✅ **GTKWave Integration** - Docker container with watcher

#### Frontend (Needs Integration)
- ✅ File management
- ✅ Code editor
- ✅ Testbench generation
- ❌ **No simulation UI** (missing!)
- ❌ **No compilation feedback** (missing!)
- ❌ **No waveform viewer** (missing!)

---

## 🎯 Implementation Plan

### Phase 1: Basic Compilation & Simulation (MVP)
**Goal**: Get simulation working with visual feedback

#### 1.1 Add "Compile & Run" Button
**Location**: Header toolbar (next to "Gen TB")

**Features**:
- Enable only when both module + testbench exist
- Loading state with spinner
- Keyboard shortcut: `Cmd/Ctrl + R`

**Implementation**:
```typescript
// Header.tsx
<button onClick={onCompileAndRun} disabled={isCompiling}>
  {isCompiling ? "⟳ Compiling..." : "▶️ Run"}
</button>
```

**Priority**: 🔴 HIGH - Core functionality

---

#### 1.2 Simulation Output Panel
**Location**: Bottom panel (collapsible, like VSCode terminal)

**Layout**:
```
┌─────────────────────────────────────┐
│  Code Editor                        │
│                                     │
├─────────────────────────────────────┤ ← Resizable
│  📊 Simulation Output               │
│  ┌─ Logs ─┬─ Errors ─┬─ Waveform ─┐│
│  │ iverilog output...              ││
│  │ vvp output...                   ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Features**:
- **Tabs**: Logs | Errors | Waveform
- **Collapsible**: Toggle with button or `Cmd/Ctrl + J`
- **Auto-open**: Opens on compile, auto-scrolls
- **Color-coded**: Errors (red), warnings (yellow), success (green)
- **Timestamps**: Show execution time

**Priority**: 🔴 HIGH

---

#### 1.3 Smart File Selection
**Logic**: Automatically find module + testbench pairs

**Auto-detection**:
```typescript
// If user has `counter.v` open:
// 1. Check for `counter_tb.v` in /testbenches/
// 2. Check for `counter_tb.v` in same directory
// 3. Ask user to select testbench if not found
```

**UI Flow**:
```
User clicks "Run"
  ↓
If testbench found → Compile immediately
  ↓
If not found → Show modal:
  "No testbench found for counter.v
   [Generate TB] [Select TB] [Cancel]"
```

**Priority**: 🟡 MEDIUM

---

#### 1.4 Compilation Process Flow

**Step-by-Step**:
```
1. User clicks "Run"
   ├─ Button: "⟳ Compiling..."
   ├─ Output panel: Opens & shows "Starting..."
   └─ Chat: "🔄 Compiling module.v + testbench..."

2. Backend: iverilog compilation
   ├─ Success → Continue to step 3
   └─ Failure → Show errors, stop

3. Backend: vvp simulation
   ├─ Success → Show output, generate VCD
   └─ Failure → Show runtime errors

4. Completion
   ├─ Button: "▶️ Run" (ready again)
   ├─ Output panel: Shows all logs
   ├─ Chat: "✅ Simulation complete! View waveform?"
   └─ Waveform tab: Enabled (if VCD generated)
```

**Priority**: 🔴 HIGH

---

### Phase 2: Advanced Features

#### 2.1 Inline Error Display
**Goal**: Show compiler errors directly in the editor (like VSCode)

**Features**:
- Red squiggly underlines for errors
- Yellow squiggly for warnings
- Hover to see error message
- Click to jump to error line

**Implementation**:
```typescript
// Use Monaco Editor decorations API
editor.deltaDecorations([], [
  {
    range: new monaco.Range(lineNum, 1, lineNum, 1),
    options: {
      isWholeLine: true,
      className: 'error-line',
      glyphMarginClassName: 'error-glyph',
      hoverMessage: { value: errorMessage }
    }
  }
]);
```

**Priority**: 🟡 MEDIUM

---

#### 2.2 Waveform Viewer Integration
**Goal**: View VCD waveforms in the IDE

**Options**:

**Option A: Embedded GTKWave** (You already have this!)
- Use existing GTKWave Docker container
- Open in new window/tab
- Pros: Full-featured, no frontend work
- Cons: Separate window

**Option B: Web-based Viewer**
- Libraries: WaveJSON, Surfer, or wavedrom
- Embedded in IDE
- Pros: Integrated experience
- Cons: More development work

**Recommended**: Start with Option A (embedded GTKWave), add Option B later

**Implementation**:
```typescript
// Waveform tab in output panel
<button onClick={() => window.open('/gtkwave', '_blank')}>
  🌊 Open Waveform Viewer
</button>
```

**Priority**: 🟡 MEDIUM

---

#### 2.3 Quick Fixes & Suggestions
**Goal**: AI-powered error fixing

**Features**:
- Click "Fix" next to error
- AI suggests correction
- Apply fix with one click

**Example**:
```
Error: Missing semicolon at line 15
[Fix with AI] ← Click to get suggestion
```

**Priority**: 🟢 LOW (Nice to have)

---

#### 2.4 Simulation History
**Goal**: Track previous simulation runs

**Features**:
- List of past simulations
- View old logs
- Compare results
- Export logs

**UI**:
```
📊 Simulation History
├─ 2:45 PM - counter.v - ✅ Success (0.12s)
├─ 2:43 PM - counter.v - ❌ Failed (compile error)
└─ 2:40 PM - adder.v   - ✅ Success (0.08s)
```

**Priority**: 🟢 LOW

---

### Phase 3: Power User Features

#### 3.1 Simulation Configuration
**Goal**: Customize simulation parameters

**Settings**:
- Timescale (`1ns/1ps`)
- Max simulation time
- Optimization flags
- Verilator vs iverilog choice

**Priority**: 🟢 LOW

---

#### 3.2 Multi-file Compilation
**Goal**: Compile projects with multiple modules

**Features**:
- Dependency detection
- Include paths
- File ordering
- Build scripts

**Priority**: 🟢 LOW

---

#### 3.3 Coverage Analysis
**Goal**: Show code coverage from simulation

**Features**:
- Line coverage
- Branch coverage
- FSM coverage
- Coverage report viewer

**Priority**: 🟢 LOW

---

## 📋 Recommended Implementation Order

### Week 1: Core Simulation
1. ✅ Add "Compile & Run" button (1 day)
2. ✅ Create output panel component (2 days)
3. ✅ Integrate simulation API (1 day)
4. ✅ Add loading states & error handling (1 day)

**Deliverable**: Basic simulation working with logs display

---

### Week 2: User Experience
5. ✅ Smart file selection (1 day)
6. ✅ Waveform viewer integration (2 days)
7. ✅ Chat integration for feedback (1 day)
8. ✅ Keyboard shortcuts (0.5 days)
9. ✅ Polish & testing (1.5 days)

**Deliverable**: Smooth end-to-end workflow

---

### Week 3: Advanced Features (Optional)
10. ⭐ Inline error decorations (2 days)
11. ⭐ Simulation history (2 days)
12. ⭐ Quick fixes with AI (3 days)

**Deliverable**: Professional-grade IDE features

---

## 🎨 UI Mockup

### Main Interface Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ArchiTECH          counter.v                    [AI][Gen TB][▶️ Run][↓] │
├─────────┬────────────────────────────────────┬─────────────────┤
│ Files   │  Code Editor                       │  AI Assistant   │
│ ├ modules│  1  module counter(               │  💬 Chat here   │
│ │ └ counter.v                                │                 │
│ └ testbenches│  5  always @(posedge clk)   │                 │
│   └ counter_tb.v                            │                 │
│         │ 10  endmodule                      │                 │
│         │                                    │                 │
│         │                                    │                 │
├─────────┴────────────────────────────────────┴─────────────────┤
│ 📊 Simulation Output                    [Minimize] [Close]    │
│ ┌─ Logs ──┬─ Errors(0) ─┬─ Waveform ───────────────────────┐ │
│ │ ✅ Compilation successful (0.08s)                         │ │
│ │ ✅ Simulation complete (0.12s)                            │ │
│ │                                                            │ │
│ │ VCD info: dumping to test.vcd                             │ │
│ │ Test: count=0 at time 0                                   │ │
│ │ Test: count=1 at time 10                                  │ │
│ │ Test: count=2 at time 20                                  │ │
│ │ [🌊 Open Waveform Viewer]                                 │ │
│ └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Backend (Existing - No Changes Needed!)

Your backend is already perfect:

```python
# POST /api/v1/simulate/
{
  "code": "module counter...",
  "testbench": "module counter_tb..."
}

# Response:
{
  "logs": "iverilog output\nvvp output\n..."
}

# GET /api/v1/simulate/vcd
# Returns: test.vcd file
```

---

### Frontend Components to Create

#### 1. `SimulationOutputPanel.tsx`
```typescript
interface SimulationOutputPanelProps {
  logs: string;
  errors: CompilerError[];
  isOpen: boolean;
  onClose: () => void;
  onOpenWaveform: () => void;
  hasWaveform: boolean;
}
```

**Features**:
- Tabs for different views
- Syntax highlighting for logs
- Collapsible/resizable
- Auto-scroll to bottom

---

#### 2. `CompileButton.tsx` (or add to Header)
```typescript
interface CompileButtonProps {
  onCompile: () => void;
  isCompiling: boolean;
  disabled: boolean;
}
```

**Features**:
- Loading spinner
- Keyboard shortcut handler
- Tooltip with requirements

---

#### 3. Update `App.tsx`
```typescript
// Add state
const [simulationLogs, setSimulationLogs] = useState("");
const [isCompiling, setIsCompiling] = useState(false);
const [outputPanelOpen, setOutputPanelOpen] = useState(false);

// Add handler
const handleCompileAndRun = async () => {
  setIsCompiling(true);
  setOutputPanelOpen(true);
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/simulate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: moduleCode,
        testbench: testbenchCode
      })
    });
    
    const data = await response.json();
    setSimulationLogs(data.logs);
    
    // Success feedback
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "✅ Simulation complete! View waveform?"
    }]);
  } catch (error) {
    // Error handling
  } finally {
    setIsCompiling(false);
  }
};
```

---

## 🎯 MVP (Minimum Viable Product)

### Must-Have for First Release:

✅ **"Run" button** in header  
✅ **Output panel** showing logs  
✅ **Loading indicators** during compilation  
✅ **Error display** if compilation fails  
✅ **Success message** when complete  
✅ **Link to waveform** viewer (GTKWave)  

**Estimated Time**: 1 week (with existing backend)

---

## 🚀 Quick Start Implementation

### Step 1: Add Button (15 minutes)
```typescript
// Header.tsx
<button onClick={onCompileAndRun} disabled={isCompiling}>
  {isCompiling ? "⟳ Running..." : "▶️ Run"}
</button>
```

### Step 2: Create Output Panel (2 hours)
```typescript
// SimulationOutputPanel.tsx
const SimulationOutputPanel = ({ logs, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="simulation-output">
      <pre>{logs}</pre>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

### Step 3: Wire Everything Up (1 hour)
```typescript
// App.tsx
const handleCompileAndRun = async () => {
  const response = await fetch("/api/v1/simulate/", {
    method: "POST",
    body: JSON.stringify({ code, testbench })
  });
  setLogs(await response.json().logs);
};
```

**Result**: Basic simulation working in ~3 hours! 🎉

---

## 📊 Success Metrics

### User Experience Goals:
- ⏱️ Compile + Run in < 3 clicks
- 🎯 Clear error messages
- 📈 Visible progress indicators
- 🌊 Easy waveform access
- ⚡ Fast feedback (<5 seconds)

---

## 🎨 Design Principles

### 1. **Progressive Disclosure**
Start simple, reveal complexity as needed:
- Basic: Just "Run" button
- Advanced: Configuration options

### 2. **Clear Feedback**
Always tell the user what's happening:
- Loading states
- Progress updates
- Success/error messages

### 3. **Integrated Workflow**
Everything in one place:
- Edit → Compile → Simulate → Debug
- No context switching

### 4. **Smart Defaults**
Minimize configuration:
- Auto-find testbenches
- Sensible compiler flags
- Standard timescales

---

## 📚 References

### Existing Code:
- ✅ `backend/app/api/routes/simulate.py` - Simulation API
- ✅ `backend/app/api/routes/lint.py` - Linting API
- ✅ `gtkwave/` - Waveform viewer Docker setup

### Similar IDEs to Study:
- EDA Playground (edaplayground.com)
- VSCode HDL extensions
- Vivado/Quartus simulators

---

## 🎯 Next Steps

### Immediate Actions:

1. **Review this plan** - Confirm approach ✓
2. **Prioritize features** - What's most important?
3. **Start with MVP** - Get basic simulation working
4. **Iterate** - Add features based on feedback

### Questions to Decide:

1. **Output panel location?**
   - Bottom (like VSCode) ← Recommended
   - Side panel
   - Modal/popup

2. **Waveform viewer?**
   - External GTKWave ← Fastest
   - Embedded viewer ← Better UX
   - Both?

3. **Error handling?**
   - Inline decorations ← Best
   - Error panel only ← Simpler
   - Both ← Ideal

4. **Auto-compilation?**
   - Manual only ← Start here
   - On save
   - On testbench generation

---

## 💡 Pro Tips

### Development Strategy:
1. **Start with UI** - Mock the interface first
2. **Wire backend** - Connect to existing API
3. **Add features** - Enhance iteratively
4. **Polish** - Loading states, animations, etc.

### Common Pitfalls to Avoid:
- ❌ Over-engineering the first version
- ❌ Building features users don't need
- ❌ Poor error messages
- ❌ No loading indicators
- ❌ Breaking existing features

---

## 🎉 Summary

You already have 80% of the backend done! You just need:

1. ✅ **"Run" button** → Triggers existing `/simulate/` API
2. ✅ **Output panel** → Shows logs from API response
3. ✅ **Loading states** → Same pattern as testbench generation
4. ✅ **Waveform link** → Opens existing GTKWave

**Estimated Time to MVP**: 1 week  
**Complexity**: Medium (mostly frontend work)  
**Impact**: HIGH (core IDE functionality)

---

*Ready to start? Let me know which phase you want to tackle first!* 🚀

