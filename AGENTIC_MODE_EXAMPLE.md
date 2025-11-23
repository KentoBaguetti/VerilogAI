# Agentic Mode - Clean Separation Example

## How It Works Now

The agentic mode now cleanly separates **code changes** (shown in editor) from **explanations** (shown in chat).

---

## Example Workflow

### Step 1: User Request

**User types in chat:**

```
"Add a reset signal to this module"
```

**Clicks:** Green "Edit" button (or presses `Cmd+Enter`)

---

### Step 2: AI Response

#### What You See in the CHAT SIDEBAR:

```
✨ Code changes proposed for `gate.v`

Review the changes in the editor (red = removed, green = added).

---

I've added an active-low reset signal (rst_n) to your and_gate module.
The reset signal will asynchronously clear the output when asserted low.

Key changes:
• Added rst_n input port (active-low reset)
• Modified the assign statement to include reset logic
• Output y is cleared to 0 when rst_n is low
• Normal AND operation when rst_n is high

This follows standard Verilog reset conventions with active-low naming.
```

#### What You See in the CODE EDITOR:

**Diff View (side-by-side):**

**Left (Original - Red highlights):**

```verilog
module and_gate (
    input  wire a,
    input  wire b,
    output wire y
);

assign y = a & b;

endmodule
```

**Right (Proposed - Green highlights):**

```verilog
module and_gate (
    input  wire a,
    input  wire b,
    input  wire rst_n,    // ← GREEN (added)
    output wire y
);

assign y = rst_n ? (a & b) : 1'b0;    // ← GREEN (modified)

endmodule
```

---

### Step 3: User Decision

#### Option A: Accept Changes

**User clicks:** Green "Accept" button

**Chat shows:**

```
✅ Changes applied to `gate.v`

The code has been updated successfully.
```

**Editor:** Switches back to normal view with the new code

---

#### Option B: Reject Changes

**User clicks:** Red "Reject" button

**Chat shows:**

```
❌ Changes rejected

The original code remains unchanged. Feel free to ask for different modifications.
```

**Editor:** Returns to normal view with original code

---

## Benefits of This Approach

### ✅ Clean Separation

- **Chat**: Shows AI's explanation and reasoning
- **Editor**: Shows actual code changes with visual diff
- No code duplication in the chat

### ✅ Better Readability

- Chat is easier to read (no large code blocks)
- Focus on understanding WHY changes were made
- Code changes are highlighted in the proper editor

### ✅ Professional UX

- Similar to Cursor, GitHub Copilot, and other AI coding tools
- Clear visual distinction between explanation and implementation
- Easier to review changes at a glance

---

## What Gets Extracted

The system intelligently separates AI responses:

### Example AI Response (Raw):

````
I've added a reset signal to your module. Here's the updated code:

```verilog
module and_gate (
    input  wire a,
    input  wire b,
    input  wire rst_n,
    output wire y
);

assign y = rst_n ? (a & b) : 1'b0;

endmodule
````

The reset is active-low following standard conventions.

```

### What Goes to CHAT:
```

I've added a reset signal to your module. Here's the updated code:

[Code changes shown in editor]

The reset is active-low following standard conventions.

````

### What Goes to EDITOR DIFF:
```verilog
module and_gate (
    input  wire a,
    input  wire b,
    input  wire rst_n,
    output wire y
);

assign y = rst_n ? (a & b) : 1'b0;

endmodule
````

---

## Edge Cases Handled

### Case 1: No Code in Response

**AI Response:**

```
I can help with that! First, let me ask: do you want the reset
to be synchronous or asynchronous?
```

**Chat Shows:**

```
⚠️ No code changes detected

I couldn't find any code modifications in my response. Try rephrasing
your request to be more specific about the changes you want.

---

I can help with that! First, let me ask: do you want the reset
to be synchronous or asynchronous?
```

**Editor:** No diff view (stays in normal mode)

---

### Case 2: Multiple Code Blocks

**AI Response:**

````
Here's the module:

```verilog
module and_gate (...)
````

And here's a testbench:

```verilog
module tb_and_gate (...)
```

```

**Behavior:** Extracts the FIRST code block only
**Chat Shows:** Description with `[Code changes shown in editor]` placeholder
**Editor:** Shows diff for the first code block

---

## Comparison: Before vs After

### BEFORE (Code in Chat)
**Chat Sidebar:**
```

✨ Code changes proposed

I've suggested changes to `/modules/gate.v`. Review the diff...

---

I've added a reset signal. Here's the code:

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

The reset is active-low...

```
❌ **Problem:** Code appears in both chat AND editor (redundant)

---

### AFTER (Clean Separation) ✨
**Chat Sidebar:**
```

✨ Code changes proposed for `gate.v`

Review the changes in the editor (red = removed, green = added).

---

I've added a reset signal. [Code changes shown in editor]

The reset is active-low...

```
✅ **Better:** Only explanation in chat, code only in editor

---

## Summary

The agentic mode now provides a **clean, professional experience**:

1. 📝 **Chat** = AI's explanation and reasoning
2. 💻 **Editor** = Visual diff of code changes
3. ✅ **Accept/Reject** = Clear action buttons
4. 🎯 **No duplication** = Code shown once, in the right place

This matches the UX of professional AI coding assistants like Cursor!

```
