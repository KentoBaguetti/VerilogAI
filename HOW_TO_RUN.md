# ⚡ HOW TO RUN SIMULATION

## ✅ THE CORRECT WAY (This Works!)

### Step-by-step:

1. **Click on `modules/gate.v`** ← The MODULE file (NOT testbench!)
2. **Click "Gen TB" button** → Generates testbench
3. **Click on `modules/gate.v` AGAIN** ← Make sure module is selected!
4. **Click "Run" button** → Simulation works! ✅

---

## ❌ DON'T DO THIS (Will Fail!)

- ❌ Don't click testbench file and then Run
- ❌ Don't click Run without checking which file is selected

---

## 🎯 Rule of Thumb

**Always make sure `modules/gate.v` is highlighted in blue before clicking Run!**

---

## 🔍 How to Know What's Selected

Look at the file sidebar - the selected file will be **highlighted in blue**.

Make sure it shows: `modules/gate.v` (or your module name)

NOT: `testbenches/gate_tb.v`

---

## 📊 Quick Test

1. Open `http://localhost:5173`
2. Click `modules/gate.v` (should turn blue)
3. Click "Run"
4. Output panel should open with compilation logs ✅

---

## 🐛 If You Get Error

Error: `'and_gate_tb' has already been declared`

**Fix:**
1. Click `modules/gate.v` in the file tree
2. Look - is it highlighted in blue? 
3. Click "Run" again
4. Should work now! ✅

---

**TL;DR: Always click the MODULE file before clicking Run!** 🎯

