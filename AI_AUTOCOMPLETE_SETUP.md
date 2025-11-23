# AI Autocomplete Setup Guide

## ✅ What's Implemented

Your new-frontend now has **AI-powered autocomplete** similar to GitHub Copilot! The feature uses:

- **Monaco Editor's built-in inline suggestions API** for smooth, native-feeling completions
- **OpenAI GPT-4o** via your backend for intelligent code suggestions
- **Smart triggering** that respects code context (no suggestions in comments/strings)
- **Tab to accept** inline suggestions

## 🚀 How to Use

### 1. Start the Backend

```bash
cd backend
# Make sure your .env has OPENAI_API_KEY set
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
cd new-frontend
npm install  # if not already done
npm run dev
```

### 3. Use the Autocomplete

1. **Open a file** in the editor (like `gate.v`)
2. **Start typing** - e.g., type `module counter`
3. **Wait briefly** (~300ms) - you'll see "AI thinking..." in the top-right
4. **See the suggestion** - grey text will appear inline after your cursor
5. **Press Tab** to accept the suggestion
6. **Press Escape** or keep typing to dismiss it

## 🎯 Features

### Smart Context Awareness
- Only triggers when you have at least 3 characters of context
- Skips comments and string literals
- Uses the last 1000 characters of your code as context

### Visual Feedback
- **"AI thinking..."** indicator appears when fetching suggestions
- **Grey inline text** shows the AI suggestion (Monaco's native styling)
- **Hint tooltip** at the top shows "AI Autocomplete: Press Tab to accept"

### Toggle On/Off
- Use the **AI toggle button** in the header to enable/disable autocomplete
- When disabled, you get a regular code editor

## 🔧 Configuration

### Backend API Endpoint

The autocomplete calls:
```
POST http://localhost:8000/api/v1/generate/
```

Request payload:
```json
{
  "prompt": "...last 1000 chars of your code...",
  "max_tokens": 150,
  "temperature": 0.3
}
```

Response:
```json
{
  "text": "suggested completion code"
}
```

### Frontend Configuration

In `App.tsx`:
- `aiEnabled` state (line 122) - controls AI features, default: `true`
- `apiUrl` state (line 123) - backend URL, default: `http://localhost:8000`

In `CodeEditor.tsx`:
- Inline completion provider registered for all file types
- Uses Monaco's `inlineSuggest` API for native-feeling completions
- Temperature: 0.3 (deterministic completions)
- Max tokens: 150 (reasonable completion length)

## 🐛 Debugging

### Check Browser Console

Open DevTools (F12) and look for:
```
[AI Autocomplete] Registering inline completion provider
[AI Autocomplete] Fetching completion...
[AI Autocomplete] Got suggestion: ...
[AI Autocomplete] Providing inline completion
```

### Common Issues

#### No suggestions appearing?

1. **Check AI is enabled**: Look for the toggle in the header
2. **Check backend is running**: Visit `http://localhost:8000/docs`
3. **Check OpenAI API key**: Make sure `.env` has `OPENAI_API_KEY=sk-...`
4. **Check console**: Look for errors in browser console
5. **Check network**: Open DevTools → Network tab, look for calls to `/api/v1/generate/`

#### Backend errors?

Check backend logs for:
- Missing `OPENAI_API_KEY`
- OpenAI API rate limits
- Network connectivity issues

#### Suggestions too slow?

- Check your internet connection
- Check OpenAI API status
- Consider adjusting `max_tokens` (lower = faster)

## 📝 How It Works

### Frontend Flow

1. **User types** → Monaco editor content changes
2. **Inline completion provider triggers** → Monaco calls `provideInlineCompletions`
3. **Context extracted** → Last 1000 chars before cursor position
4. **API call** → POST to `/api/v1/generate/`
5. **Response processed** → Clean up markdown fences if present
6. **Suggestion rendered** → Monaco displays as inline grey text
7. **User accepts** → Tab key inserts the suggestion

### Backend Flow

1. **Receive prompt** → Last 1000 chars of user's code
2. **Build request** → System prompt + user's code context
3. **Call OpenAI** → GPT-4o with temperature 0.3
4. **Clean response** → Remove markdown, trim whitespace
5. **Return text** → Pure code completion

## 🎨 Customization

### Adjust Completion Behavior

In `CodeEditor.tsx`, modify:

```typescript
// Context window size (default: 1000 chars)
prompt: prefix.slice(Math.max(0, prefix.length - 1000))

// Response length (default: 150 tokens)
max_tokens: 150

// Determinism (0.0 = very deterministic, 1.0 = creative)
temperature: 0.3
```

### Adjust Trigger Behavior

```typescript
// Minimum characters before triggering
if (prefix.trim().length < 3) return { items: [] };
```

### Style the Suggestions

Monaco uses built-in inline suggestion styling. The grey text appearance is controlled by Monaco's theme system.

## 🔐 Security Notes

- Your OpenAI API key is stored in backend `.env` (never in frontend)
- Only the last 1000 characters are sent (not your entire codebase)
- CORS is configured to only accept requests from your frontend

## 📚 Related Files

- `/new-frontend/src/components/CodeEditor.tsx` - Main autocomplete implementation
- `/new-frontend/src/App.tsx` - AI toggle state management
- `/backend/app/api/routes/generate.py` - Backend autocomplete endpoint
- `/backend/app/core/config.py` - OpenAI API key configuration

## 🚀 Next Steps

1. Test the autocomplete with different Verilog code
2. Adjust parameters if completions are too long/short
3. Consider adding more stop sequences in the backend
4. Monitor OpenAI API usage and costs

Enjoy your AI-powered Verilog editor! 🎉

