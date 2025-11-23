# Autocomplete Debug Guide

## What I Fixed

1. **Added Verilog language mapping** - `.v`, `.sv`, `.vh`, `.svh` files now properly map to "verilog" and "systemverilog"
2. **Made inline provider universal** - Now works for ALL file types, not just the initially registered language
3. **Added console logging** - To help debug what's happening

## How to Test

1. **Open the browser console** (F12 or Cmd+Option+I)
2. **Open a .v file** (like gate.v) in the editor
3. **Start typing** in the editor
4. **Watch the console** for these messages:
   - `[AI Autocomplete] Registering providers for language: verilog`
   - `[AI Autocomplete] Fetching completion for language: verilog`
   - `[AI Autocomplete] Suggestion added: ...`
   - `[AI Autocomplete] Providing inline completion: ...`

## What Should Happen

When you type in the editor:

1. After 200ms, you should see "AI thinking..." in the top-right corner
2. The AI will call the backend API at `http://localhost:8000/api/v1/generate/`
3. Once it gets a response, greyed-out ghost text should appear
4. Press **Tab** to accept the suggestion
5. Press **Escape** to dismiss it

## Common Issues

### No ghost text appearing?

Check console for:

- Is AI enabled? (toggle in header)
- Is the backend running? (`http://localhost:8000`)
- Are there API errors in console?
- Is the language detected correctly?

### Ghost text too faint?

The ghost text uses Monaco's default inline suggestion styling. It should be visible but greyed out.

### API not being called?

- Check if `aiEnabled` is true in the header toggle
- Check if there's text in the editor (needs at least some content)
- Check if you're typing in comments or strings (AI skips these)

## Backend API

The autocomplete calls:

```
POST http://localhost:8000/api/v1/generate/
{
  "prompt": "...context from editor..."
}
```

Expected response:

```json
{
  "text": "suggested code here"
}
```
