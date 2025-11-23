import React from "react";

interface SimulationOutputProps {
  logs: string;
  isOpen: boolean;
  onClose: () => void;
}

const SimulationOutput: React.FC<SimulationOutputProps> = ({
  logs,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const hasError = logs.toLowerCase().includes("error");
  const hasWarning = logs.toLowerCase().includes("warning");

  return (
    <div
      className="border-t grain bg-cream"
      style={{
        borderColor: "rgba(42, 37, 32, 0.08)",
        height: "300px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: "rgba(42, 37, 32, 0.08)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">
            📊 Simulation Output
          </span>
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

      {/* Output Content */}
      <div className="flex-1 overflow-auto p-4 bg-white">
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
    </div>
  );
};

export default SimulationOutput;

