import React, { useState } from "react";
import WaveformViewer from "./WaveformViewer";

interface SimulationOutputProps {
  logs: string;
  vcdId?: string | null;
  apiUrl: string;
  isOpen: boolean;
  onClose: () => void;
  height: number;
  onResize: (e: React.MouseEvent) => void;
}

const SimulationOutput: React.FC<SimulationOutputProps> = ({
  logs,
  vcdId,
  apiUrl,
  isOpen,
  onClose,
  height,
  onResize,
}) => {
  const [activeTab, setActiveTab] = useState<"logs" | "waveform">("logs");

  if (!isOpen) return null;

  const hasError = logs.toLowerCase().includes("error");
  const hasWarning = logs.toLowerCase().includes("warning");
  const hasWaveform = !!vcdId;

  return (
    <div
      className="border-t grain bg-cream relative"
      style={{
        borderColor: "rgba(42, 37, 32, 0.08)",
        height: `${height}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={onResize}
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-terracotta transition-colors z-10"
        style={{
          background: "rgba(42, 37, 32, 0.1)",
        }}
        title="Drag to resize"
      >
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 rounded-full"
          style={{
            background: "rgba(42, 37, 32, 0.3)",
          }}
        />
      </div>
      {/* Header with Tabs */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ borderColor: "rgba(42, 37, 32, 0.08)" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-ink">
            📊 Simulation Output
          </span>

          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                activeTab === "logs"
                  ? "bg-terracotta text-white"
                  : "text-ink opacity-60 hover:opacity-100"
              }`}
            >
              📝 Logs
              {hasError && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-xs">
                  !
                </span>
              )}
            </button>
            {hasWaveform && (
              <button
                onClick={() => setActiveTab("waveform")}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  activeTab === "waveform"
                    ? "bg-terracotta text-white"
                    : "text-ink opacity-60 hover:opacity-100"
                }`}
              >
                📊 Waveform
              </button>
            )}
          </div>

          {/* Status Badges */}
          {activeTab === "logs" && (
            <>
              {hasError && (
                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                  Errors
                </span>
              )}
              {!hasError && hasWarning && (
                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                  Warnings
                </span>
              )}
              {!hasError && !hasWarning && logs && (
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                  Success
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-ink opacity-50 hover:opacity-100 transition-opacity"
          title="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "logs" && (
          <div className="h-full overflow-auto p-4 bg-white">
            {logs ? (
              <pre
                className="text-xs font-mono text-ink whitespace-pre-wrap"
                style={{ margin: 0 }}
              >
                {logs}
              </pre>
            ) : (
              <div className="text-center text-ink opacity-50 py-8">
                <p className="text-sm">No simulation output yet</p>
                <p className="text-xs mt-2">
                  Click "Run" to compile and simulate your design
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "waveform" && hasWaveform && vcdId && (
          <WaveformViewer vcdId={vcdId} apiUrl={apiUrl} />
        )}
      </div>
    </div>
  );
};

export default SimulationOutput;

