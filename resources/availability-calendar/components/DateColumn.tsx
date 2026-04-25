import React from "react";
import type { TimeSlotItem } from "../types";
import { TimeSlotButton } from "./TimeSlotButton";

interface DateColumnProps {
  dateLabel: string;
  slots: TimeSlotItem[];
  onSlotSelect: (slot: TimeSlotItem) => void;
}

export const DateColumn: React.FC<DateColumnProps> = ({
  dateLabel,
  slots,
  onSlotSelect,
}) => {
  return (
    <div className="flex flex-col gap-2 min-w-[120px]">
      <h4 className="text-xs font-semibold text-default text-center pb-1 border-b border-default/20">
        {dateLabel}
      </h4>
      <div className="flex flex-col gap-1.5">
        {slots.map((slot, i) => (
          <TimeSlotButton
            key={i}
            slot={slot}
            onClick={() => onSlotSelect(slot)}
          />
        ))}
      </div>
    </div>
  );
};
