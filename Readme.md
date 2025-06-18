## 🚀 Inspiration

Writing Verilog (and other HDLs) often involves a ton of repetitive boilerplate—module headers, signal declarations, resets, clock generators, testbench scaffolding—and there isn’t yet a dedicated open-source “copilot” for hardware description languages. We set out to bring the same productivity boost that AI coding assistants have given to software engineers into the world of digital design.

---

## ✨ What It Does

1. **Module Editing**  
   Write your Verilog modules in a full-featured Monaco-based editor.

2. **AI-Generated Testbenches**  
   Hit **Generate Testbench** and get a complete, runnable testbench (with `$dumpfile` / `$dumpvars`) courtesy of a Vertex AI model.

3. **Headless Simulation**  
   Run Icarus Verilog (`iverilog + vvp`) under the hood—no command line needed—and capture VCD waveform dumps automatically.

4. **In-Browser Waveform Viewing**  
   View your VCD output right in the browser via embedded GTKWave (noVNC/Xvfb) or, in the future, a pure-JS WaveDrom pane.

5. **Inline AI Suggestions**  
   Ghost-text completions pop up as you type common HDL patterns—Tab to accept, Esc to dismiss.

---

## 🏗 How We Built It

- **Full Stack**
  - used the Full stack template from FastAPI
  - this repo is cloned from https://github.com/fastapi/full-stack-fastapi-template.git, which is
  the best template available for web dev in my opinion
  - To figure out how to run this on your own system, follow the "FastApi_Readme" file

- **Frontend**  
  - React + TypeScript + Chakra UI  
  - Monaco Editor for code editing  
  - Axios for talking to our backend APIs

- **AI Layer**  
  - FastAPI backend  
  - Vertex-AI model (Codestral-2501) for both inline completions & testbench generation hosted on Google Cloud Platform

- **Simulation**  
  - Icarus Verilog inside Docker  
  - Shared VCD volume for cross-container waveform access

- **Waveform Viewer**  
  - GTKWave via noVNC + Xvfb/Fluxbox  
  - Future: migrate to a JS-native WaveDrom component

- **Version Control**
  - GitLab for version control and hosting the project publicly


- **Deployment**  
  - Docker Compose orchestrates:  
    - PostgreSQL (for other app services)  
    - FastAPI backend  
    - React frontend  
    - GTKWave container  
  - Traefik handles routing & TLS
  - Used Compute Engine on Google Cloud Platform to setup a virtual machine for hosting the website

---

## 🛠 Challenges We Ran Into

- **CORS & Networking**  
  Cross-container calls to fetch VCD files required careful CORS and volume sharing.

- **Filesystem Boundaries**  
  Moving VCD dumps between tmpfs and host volumes forced use of cross-device-safe methods.

- **Headless GTKWave**  
  Running GTKWave under Xvfb + noVNC, then embedding it securely in our dashboard.

- **Model Constraints**  
  Had to rely on an off-the-shelf model (Codestral-2501) rather than a custom-trained Verilog-specific model on GCP.

- **Security**  
  Current simulation tab still streams the whole Linux desktop. We’ll lock this down to only show the GTKWave pane.

---

## 🏅 Accomplishments

- **One-Click Flow**  
  Module edit → AI testbench → simulate → waveform, all in under 10 seconds.

- **First-Class HDL Copilot**  
  Seamless inline AI suggestions in Monaco for Verilog—a novel integration in the open-source world.

- **Fully Containerized Demo**  
  Open-source, Docker-Compose setup anyone can spin up locally or in the cloud.

---

## 📚 What We Learned

- The critical role of **CORS** and **network policy** when splitting services.
- Crafting effective **prompt engineering** to yield valid Verilog.
- Embedding legacy GUI apps (GTKWave) in a modern web UI.

---

## 🔮 What’s Next for VerilogAI

1. **Embedded GTKWave Pane**  
   Host only the GTKWave window (via GTKPlug or focused X11) as a dockable panel—no full desktop stream.

2. **Pure-JS Waveform Renderer**  
   Swap out noVNC for a browser-native viewer (WaveDrom or React component) for faster, tighter integration.

3. **Custom Verilog AI Model**  
   Train and deploy our own domain-specific model to deliver even more accurate HDL completions and testbenches.

---
