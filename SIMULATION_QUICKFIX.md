# 🔧 Simulation Quick Fix

## ✅ WORKING METHOD (Use This for Hackathon!)

### Always click the MODULE file first, then click Run:

```
1. Click modules/gate.v (the MODULE, not testbench)
2. Click "Run" button
3. ✅ Works!
```

---

## ❌ Known Issue

Clicking testbench file first sometimes causes errors. We're debugging this.

---

## 🎯 Demo Workflow

### For your hackathon demo:

1. **Create/Open module** (e.g., `counter.v`)
2. **Click "Gen TB"** → generates `counter_tb.v`
3. **Click back on the module file** (`counter.v`)
4. **Click "Run"** → compiles and simulates
5. **See output panel** → logs appear!

---

## 🐛 Debugging

Open browser console (F12) and you'll see:

```
=== SIMULATION START ===
Selected file: /modules/gate.v
📋 Final file assignments:
  Module: /modules/gate.v
  Testbench: /testbenches/and_gate_tb.v
✅ Files validated, proceeding with simulation...
🚀 Sending to backend:
  Module code: module and_gate...
  Testbench code: module and_gate_tb...
```

If you see the SAME file for both, that's the bug!

---

## ✅ Quick Test

```bash
# In browser console, after clicking Run, check:
# - Module path should be: /modules/XXX.v
# - Testbench path should be: /testbenches/XXX_tb.v
# - They should be DIFFERENT files!
```

---

## 🎉 For Hackathon

Just always click the module file before clicking Run. This will work reliably!

**Steps:**
1. modules/gate.v (click)
2. Gen TB (click)
3. modules/gate.v (click again)
4. Run (click)
5. ✅ Success!

---

*This workaround is solid for your demo!*

