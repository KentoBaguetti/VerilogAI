# ⚡ TEST SIMULATION NOW - 2 MINUTES

## 🚀 Quick Test

### 1. Start Servers (30 seconds)
```bash
# Terminal 1:
cd /Users/kentaro/VSC/VerilogAI
docker-compose up

# Terminal 2:
cd /Users/kentaro/VSC/VerilogAI/new-frontend
npm run dev
```

### 2. Open Browser (5 seconds)
```
http://localhost:5173
```

### 3. Test Workflow (1 minute)

**Step 1**: Click `modules/gate.v` in file tree

**Step 2**: Click **"Gen TB"** button (green)
- Wait 5 seconds
- Testbench appears in `/testbenches/`

**Step 3**: Click **"▶️ Run"** button (orange/red)
- Watch spinner: "⟳ Running..."
- Output panel appears at bottom
- See: "✅ Compilation successful"
- See: "✅ Simulation complete"

**Step 4**: Check results
- Output panel shows simulation logs
- Chat shows success message
- Done! 🎉

---

## ✅ What Should Happen

### Successful Run Looks Like:

**Header:**
```
[▶️ Run] → [⟳ Running...] → [▶️ Run]
```

**Output Panel (bottom):**
```
📊 Simulation Output    [Success]    [Close]
─────────────────────────────────────────────
✅ Compilation successful (0.08s)
✅ Simulation complete (0.12s)

VCD info: dumping to test.vcd
$dumpvars: depth = 0, variables = 3
Test: a=0, b=0, y=0
Test: a=0, b=1, y=0
Test: a=1, b=0, y=0
Test: a=1, b=1, y=1
All tests complete!
```

**Chat:**
```
✅ Simulation complete!

Module: `gate.v`
Testbench: `gate_tb.v`

Check the output panel for simulation logs.
📊 Waveform generated! VCD file ready.
```

---

## 🐛 If Something Goes Wrong

### Backend not running?
```bash
# Check logs:
docker-compose logs backend

# Restart:
docker-compose restart
```

### Frontend not connecting?
```bash
# Check frontend is on port 5173:
http://localhost:5173

# Restart:
cd new-frontend
npm run dev
```

### No testbench found?
```
1. Click "Gen TB" first
2. Wait for testbench to generate
3. Then click "Run"
```

### Compilation error?
- Check output panel for exact error
- Common: syntax errors, missing semicolons
- Fix in editor and click "Run" again

---

## 🎯 Quick Demo Video Script

**0:00-0:05**: "This is VerilogAI - an AI-powered HDL IDE"

**0:05-0:10**: "Here's a simple AND gate module"

**0:10-0:15**: "Click Gen TB - AI generates testbench"

**0:15-0:20**: "Click Run - compile and simulate instantly"

**0:20-0:25**: "See results in output panel"

**0:25-0:30**: "From code to simulation in under 10 seconds!"

---

## 📊 Success Checklist

- [ ] Backend running (docker-compose up)
- [ ] Frontend running (npm run dev)
- [ ] Can open files
- [ ] "Gen TB" generates testbench
- [ ] "Run" compiles and simulates
- [ ] Output panel shows logs
- [ ] No errors in console

**All checked?** You're ready! 🚀

---

## 🎉 Everything Works!

### What You Have:
✅ AI testbench generation (OpenAI)  
✅ One-click compilation (iverilog)  
✅ Real-time simulation (vvp)  
✅ Output panel with logs  
✅ Error handling  
✅ Chat integration  
✅ Loading indicators  
✅ 100% local (no GCS)  

### Time to Demo:
✅ ~30 seconds per module  
✅ ~3 minutes full walkthrough  
✅ ~10 seconds iteration cycle  

**You're hackathon-ready!** 🏆

---

*Need help? Check `HACKATHON_QUICKSTART.md` for detailed guide*

