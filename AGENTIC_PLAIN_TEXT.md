# Agentic Mode - Plain Text Descriptions

## Overview

In agentic editing mode, the AI now returns **plain text descriptions** (no markdown formatting) so they display cleanly in the chat sidebar without needing conversion.

---

## How It Works

### Backend Changes

**File:** `backend/app/api/routes/chat.py`

1. Added `isAgentic` flag to `ChatRequest` model
2. Modified system prompt based on mode:
   - **Agentic Mode:** Instructs AI to use plain text only (no markdown)
   - **Chat Mode:** Normal conversational assistant

### Frontend Changes

**File:** `new-frontend/src/App.tsx`

1. Pass `isAgentic` flag to `streamChatResponse()`
2. Backend receives the flag and adjusts prompt accordingly
3. AI returns plain text description + code block
4. Frontend extracts code for diff editor
5. Frontend shows only description in sidebar

---

## AI Response Format (Agentic Mode)

### What the AI is Instructed to Return:

```
[Plain text description of changes - 2-3 sentences]

```verilog
[Complete modified code]
```
```

### Example AI Response:

```
I've added an active-low reset signal to your module. The reset will asynchronously clear the output when asserted low. This follows standard Verilog conventions.

```verilog
module and_gate (
    input  wire a,
    input  wire b,
    input  wire rst_n,
    output wire y
);

assign y = rst_n ? (a & b) : 1'b0;

endmodule
```
```

### What User Sees in Sidebar:

```
I've added an active-low reset signal to your module. The reset will asynchronously clear the output when asserted low. This follows standard Verilog conventions.
```

### What User Sees in Editor:

- Diff view with side-by-side comparison
- Red highlights for removed lines
- Green highlights for added lines
- Accept/Reject buttons

---

## System Prompt (Agentic Mode)

```
You are an expert Verilog code editor assistant. When the user requests code changes, you should:

1. Provide a brief, plain text description of what you're changing and why (2-3 sentences)
2. Then provide the complete modified code in a verilog code block

IMPORTANT FORMATTING RULES:
- Write your description in PLAIN TEXT only (no markdown formatting like **, *, ###, etc.)
- Use simple bullet points with "•" or "-" if listing items
- Keep the description concise and focused on WHAT changed and WHY
- Then provide the full modified code in a ```verilog code block

Example response format:
"I've added an active-low reset signal to your module. The reset will asynchronously clear the output when asserted low. This follows standard Verilog conventions.

```verilog
[full code here]
```"

DO NOT use markdown headers (###), bold (**), or other markdown syntax in your description.
```

---

## Benefits

### ✅ No Markdown Conversion Needed
- AI returns plain text directly
- No need for markdown-to-HTML parser
- Cleaner, simpler implementation

### ✅ Consistent Formatting
- All descriptions use the same plain text style
- No unexpected markdown rendering issues
- Easier to read and understand

### ✅ Cursor-like Experience
- Matches professional AI coding tools
- Clean description in sidebar
- Code changes in diff editor
- Clear separation of concerns

---

## Example Scenarios

### Scenario 1: Adding a Feature

**User Request:** "Add a reset signal"

**AI Response (Raw):**
```
I've added an active-low reset signal (rst_n) to your and_gate module. The reset will asynchronously clear the output when asserted low. This follows standard Verilog conventions.

```verilog
module and_gate (
    input  wire a,
    input  wire b,
    input  wire rst_n,
    output wire y
);

assign y = rst_n ? (a & b) : 1'b0;

endmodule
```
```

**Sidebar Shows:**
```
I've added an active-low reset signal (rst_n) to your and_gate module. The reset will asynchronously clear the output when asserted low. This follows standard Verilog conventions.
```

**Editor Shows:** Diff view with reset signal added

---

### Scenario 2: Refactoring Code

**User Request:** "Use a ternary operator instead"

**AI Response (Raw):**
```
I've refactored the always block to use a more concise ternary operator. This is more compact and follows modern Verilog coding style. The functionality remains identical.

```verilog
module counter (
    input  wire clk,
    input  wire rst_n,
    output reg [7:0] count
);

always @(posedge clk or negedge rst_n) begin
    count <= !rst_n ? 8'h00 : count + 1;
end

endmodule
```
```

**Sidebar Shows:**
```
I've refactored the always block to use a more concise ternary operator. This is more compact and follows modern Verilog coding style. The functionality remains identical.
```

**Editor Shows:** Diff view showing old if/else vs new ternary

---

### Scenario 3: Adding Comments

**User Request:** "Add detailed comments"

**AI Response (Raw):**
```
I've added comprehensive comments to document each port in your module. The comments follow standard Verilog documentation practices and clearly explain the purpose of each signal.

```verilog
module and_gate (
    input  wire a,    // First input operand
    input  wire b,    // Second input operand
    output wire y     // AND result (high when both inputs are high)
);

assign y = a & b;

endmodule
```
```

**Sidebar Shows:**
```
I've added comprehensive comments to document each port in your module. The comments follow standard Verilog documentation practices and clearly explain the purpose of each signal.
```

**Editor Shows:** Diff view with green highlights on comment lines

---

### Scenario 4: Using Bullet Points

**User Request:** "Add multiple features"

**AI Response (Raw):**
```
I've made several improvements to your module:

• Added an active-low reset signal (rst_n)
• Increased the counter width to 16 bits
• Added an enable signal to control counting
• Implemented overflow detection

These changes make the counter more flexible and production-ready.

```verilog
module counter (
    input  wire clk,
    input  wire rst_n,
    input  wire enable,
    output reg [15:0] count,
    output wire overflow
);

assign overflow = (count == 16'hFFFF);

always @(posedge clk or negedge rst_n) begin
    if (!rst_n)
        count <= 16'h0000;
    else if (enable)
        count <= count + 1;
end

endmodule
```
```

**Sidebar Shows:**
```
I've made several improvements to your module:

• Added an active-low reset signal (rst_n)
• Increased the counter width to 16 bits
• Added an enable signal to control counting
• Implemented overflow detection

These changes make the counter more flexible and production-ready.
```

**Editor Shows:** Diff view with all changes highlighted

---

## Comparison: Chat Mode vs Agentic Mode

### Chat Mode (Normal Conversation)

**System Prompt:**
```
You are an expert Verilog hardware engineering assistant. 
You help users write, debug, and simulate Verilog code.
```

**Response Style:**
- Can use markdown formatting (**, *, ###, etc.)
- Conversational and explanatory
- May include code examples inline
- Full response shown in sidebar

**Example:**
```
### Understanding Reset Signals

In Verilog, there are two main types of resets:

**Synchronous Reset:**
- Triggered on clock edge
- Uses: `if (rst)`

**Asynchronous Reset:**
- Triggered immediately
- Uses: `always @(posedge clk or negedge rst_n)`

Would you like me to add one to your code?
```

---

### Agentic Mode (Code Editing)

**System Prompt:**
```
You are an expert Verilog code editor assistant.
[Instructions for plain text + code block format]
```

**Response Style:**
- Plain text only (no markdown)
- Concise description of changes
- Full modified code in code block
- Description in sidebar, code in diff editor

**Example:**
```
I've added an asynchronous reset to your module. The reset is active-low and will clear the output immediately when asserted.

```verilog
[modified code]
```
```

---

## Technical Implementation

### Request Flow

1. **User clicks "Edit" button** → `isAgentic = true`
2. **Frontend sends request** → Includes `isAgentic: true` in payload
3. **Backend receives request** → Checks `req.isAgentic`
4. **Backend adjusts prompt** → Uses plain text instructions
5. **AI generates response** → Plain text description + code block
6. **Frontend receives stream** → Extracts code and description
7. **Sidebar shows description** → Plain text only
8. **Editor shows diff** → Code changes with highlights

### Code Extraction

The `extractCodeAndDescription()` function:
1. Finds first ` ```verilog ` code block
2. Extracts code content
3. Removes ALL code blocks from description
4. Returns `{ code, description }`

---

## Summary

The agentic mode now provides a **clean, professional experience** with:

1. 📝 **Plain text descriptions** - No markdown formatting needed
2. 💻 **Code in diff editor** - Visual red/green highlights
3. 🎯 **Clean separation** - Description in sidebar, code in editor
4. ✨ **Cursor-like UX** - Matches professional AI coding tools

The AI is explicitly instructed to avoid markdown in agentic mode, ensuring consistent, readable descriptions! 🚀

