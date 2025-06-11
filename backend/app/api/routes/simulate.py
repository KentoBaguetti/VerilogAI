import os
import tempfile
import subprocess
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/simulate", tags=["simulate"])


class SimulateRequest(BaseModel):
    code: str
    testbench: str


class SimulateResponse(BaseModel):
    logs: str


@router.post("/", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    logs = ""
    # 1) Create a temp dir and write the two .v files
    with tempfile.TemporaryDirectory() as tmpdir:
        module_v = os.path.join(tmpdir, "module.v")
        tb_v     = os.path.join(tmpdir, "tb.v")
        out_vvp  = os.path.join(tmpdir, "sim.vvp")

        with open(module_v, "w") as f:
            f.write(req.code)
        with open(tb_v, "w") as f:
            f.write(req.testbench)

        # 2) Compile with iverilog
        try:
            cp = subprocess.run(
                ["iverilog", "-o", out_vvp, module_v, tb_v],
                capture_output=True, text=True, check=True
            )
            logs += cp.stdout + cp.stderr
        except subprocess.CalledProcessError as e:
            logs += f"\n[Compiler error]\n{e.stdout}{e.stderr}"
            return SimulateResponse(logs=logs)

        # 3) Simulate with vvp (assumes your TB does $dumpfile("wave.vcd") / $dumpvars)
        try:
            cp = subprocess.run(
                ["vvp", out_vvp],
                capture_output=True, text=True, check=True
            )
            logs += cp.stdout + cp.stderr
        except subprocess.CalledProcessError as e:
            logs += f"\n[Simulation error]\n{e.stdout}{e.stderr}"
            return SimulateResponse(logs=logs)

        # 4) Launch GTKWave on the generated VCD
        vcd = os.path.join(tmpdir, "wave.vcd")
        if os.path.exists(vcd):
            try:
                # this will pop up in WSLg or via X-forward
                subprocess.Popen(["gtkwave", vcd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception as e:
                logs += f"\n[GTKWave launch failed] {e}\n"
        else:
            logs += "\n[Warning] No wave.vcd found to open in GTKWave.\n"

    return SimulateResponse(logs=logs)
