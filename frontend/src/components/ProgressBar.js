// ProgressBar.js - simple progress bar for showing group completion %
import React from "react";

export default function ProgressBar({ percent }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 my-2">
      <div
        className="bg-green-500 h-4 rounded-full text-xs text-white text-center transition-all duration-300"
        style={{ width: `${percent}%` }}
      >
        {percent > 10 ? `${percent}%` : ""}
      </div>
    </div>
  );
}
