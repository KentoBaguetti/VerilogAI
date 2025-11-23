# Agentic Editing Feature Guide

## Overview

I've added a powerful **Agentic Editing** feature to your new frontend, similar to Cursor's AI code editing capabilities! This allows the AI to directly propose code changes that you can review and accept/reject with a visual diff view.

## ✨ Features

### Two Modes of AI Interaction

1. **Chat Mode** (Blue "Chat" button)
   - Normal conversational AI
   - Get explanations, suggestions, and help
   - Responses appear only in the chat sidebar
   - No direct code modifications

2. **Agentic Edit Mode** (Green "Edit" button)
   - AI proposes direct code changes
   - Shows side-by-side diff view (red/green highlights)
   - Review changes before accepting
   - Description of changes appears in chat
   - Only available when a file is open

## 🎯 How to Use

### Method 1: Click the "Edit" Button

1. **Open a file** in the editor (e.g., `modules/gate.v`)
2. **Type your request** in the chat input (e.g., "Add a reset signal to this module")
3. **Click the green "Edit" button**
4. **Wait for AI response** - you'll see a loading indicator
5. **Review the diff** - the editor switches to diff view showing:
   - **Red lines**: Code to be removed
   - **Green lines**: Code to be added
6. **Accept or Reject**:
   - Click **"Accept"** to apply the changes
   - Click **"Reject"** to keep the original code

### Method 2: Keyboard Shortcut

- Press **`Cmd+Enter`** (Mac) or **`Ctrl+Enter`** (Windows/Linux) while typing in the chat input
- This automatically triggers Agentic Edit mode

## 📋 Example Use Cases

### 1. Add Features
```
User: "Add a parameter for bus width to this module"
AI: [Proposes code with parameterized bus width]
→ Review diff → Accept changes
```

### 2. Refactor Code
```
User: "Convert this always block to use non-blocking assignments"
AI: [Proposes refactored code]
→ Review diff → Accept or reject
```

### 3. Add Documentation
```
User: "Add detailed comments explaining each signal"
AI: [Proposes code with comprehensive comments]
→ Review diff → Accept changes
```

### 4. Fix Issues
```
User: "Fix the timing issue in the clock domain crossing"
AI: [Proposes corrected code with proper synchronizers]
→ Review diff → Accept changes
```

## 🎨 Visual Indicators

### Chat Sidebar
- **Blue "Chat" button**: Normal conversation mode
- **Green "Edit" button**: Agentic editing mode
  - Disabled (gray) when no file is open
  - Shows tooltip on hover
- **Keyboard hint**: "Press Cmd+Enter for Edit mode" (when file is open)

### Chat Messages
When using Edit mode, you'll see special messages:

- **✨ Code changes proposed**: AI has suggested changes
- **✅ Changes accepted**: You accepted the changes
- **❌ Changes rejected**: You rejected the changes
- **⚠️ No code changes detected**: AI response didn't contain code

### Editor
- **Normal view**: Standard Monaco editor with syntax highlighting
- **Diff view**: Side-by-side comparison
  - Left side: Original code
  - Right side: Proposed changes
  - Red highlights: Deletions
  - Green highlights: Additions
- **Control bar**: Floating buttons in top-right
  - "Review Changes" label
  - Green "Accept" button with checkmark
  - Red "Reject" button with X

## 🔧 Technical Details

### Code Extraction
The system intelligently extracts code from AI responses:
- Looks for Markdown code blocks (` ```verilog `)
- Falls back to detecting Verilog keywords if no code block found
- Ignores conversational text before/after code blocks

### Message Format
In Agentic mode, the chat shows:
```
✨ Code changes proposed

I've suggested changes to `/modules/gate.v`. Review the diff and accept or reject the changes.

---

[Full AI response with explanation]
```

### State Management
- `proposedCode`: Stores the AI-suggested code
- `isAgenticMode`: Tracks if currently in agentic mode
- `isLoadingChat`: Shows loading indicators
- Diff view automatically appears when `proposedCode` is set

## 🚀 Workflow Example

### Complete Agentic Editing Session

1. **Start**: Open `modules/gate.v`
   ```verilog
   module and_gate (
       input  wire a,
       input  wire b,
       output wire y
   );
   
   assign y = a & b;
   
   endmodule
   ```

2. **Request**: Type "Add a testbench for this module" → Click "Edit"

3. **AI Response**: Chat shows:
   ```
   ✨ Code changes proposed
   
   I've suggested changes to `/modules/gate.v`. Review the diff and accept or reject the changes.
   
   ---
   
   I've created a comprehensive testbench that instantiates the and_gate module
   and tests all input combinations...
   ```

4. **Diff View**: Editor shows side-by-side comparison
   - Left: Original module
   - Right: Module + testbench

5. **Decision**:
   - **Accept**: Code is applied, chat confirms "✅ Changes accepted"
   - **Reject**: Original code remains, chat confirms "❌ Changes rejected"

6. **Continue**: Make another request or switch back to Chat mode

## 💡 Tips & Best Practices

### For Best Results

1. **Be Specific**: "Add a 32-bit counter with enable signal" is better than "add a counter"
2. **One Change at a Time**: Break large refactors into smaller steps
3. **Review Carefully**: Always check the diff before accepting
4. **Use Context**: The AI sees your current code, so reference it directly
5. **Iterate**: If the first suggestion isn't perfect, reject and rephrase

### When to Use Each Mode

**Use Chat Mode when you want to:**
- Ask questions about code
- Get explanations
- Discuss design approaches
- Learn Verilog concepts

**Use Edit Mode when you want to:**
- Add new features
- Refactor existing code
- Fix bugs
- Add documentation
- Generate boilerplate

## 🐛 Troubleshooting

### "Edit" Button is Disabled
- **Cause**: No file is currently open
- **Solution**: Click on a file in the left sidebar to open it

### No Diff View Appears
- **Cause**: AI response didn't contain valid code
- **Solution**: Check chat for "⚠️ No code changes detected" message
- **Fix**: Rephrase your request to be more specific about code changes

### Changes Don't Look Right
- **Solution**: Click "Reject" and try again with a clearer prompt
- **Tip**: You can reference specific lines or functions in your request

### Diff View is Hard to Read
- **Solution**: The diff shows side-by-side by default
- **Tip**: Scroll to see all changes, red = removed, green = added

## 🎓 Advanced Usage

### Chaining Edits
You can make multiple sequential edits:
1. Request change → Accept
2. Request another change → Accept
3. Continue building up your code

### Partial Acceptance
If you like some changes but not others:
1. Reject the proposal
2. Manually copy the parts you want from the chat
3. Or rephrase your request to be more specific

### Combining Modes
1. Use **Chat** to discuss the approach
2. Switch to **Edit** to implement it
3. Use **Chat** to ask follow-up questions
4. Use **Edit** to refine the implementation

## 🔐 Safety Features

- **Non-destructive**: Original code is never modified until you click "Accept"
- **Visual confirmation**: Always see exactly what will change
- **Reversible**: Can reject at any time
- **Chat history**: All changes are documented in chat messages

## 📊 Comparison with Cursor

| Feature | Your VerilogAI | Cursor |
|---------|----------------|--------|
| Diff view | ✅ Side-by-side | ✅ Inline |
| Accept/Reject | ✅ Yes | ✅ Yes |
| Chat integration | ✅ Yes | ✅ Yes |
| Keyboard shortcut | ✅ Cmd+Enter | ✅ Cmd+K |
| Code extraction | ✅ Automatic | ✅ Automatic |
| Change description | ✅ In chat | ✅ In chat |

## 🎉 Summary

You now have a professional-grade agentic editing system that:
- ✅ Proposes code changes with AI
- ✅ Shows visual diffs (red/green highlights)
- ✅ Allows accept/reject workflow
- ✅ Integrates seamlessly with chat
- ✅ Works with keyboard shortcuts
- ✅ Provides clear feedback at every step

Enjoy your AI-powered Verilog development experience! 🚀

