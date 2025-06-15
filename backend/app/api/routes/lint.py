import os
import tempfile
import subprocess
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/lint", tags=["lint"])

class LintRequest(BaseModel):
    code: str

class Diagnostic(BaseModel):
    line: int
    column: int
    severity: str  # "error" or "warning"
    message: str

class LintResponse(BaseModel):
    diagnostics: list[Diagnostic]

@router.post("/", response_model=LintResponse)
def lint(req: LintRequest):
    # Write code to a temp .v file
    with tempfile.NamedTemporaryFile(suffix=".v", delete=False) as f:
        path = f.name
        f.write(req.code.encode())
        print(f"Temporary file created at: {path}")
    try:
        cp = subprocess.run(
            ["verilator", "--lint-only", "--Wall", path],
            capture_output=True, text=True
        )
    except FileNotFoundError:
        raise HTTPException(500, "Verilator is not installed in the container")

    os.unlink(path)

    diags = []
    print(cp.stdout)
    # Regex to capture: %Error: <file>:<line>:<col>: <message>
    pattern = re.compile(r"^%(Error|Warning):[^:]+:(\d+):(\d+):\s*(.+)$")
    for line in cp.stdout.splitlines() + cp.stderr.splitlines():
        m = pattern.match(line)
        if not m:
            continue  # skip any lines that don't match
        sev_tag, ln, col, msg = m.groups()
        severity = "error" if sev_tag == "Error" else "warning"
        diags.append(Diagnostic(
            line=int(ln),
            column=int(col),
            severity=severity,
            message=msg.strip()
        ))
    print(f"Diagnostics found: {diags}")
    return LintResponse(diagnostics=diags)
