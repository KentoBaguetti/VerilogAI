# 🚀 Start Backend - Simple Instructions

## ✅ Quick Start (Copy & Paste)

```bash
cd /Users/kentaro/VSC/VerilogAI/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

---

## 📋 Step-by-Step

### 1. Open a terminal

### 2. Navigate to backend folder

```bash
cd /Users/kentaro/VSC/VerilogAI/backend
```

### 3. Activate virtual environment

```bash
source venv/bin/activate
```

You should see `(venv)` appear in your prompt:

```
(venv) username@computer backend %
```

### 4. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

✅ **Backend is running!**

---

## 🛑 If Port 8000 is Already in Use

### Kill the old process first:

```bash
lsof -ti:8000 | xargs kill -9
```

### Then start backend:

```bash
cd /Users/kentaro/VSC/VerilogAI/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

---

## ✅ Verify It's Working

Open a new terminal and run:

```bash
curl http://localhost:8000/docs
```

Should return HTML (Swagger docs page) ✅

Or open in browser:

```
http://localhost:8000/docs
```

---

## 🔄 To Restart Backend

### Press `Ctrl+C` in the terminal where backend is running

Then run again:

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📊 What Each Command Does

- `cd backend` - Go to backend folder
- `source venv/bin/activate` - Activate Python environment
- `uvicorn app.main:app --reload --port 8000` - Start FastAPI server
  - `--reload` = Auto-restart on code changes
  - `--port 8000` = Run on port 8000

---

## 🐛 Troubleshooting

### "No module named 'openai'"

```bash
cd /Users/kentaro/VSC/VerilogAI/backend
source venv/bin/activate
uv pip install openai
```

### "venv/bin/activate: No such file"

Virtual environment not created. Run:

```bash
cd /Users/kentaro/VSC/VerilogAI/backend
python3 -m venv venv
source venv/bin/activate
pip install uv
uv pip install -e .
```

### "Address already in use"

```bash
lsof -ti:8000 | xargs kill -9
# Then start backend again
```

---

## ✅ Full Setup (If Starting Fresh)

```bash
# 1. Go to backend folder
cd /Users/kentaro/VSC/VerilogAI/backend

# 2. Create virtual environment (if not exists)
python3 -m venv venv

# 3. Activate it
source venv/bin/activate

# 4. Install dependencies
pip install uv
uv pip install -e .
uv pip install openai

# 5. Start server
uvicorn app.main:app --reload --port 8000
```

---

## 🎯 Keep Backend Running

**Important:** Keep this terminal window open!

The backend must stay running while you use the IDE.

If you close the terminal or press Ctrl+C, the backend stops.

---

## ✅ Success Checklist

- [ ] Terminal shows "Application startup complete"
- [ ] `http://localhost:8000/docs` works in browser
- [ ] No errors in terminal
- [ ] Frontend can connect (test by clicking "Gen TB")

---

**TL;DR:**

```bash
cd /Users/kentaro/VSC/VerilogAI/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Keep this terminal open!** 🚀
