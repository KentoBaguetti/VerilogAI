import React from "react";

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
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
                    VerilogAI
                </h1>
                <p
                    className="text-xl mb-4 animate-fadeInUp"
                    style={{
                        color: "#2A2520",
                        opacity: 0.7,
                        animationDelay: "0.3s",
                    }}
                >
                    Collaborative coding workspace for Verilog
                </p>
                <p
                    className="text-base mb-12 max-w-xl mx-auto animate-fadeInUp"
                    style={{
                        color: "#2A2520",
                        opacity: 0.6,
                        animationDelay: "0.5s",
                    }}
                >
                    Craft beautiful code with AI assistance. A thoughtfully
                    designed editor that brings intelligence and elegance to
                    your development workflow.
                </p>
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
                <div
                    className="mt-16 flex justify-center gap-8 text-sm animate-fadeInUp"
                    style={{ opacity: 0.5, animationDelay: "0.9s" }}
                >
                    <span>Monaco Editor</span>
                    <span>•</span>
                    <span>AI Assistant</span>
                    <span>•</span>
                    <span>Version Control</span>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
