# 🚀 Run VerilogAI Locally (No Docker!)

## Quick Setup (5 Minutes)

### Step 1: Install Verilog Tools (macOS)

```bash
# Install Homebrew if you don't have it
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install iverilog (for simulation)
brew install icarus-verilog

# Install verilator (for linting) - OPTIONAL
brew install verilator

# Verify installation
iverilog -v
```

---

### Step 2: Setup Python Backend

```bash
cd /Users/kentaro/VSC/VerilogAI/backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install uv (fast package installer)
pip install uv

# Install dependencies
uv pip install -e .
```

---

### Step 3: Check Environment Variables

```bash
# Check if OPENAI_API_KEY is set
echo $OPENAI_API_KEY

# If not set, export it:
export OPENAI_API_KEY="sk-proj-your-key-here"
```

---

### Step 4: Run Backend

```bash
cd /Users/kentaro/VSC/VerilogAI/backend

# Make sure venv is activated
source venv/bin/activate

# Run with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

### Step 5: Run Frontend

```bash
# In a NEW terminal
cd /Users/kentaro/VSC/VerilogAI/new-frontend

npm run dev
```

---

## 🎯 **That's It!**

Now open: `http://localhost:5173`

Everything should work! ✅

---

## 🐛 Troubleshooting

### "iverilog: command not found"

```bash
brew install icarus-verilog
```

### "Module not found" errors in Python

```bash
cd backend
source venv/bin/activate
uv pip install -e .
```

### "OPENAI_API_KEY not configured"

```bash
export OPENAI_API_KEY="your-key-here"
# Or add to ~/.zshrc for persistence
```

### Backend won't start

```bash
# Check port 8000 isn't in use
lsof -ti:8000 | xargs kill -9

# Try again
uvicorn app.main:app --reload --port 8000
```

---

## 📝 Quick Commands

### Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Start Frontend

```bash
cd new-frontend
npm run dev
```

### Check Backend is Running

```bash
curl http://localhost:8000/api/docs
# Should open API documentation
```

---

## ✅ What You Get

- ✅ Full simulation (iverilog + vvp)
- ✅ Testbench generation (OpenAI)
- ✅ Linting (verilator - optional)
- ✅ All IDE features
- ❌ No Docker needed!
- ❌ No GTKWave container (but you can install separately)

---

## 🚀 For Hackathon

This is actually **better** for demos:

- Faster startup
- Easier to debug
- No Docker issues
- Native performance

Good luck! 🎉
