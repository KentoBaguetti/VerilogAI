import React from "react";

interface LandingPageProps {
  onStart: () => void;
  onViewPricing: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
  onViewPricing,
}) => {
  return (
    <div
      className="h-screen flex items-center justify-center grain"
      style={{
        background:
          "linear-gradient(135deg, #F5F1E8 0%, #FBF8F3 50%, #D4C4A8 100%)",
      }}
    >
      <div className="text-center max-w-3xl px-8">
        <h1
          className="font-serif text-7xl font-bold mb-6 animate-fadeInUp"
          style={{
            color: "#2A2520",
            animationDelay: "0.1s",
            opacity: 0,
          }}
        >
          archiTECH
        </h1>
        <p
          className="text-xl mb-4 animate-fadeInUp"
          style={{
            color: "#2A2520",
            opacity: 0.7,
            animationDelay: "0.3s",
          }}
        >
          An all in one coding workspace for Hardware Engineers
        </p>
        <p
          className="text-base mb-12 max-w-xl mx-auto animate-fadeInUp"
          style={{
            color: "#2A2520",
            opacity: 0.6,
            animationDelay: "0.5s",
          }}
        >
          Web-based Verilog IDE with AI-powered code completion, automated
          testbench generation, simulation, and waveform visualization for
          faster hardware design.
        </p>
        <div className="flex flex-row gap-10 justify-center">
          <button
            onClick={onStart}
            className="animate-fadeInUp px-10 py-4 text-lg font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              background: "#C85C3C",
              color: "white",
              animationDelay: "0.7s",
              opacity: 0,
              boxShadow: "0 4px 20px rgba(200, 92, 60, 0.3)",
            }}
          >
            Begin Creating
          </button>
          <button
            onClick={onViewPricing}
            className="animate-fadeInUp px-10 py-4 text-lg font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              background: "#C85C3C",
              color: "white",
              animationDelay: "0.7s",
              opacity: 0,
              boxShadow: "0 4px 20px rgba(200, 92, 60, 0.3)",
            }}
          >
            View Pricing
          </button>
        </div>

        <div
          className="mt-16 flex justify-center gap-8 text-sm animate-fadeInUp"
          style={{ opacity: 0.5, animationDelay: "0.9s" }}
        >
          <span>Verilog IDE</span>
          <span>•</span>
          <span>AI Assistant</span>
          <span>•</span>
          <span>Test Automation</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
