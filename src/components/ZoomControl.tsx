import React from "react";

export default function ZoomControls({
  zoomPercent,
  onReset,
}: {
  zoomPercent: number;
  onReset: () => void;
}) {
  return (
    <div className="fixed z-50 flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-md bottom-4 right-4 bg-white/90">
      <span>Zoom: {zoomPercent}%</span>
      <button
        onClick={onReset}
        className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        Reset
      </button>
    </div>
  );
}
