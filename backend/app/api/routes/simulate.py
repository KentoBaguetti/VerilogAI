import os
import shutil
import tempfile
import subprocess
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse

router = APIRouter(prefix="/simulate", tags=["simulate"])

class SimulateRequest(BaseModel):
    code: str
    testbench: str

class SimulateResponse(BaseModel):
    logs: str

@router.post("/", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    logs = ""

    with tempfile.TemporaryDirectory() as tmpdir:
        module_v = os.path.join(tmpdir, "module.v")
        tb_v     = os.path.join(tmpdir, "tb.v")
        out_vvp  = os.path.join(tmpdir, "sim.vvp")
        vcd_path = os.path.join(tmpdir, "test.vcd")

        with open(module_v, "w") as f:
            f.write(req.code)
        with open(tb_v, "w") as f:
            f.write(req.testbench)

        try:
            cp = subprocess.run(
                ["iverilog", "-o", out_vvp, module_v, tb_v],
                capture_output=True, text=True, check=True
            )
            logs += cp.stdout + cp.stderr
        except subprocess.CalledProcessError as e:
            logs += f"\n[Compiler error]\n{e.stdout}{e.stderr}"
            return SimulateResponse(logs=logs)

        # Change directory before running simulation
        old_cwd = os.getcwd()
        os.chdir(tmpdir)

        try:
            cp = subprocess.run(
                ["vvp", out_vvp],
                capture_output=True, text=True, check=True
            )
            logs += cp.stdout + cp.stderr
        except subprocess.CalledProcessError as e:
            logs += f"\n[Simulation error]\n{e.stdout}{e.stderr}"
            os.chdir(old_cwd)
            return SimulateResponse(logs=logs)

        os.chdir(old_cwd)  # Restore original directory

        # Check if VCD file was generated
        if os.path.exists(vcd_path):
            logs += "\n✅ VCD waveform file generated successfully.\n"
        else:
            logs += "\n[Info] No VCD file generated (testbench may not dump waveforms).\n"

    return SimulateResponse(logs=logs)

@router.get("/vcd")
def get_vcd():
    # VCD files are in temp directories and cleaned up after simulation
    # For local execution, waveforms are generated but not persisted
    raise HTTPException(status_code=404, detail="VCD file not available (local execution)")
