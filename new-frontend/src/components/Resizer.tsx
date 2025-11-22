import React from "react";

interface ResizerProps {
    onResize: (e: React.MouseEvent) => void;
}

const Resizer: React.FC<ResizerProps> = ({ onResize }) => {
    return (
        <div
            className="resizer w-1 hover:w-1.5 transition-all"
            onMouseDown={onResize}
        />
    );
};

export default Resizer;
