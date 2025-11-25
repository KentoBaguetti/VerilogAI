import React, { useEffect, useState } from "react";

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
        const match = line.match(/^b([01x]+)\s+(.+)$/);
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

  const renderSignalWaveform = (signal: Signal) => {
    if (signal.values.length === 0) {
      return <span className="text-xs opacity-50">No data</span>;
    }

    // Simple ASCII-art style visualization for now
    const maxTime = Math.max(...signal.values.map((v) => v.time));
    const width = 400; // pixels

    return (
      <div className="font-mono text-xs">
        {signal.values.slice(0, 10).map((v, i) => (
          <span key={i} className="mr-2">
            @{v.time}: {v.value}
          </span>
        ))}
        {signal.values.length > 10 && (
          <span className="opacity-50">
            ... ({signal.values.length - 10} more)
          </span>
        )}
      </div>
    );
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
        <a
          href={`${apiUrl}/api/v1/simulate/vcd/${vcdId}`}
          download="waveform.vcd"
          className="px-3 py-1 text-xs font-medium rounded-md transition-all"
          style={{
            background: "#C85C3C",
            color: "white",
          }}
          title="Download VCD file"
        >
          ⬇️ Download VCD
        </a>
      </div>

      {/* Signals List */}
      <div className="flex-1 overflow-auto p-4 bg-white">
        {signals.length === 0 ? (
          <div className="text-center py-8 text-ink opacity-50">
            <p className="text-sm">No signals found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal, i) => (
              <div
                key={i}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                style={{ borderColor: "rgba(42, 37, 32, 0.1)" }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono font-semibold text-sm text-ink">
                      {signal.name}
                    </span>
                    <span className="ml-2 text-xs text-ink opacity-60">
                      {signal.type}
                      {signal.bits > 1 && ` [${signal.bits - 1}:0]`}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                    {signal.values.length} changes
                  </span>
                </div>
                <div className="bg-gray-50 rounded p-2 overflow-x-auto">
                  {renderSignalWaveform(signal)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with info */}
      <div className="px-4 py-2 border-t bg-cream">
        <p className="text-xs text-ink opacity-60">
          💡 Tip: Download the VCD file to view in GTKWave or other waveform
          viewers for advanced analysis.
        </p>
      </div>
    </div>
  );
};

export default WaveformViewer;

