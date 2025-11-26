import os
import shutil
import tempfile
import subprocess
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse

router = APIRouter(prefix="/simulate", tags=["simulate"])

# VCD storage directory
VCD_STORAGE = Path("backend/vcd_files")
VCD_STORAGE.mkdir(parents=True, exist_ok=True)

class SimulateRequest(BaseModel):
    code: str
    testbench: str

class SimulateResponse(BaseModel):
    logs: str
    vcd_id: Optional[str] = None

@router.post("/", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    logs = ""
    
    # Check if iverilog is available
    try:
        subprocess.run(["iverilog", "-V"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        raise HTTPException(
            status_code=500,
            detail="iverilog is not installed or not in PATH. Please install iverilog on the server."
        )

    try:
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

        # Check if VCD file was generated and persist it
        vcd_id = None
        if os.path.exists(vcd_path):
            # Generate unique ID for this simulation
            vcd_id = str(uuid.uuid4())[:8]
            stored_vcd = VCD_STORAGE / f"{vcd_id}_test.vcd"
            
            # Copy VCD to persistent storage
            shutil.copyfile(vcd_path, stored_vcd)
            
            logs += f"\n✅ VCD waveform file generated successfully (ID: {vcd_id}).\n"
        else:
            logs += "\n[Info] No VCD file generated (testbench may not dump waveforms).\n"

        return SimulateResponse(logs=logs, vcd_id=vcd_id)
    except Exception as e:
        # Catch any unexpected errors and return them properly
        error_msg = f"Unexpected error during simulation: {str(e)}"
        logs += f"\n[Error] {error_msg}\n"
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/vcd/{vcd_id}")
def get_vcd(vcd_id: str):
    """Download VCD file by simulation ID"""
    vcd_file = VCD_STORAGE / f"{vcd_id}_test.vcd"
    
    if not vcd_file.exists():
        raise HTTPException(status_code=404, detail="VCD file not found or expired")
    
    return FileResponse(
        vcd_file,
        media_type="application/octet-stream",
        filename="waveform.vcd"
    )
