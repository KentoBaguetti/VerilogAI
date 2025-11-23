# 🚀 Quick Start: Cursor-Style Autocomplete

## In 30 Seconds

1. **Enable AI Copilot** → Toggle switch in top-right (turns blue ✨)
2. **Start typing Verilog code** → AI suggests completions
3. **Press Tab** → Accept suggestion
4. **Press Esc** → Dismiss suggestion

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Accept AI suggestion |
| **Esc** | Dismiss suggestion |
| **Ctrl+Space** | Trigger manually |
| **→** | Accept word-by-word |

---

## Try These Snippets

Type these and press **Tab**:

- `module` → Full module template
- `always_ff` → Always block with reset
- `always_comb` → Combinational block
- `testbench` → Complete testbench with VCD
- `case` → Case statement
- `for` → For loop

---

## Smart Features

✅ **Context-Aware** - Knows when to suggest  
✅ **Fast** - 400ms response time  
✅ **Visual Feedback** - "AI thinking..." indicator  
✅ **Multi-line** - Up to 15 lines of code  
✅ **FIM** - Uses code before & after cursor  

---

## Example Usage

```verilog
module counter (
  input clk,
  input rst,
  ▊  ← cursor here, AI completes the rest!
```

**AI suggests:**
```verilog
  output reg [7:0] count
);
  always_ff @(posedge clk) begin
    if (rst)
      count <= 0;
    else
      count <= count + 1;
  end
endmodule
```

---

## When AI Triggers

✅ After 2+ words of code  
✅ After: `(`, `{`, `=`, `,`, `;`, `:`, `[`  
✅ After 400ms of no typing  

❌ Won't trigger in comments  
❌ Won't trigger in strings  
❌ Won't trigger with no context  

---

## Tips

💡 **More context = better suggestions**  
💡 **Use Tab liberally for fast coding**  
💡 **Esc to dismiss, then keep typing**  
💡 **Undo works as expected (Cmd/Ctrl+Z)**  
💡 **Try snippets for common patterns**  

---

## Troubleshooting

**No suggestions?**
- Check AI Copilot toggle is ON
- Wait 400ms after typing
- Add more context (2+ words)
- Make sure you're not in a comment

**Slow completions?**
- Check internet connection
- Backend may be warming up
- Normal latency: 200-500ms

**Wrong suggestions?**
- Press Esc and keep typing
- More context helps accuracy
- Try using snippets instead

---

**That's it! Start coding and enjoy your AI assistant! 🎉**

For more details, see: `AI_AUTOCOMPLETE_GUIDE.md`

