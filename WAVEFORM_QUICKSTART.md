# 📊 Waveform Viewer - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Start Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

✅ You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### Step 2: Start Frontend (Terminal 2)
```bash
cd new-frontend
npm run dev
```

✅ You should see:
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

---

### Step 3: Test the Waveform Viewer

1. **Open Browser**
   - Go to: http://localhost:5173

2. **Enter the App**
   - Click **"Begin Creating"**

3. **Open a Module**
   - Click on **`modules/and_gate.v`** in the sidebar

4. **Generate Testbench**
   - Click **"Gen TB"** button in the header
   - Wait ~2-5 seconds for AI to generate testbench
   - ✅ You'll see: "Testbench generated successfully!"

5. **Run Simulation**
   - Click **"Run"** button in the header
   - Wait ~1-2 seconds for compilation
   - ✅ Output panel opens automatically

6. **View Waveforms** 🎯
   - Look at the output panel at the bottom
   - You'll see two tabs: **📝 Logs** | **📊 Waveform**
   - Click the **"📊 Waveform"** tab
   - ✨ **See your waveforms!**

7. **Download VCD** (Optional)
   - Click **"⬇️ Download VCD"** button
   - Open in GTKWave for advanced viewing

---

## 🎯 Expected Output

### In the Chat (after Gen TB):
```
✅ Testbench generated successfully!

Created `and_gate_tb.v` in `/testbenches/` folder.

✨ Ready to simulate! Click the "Run" button now...
```

### In the Chat (after Run):
```
✅ Simulation complete!

Module: `and_gate.v`
Testbench: `and_gate_tb.v`

📊 Waveform generated! Click the 'Waveform' tab in the output panel to view it.
```

### In the Waveform Tab:
```
📊 Waveform Viewer                    [⬇️ Download VCD]
Timescale: 1ns

┌─────────────────────────────────────────┐
│ a (reg [0:0])              4 changes   │
│ @0: x  @10: 0  @20: 1  @30: 0          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ b (reg [0:0])              4 changes   │
│ @0: x  @10: 0  @20: 0  @30: 1          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ y (wire [0:0])             4 changes   │
│ @0: x  @10: 0  @20: 0  @30: 0          │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Backend Not Starting?
```bash
# Check if port 8000 is already in use
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use a different port:
uvicorn app.main:app --reload --port 8001
# Update apiUrl in App.tsx to match
```

### Frontend Not Starting?
```bash
# Reinstall dependencies
cd new-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### No Waveform Tab Appearing?
**Check these:**
1. ✅ Simulation completed successfully (no errors in Logs tab)
2. ✅ Backend logs show: "VCD waveform file generated successfully (ID: xxxxxxxx)"
3. ✅ Testbench includes `$dumpfile()` and `$dumpvars()` (Gen TB does this automatically)

**Fix:**
- Regenerate testbench with "Gen TB"
- Make sure you're clicking "Run" on a **module file**, not a testbench

### "Failed to fetch" Error?
```bash
# Backend not running or wrong port
# Check backend terminal for errors
# Restart backend:
cd backend
uvicorn app.main:app --reload --port 8000
```

---

## 📚 What Files Were Changed?

If you want to understand the implementation:

**Backend:** `backend/app/api/routes/simulate.py`
- VCD files saved to `backend/vcd_files/`
- New endpoint: `/api/v1/simulate/vcd/{vcd_id}`

**Frontend:**
- `new-frontend/src/components/WaveformViewer.tsx` (NEW)
- `new-frontend/src/components/SimulationOutput.tsx` (tabs added)
- `new-frontend/src/App.tsx` (vcdId state)

---

## 🎉 Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Can open the app in browser
- [ ] Can generate testbench
- [ ] Can run simulation
- [ ] **Waveform tab appears** ✨
- [ ] **Can see signal values** 📊
- [ ] Can download VCD file

---

## 🚀 Next Steps

Once everything works:

1. **Try Your Own Modules**
   - Create new `.v` files
   - Generate testbenches
   - View waveforms

2. **Advanced Viewing**
   - Download VCD files
   - Open in GTKWave for detailed analysis
   - Compare multiple simulation runs

3. **Share & Demo**
   - Show off your waveform viewer!
   - This is a killer feature for hardware developers

---

## 💡 Pro Tips

1. **Keep Backend Running**
   - Leave backend terminal open in background
   - VCD files persist between refreshes

2. **Use Chrome DevTools**
   - Press F12 to see console logs
   - Network tab shows VCD file downloads

3. **GTKWave Integration**
   - Download VCD from browser
   - Open with: `gtkwave waveform.vcd`
   - Much more powerful for large designs

---

**Need help?** Check `WAVEFORM_VIEWER_IMPLEMENTATION.md` for detailed docs.

**Ready to test?** Follow the 3 steps above and you'll see waveforms in < 5 minutes! 🎯

