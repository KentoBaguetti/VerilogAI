import React, { useEffect, useState, useRef } from "react";

interface WaveformViewerProps {
  vcdId: string;
  apiUrl: string;
}

interface Signal {
  name: string;
  type: string;
  bits: number;
  values: Array<{ time: number; value: string }>;
}

// Simple VCD parser
function parseVCD(vcdText: string) {
  const lines = vcdText.split("\n");
  const vars: any[] = [];
  const signals: { [key: string]: Array<{ time: number; value: string }> } = {};
  let timescale = "";
  let currentTime = 0;
  let inHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse timescale
    if (line.startsWith("$timescale")) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && !nextLine.startsWith("$")) {
        timescale = nextLine;
      }
    }

    // Parse variable declarations
    if (line.startsWith("$var")) {
      const parts = line.split(/\s+/);
      if (parts.length >= 5) {
        const varInfo = {
          type: parts[1],
          bits: parseInt(parts[2]) || 1,
          id: parts[3],
          name: parts[4],
        };
        vars.push(varInfo);
        signals[varInfo.id] = [];
      }
    }

    // Start of data section
    if (line.startsWith("$dumpvars") || line.startsWith("$enddefinitions")) {
      inHeader = false;
    }

    // Parse time stamps
    if (line.startsWith("#")) {
      currentTime = parseInt(line.substring(1));
    }

    // Parse value changes
    if (!inHeader && !line.startsWith("$") && !line.startsWith("#") && line.length > 0) {
      // Binary value (e.g., "b1010 !")
      if (line.startsWith("b")) {
        const match = line.match(/^b([01xz]+)\s+(.+)$/);
        if (match) {
          const value = match[1];
          const id = match[2];
          if (signals[id]) {
            signals[id].push({ time: currentTime, value });
          }
        }
      }
      // Single bit value (e.g., "1!" or "0!")
      else if (line.length >= 2 && (line[0] === "0" || line[0] === "1" || line[0] === "x" || line[0] === "z")) {
        const value = line[0];
        const id = line.substring(1);
        if (signals[id]) {
          signals[id].push({ time: currentTime, value });
        }
      }
    }
  }

  return {
    timescale,
    vars,
    signals,
  };
}


const WaveformViewer: React.FC<WaveformViewerProps> = ({ vcdId, apiUrl }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timescale, setTimescale] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVCD = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}/api/v1/simulate/vcd/${vcdId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch VCD: ${response.statusText}`);
        }

        const vcdText = await response.text();

        // Parse VCD using our custom parser
        const parsed = parseVCD(vcdText);

        // Extract timescale
        if (parsed.timescale) {
          setTimescale(parsed.timescale);
        }

        // Check if we have variables
        if (!parsed.vars || parsed.vars.length === 0) {
          throw new Error("No signals found in VCD file");
        }

        // Convert to our Signal format
        const extractedSignals: Signal[] = parsed.vars.map((v) => {
          const signalId = v.id;
          const signalData = parsed.signals[signalId] || [];

          return {
            name: v.name,
            type: v.type || "wire",
            bits: v.bits || 1,
            values: signalData,
          };
        });

        setSignals(extractedSignals);
      } catch (err) {
        console.error("VCD parsing error:", err);
        setError(err instanceof Error ? err.message : "Failed to load waveform");
      } finally {
        setLoading(false);
      }
    };

    fetchVCD();
  }, [vcdId, apiUrl]);

  // Render waveforms when signals change
  useEffect(() => {
    if (signals.length > 0 && waveformRef.current) {
      try {
        // Calculate max time
        const maxTime = Math.max(
          ...signals.flatMap((s) => s.values.map((v) => v.time)),
          100 // Minimum time range
        );

        renderWaveforms(signals, maxTime, waveformRef.current, zoom);
      } catch (err) {
        console.error("Waveform rendering error:", err);
        setError("Failed to render waveform: " + (err instanceof Error ? err.message : String(err)));
      }
    }
  }, [signals, zoom]);

  // Canvas-based waveform renderer
  function renderWaveforms(
    signals: Signal[],
    maxTime: number,
    container: HTMLDivElement,
    zoomLevel: number
  ) {
    // Clear container
    container.innerHTML = "";

    // Create SVG
    const signalHeight = 60;
    const signalPadding = 10;
    const leftMargin = 150;
    const rightMargin = 50;
    const topMargin = 30;
    const bottomMargin = 30;
    const timeWidth = 800 * zoomLevel;

    const totalHeight = signals.length * signalHeight + topMargin + bottomMargin;
    const totalWidth = leftMargin + timeWidth + rightMargin;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", totalWidth.toString());
    svg.setAttribute("height", totalHeight.toString());
    svg.style.fontFamily = "monospace";
    svg.style.fontSize = "12px";

    // Background
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    svg.appendChild(bg);

    // Draw time axis
    const timeAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    timeAxis.setAttribute("x1", leftMargin.toString());
    timeAxis.setAttribute("y1", (topMargin - 10).toString());
    timeAxis.setAttribute("x2", (leftMargin + timeWidth).toString());
    timeAxis.setAttribute("y2", (topMargin - 10).toString());
    timeAxis.setAttribute("stroke", "#2A2520");
    timeAxis.setAttribute("stroke-width", "1");
    svg.appendChild(timeAxis);

    // Time markers
    const timeSteps = 10;
    for (let i = 0; i <= timeSteps; i++) {
      const time = (maxTime / timeSteps) * i;
      const x = leftMargin + (timeWidth / timeSteps) * i;

      const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tick.setAttribute("x1", x.toString());
      tick.setAttribute("y1", (topMargin - 10).toString());
      tick.setAttribute("x2", x.toString());
      tick.setAttribute("y2", (topMargin - 5).toString());
      tick.setAttribute("stroke", "#2A2520");
      tick.setAttribute("stroke-width", "1");
      svg.appendChild(tick);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x.toString());
      label.setAttribute("y", (topMargin - 15).toString());
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#2A2520");
      label.setAttribute("font-size", "10");
      label.textContent = Math.round(time).toString();
      svg.appendChild(label);
    }

    // Draw each signal
    signals.forEach((signal, index) => {
      const y = topMargin + index * signalHeight + signalHeight / 2;

      // Signal name
      const name = document.createElementNS("http://www.w3.org/2000/svg", "text");
      name.setAttribute("x", "10");
      name.setAttribute("y", y.toString());
      name.setAttribute("dominant-baseline", "middle");
      name.setAttribute("fill", "#2A2520");
      name.setAttribute("font-weight", "600");
      name.textContent = signal.name;
      svg.appendChild(name);

      // Signal type/info
      const info = document.createElementNS("http://www.w3.org/2000/svg", "text");
      info.setAttribute("x", "10");
      info.setAttribute("y", (y + 12).toString());
      info.setAttribute("fill", "#2A2520");
      info.setAttribute("opacity", "0.6");
      info.setAttribute("font-size", "9");
      info.textContent = signal.bits > 1 ? `[${signal.bits - 1}:0]` : signal.type;
      svg.appendChild(info);

      // Draw waveform
      if (signal.values.length > 0) {
        drawSignalWave(svg, signal, y, leftMargin, timeWidth, maxTime, signalHeight);
      }
    });

    container.appendChild(svg);
  }

  function drawSignalWave(
    svg: SVGSVGElement,
    signal: Signal,
    y: number,
    leftMargin: number,
    timeWidth: number,
    maxTime: number,
    signalHeight: number
  ) {
    const waveHeight = 20;
    const sorted = [...signal.values].sort((a, b) => a.time - b.time);

    if (signal.bits === 1) {
      // Single-bit signal - digital waveform
      let path = "";
      let lastValue = "x";
      let lastX = leftMargin;

      for (let i = 0; i < sorted.length; i++) {
        const v = sorted[i];
        const x = leftMargin + (v.time / maxTime) * timeWidth;
        const value = v.value.toLowerCase();

        // Draw horizontal line from last position
        if (i === 0) {
          path += `M ${lastX} ${value === "1" ? y - waveHeight / 2 : y + waveHeight / 2} `;
        } else {
          path += `L ${x} ${lastValue === "1" ? y - waveHeight / 2 : y + waveHeight / 2} `;
        }

        // Draw transition
        if (value === "1") {
          path += `L ${x} ${y - waveHeight / 2} `;
        } else if (value === "0") {
          path += `L ${x} ${y + waveHeight / 2} `;
        } else {
          // Unknown or high-Z
          path += `L ${x} ${y} `;
        }

        lastValue = value;
        lastX = x;
      }

      // Extend to end
      path += `L ${leftMargin + timeWidth} ${lastValue === "1" ? y - waveHeight / 2 : y + waveHeight / 2}`;

      const wavePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      wavePath.setAttribute("d", path);
      wavePath.setAttribute("stroke", "#C85C3C");
      wavePath.setAttribute("stroke-width", "2");
      wavePath.setAttribute("fill", "none");
      svg.appendChild(wavePath);
    } else {
      // Multi-bit signal - bus representation
      for (let i = 0; i < sorted.length; i++) {
        const v = sorted[i];
        const x = leftMargin + (v.time / maxTime) * timeWidth;
        const nextX = i < sorted.length - 1
          ? leftMargin + (sorted[i + 1].time / maxTime) * timeWidth
          : leftMargin + timeWidth;

        // Bus shape (parallelogram)
        const busPath = `
          M ${x + 5} ${y - waveHeight / 2}
          L ${nextX} ${y - waveHeight / 2}
          L ${nextX - 5} ${y + waveHeight / 2}
          L ${x} ${y + waveHeight / 2}
          Z
        `;

        const bus = document.createElementNS("http://www.w3.org/2000/svg", "path");
        bus.setAttribute("d", busPath);
        bus.setAttribute("fill", "#F5F1E8");
        bus.setAttribute("stroke", "#8B7355");
        bus.setAttribute("stroke-width", "1.5");
        svg.appendChild(bus);

        // Value label
        const hexValue = parseInt(v.value, 2).toString(16).toUpperCase().padStart(Math.ceil(signal.bits / 4), "0");
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", ((x + nextX) / 2).toString());
        label.setAttribute("y", y.toString());
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "middle");
        label.setAttribute("fill", "#2A2520");
        label.setAttribute("font-size", "11");
        label.setAttribute("font-weight", "600");
        label.textContent = "0x" + hexValue;
        svg.appendChild(label);
      }
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const handleExportSVG = () => {
    if (waveformRef.current) {
      const svg = waveformRef.current.querySelector("svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "waveform.svg";
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">⚙️</div>
          <p className="text-sm text-ink opacity-70">Loading waveform...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-red-600">❌</span>
          <div>
            <p className="font-semibold text-red-800">Failed to load waveform</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-cream">
        <div>
          <h4 className="text-sm font-semibold text-ink">
            📊 Waveform Viewer
          </h4>
          {timescale && (
            <p className="text-xs text-ink opacity-60 mt-1">
              Timescale: {timescale}
            </p>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md" style={{ borderColor: "rgba(42, 37, 32, 0.2)" }}>
            <button
              onClick={handleZoomOut}
              className="px-2 py-1 text-xs font-medium hover:bg-gray-100 transition-colors rounded-l-md"
              title="Zoom Out"
              disabled={zoom <= 0.5}
            >
              🔍−
            </button>
            <span className="px-2 text-xs text-ink opacity-70">{zoom.toFixed(1)}x</span>
            <button
              onClick={handleZoomIn}
              className="px-2 py-1 text-xs font-medium hover:bg-gray-100 transition-colors"
              title="Zoom In"
              disabled={zoom >= 4}
            >
              🔍+
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs font-medium hover:bg-gray-100 transition-colors rounded-r-md border-l"
              style={{ borderColor: "rgba(42, 37, 32, 0.2)" }}
              title="Reset Zoom"
            >
              ⟲
            </button>
          </div>
          
          <button
            onClick={handleExportSVG}
            className="px-3 py-1 text-xs font-medium rounded-md transition-all hover:opacity-90"
            style={{
              background: "#8B7355",
              color: "white",
            }}
            title="Export as SVG"
          >
            💾 SVG
          </button>
          
          <a
            href={`${apiUrl}/api/v1/simulate/vcd/${vcdId}`}
            download="waveform.vcd"
            className="px-3 py-1 text-xs font-medium rounded-md transition-all hover:opacity-90"
            style={{
              background: "#C85C3C",
              color: "white",
            }}
            title="Download VCD file"
          >
            ⬇️ VCD
          </a>
        </div>
      </div>

      {/* Waveform Display */}
      <div className="flex-1 overflow-auto p-4 bg-white">
        {signals.length === 0 ? (
          <div className="text-center py-8 text-ink opacity-50">
            <p className="text-sm">No signals found</p>
          </div>
        ) : (
          <div
            ref={waveformRef}
            className="wavedrom-container"
            style={{ minHeight: "200px" }}
          />
        )}
      </div>

      {/* Footer with info */}
      <div className="px-4 py-2 border-t bg-cream">
        <p className="text-xs text-ink opacity-60">
          💡 Tip: Use zoom controls to adjust view. Download VCD for GTKWave or export SVG for documentation.
        </p>
      </div>
    </div>
  );
};

export default WaveformViewer;
