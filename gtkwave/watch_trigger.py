import os
import time
import subprocess

TRIGGER_PATH = "/wave/trigger-gtkwave.txt"
VCD_PATH = "/wave/test.vcd"

while True:
    if os.path.exists(TRIGGER_PATH):
        try:
            os.remove(TRIGGER_PATH)
            if os.path.exists(VCD_PATH):
                subprocess.Popen(["gtkwave", VCD_PATH], env={**os.environ, "DISPLAY": ":0"})
        except Exception as e:
            print(f"Error launching GTKWave: {e}")
    time.sleep(2)

