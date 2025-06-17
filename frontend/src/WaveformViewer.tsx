import React, { useEffect, useState } from "react";
import { parse } from "vcd";

interface WaveformViewerProps {
  vcdText: string;
}

const WaveformViewer: React.FC<WaveformViewerProps> = ({ vcdText }) => {
  const [signals, setSignals] = useState<string[]>([]);

  useEffect(() => {
    try {
      const parsed = parse(vcdText);
      const topScope = parsed.scopes?.[0];

      if (!topScope || !topScope.vars) throw new Error("No signals");

      const lines = topScope.vars.map((v) => `Signal: ${v.references?.join(".") || v.name} (${v.bits})`);
      setSignals(lines);
    } catch (err) {
      setSignals(["❌ Failed to parse VCD data."]);
    }
  }, [vcdText]);

  return (
    <pre
      style={{
        backgroundColor: "#111",
        color: "#0f0",
        padding: "10px",
        fontFamily: "monospace",
        fontSize: "0.85rem",
        maxHeight: "300px",
        overflowY: "auto",
      }}
    >
      {signals.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </pre>
  );
};

export default WaveformViewer;
