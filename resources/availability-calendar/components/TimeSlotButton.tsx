import React from "react";
import type { TimeSlotItem } from "../types";

interface TimeSlotButtonProps {
  slot: TimeSlotItem;
  onClick: () => void;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  slot,
  onClick,
}) => {
  if (!slot.is_available) {
    return (
      <button
        disabled
        className="w-full px-3 py-2 text-sm rounded-lg border border-default bg-default/5 text-secondary/50 cursor-not-allowed line-through"
      >
        {formatTime(slot.start_time)}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 text-sm rounded-lg border border-info/30 bg-info/5 text-info font-medium hover:bg-info/15 hover:border-info/50 transition-colors cursor-pointer"
    >
      {formatTime(slot.start_time)}
    </button>
  );
};
