import React from "react";
import type { VisitReasonItem } from "../types";

interface VisitReasonListProps {
  visitReasons: VisitReasonItem[];
}

export const VisitReasonList: React.FC<VisitReasonListProps> = ({
  visitReasons,
}) => {
  if (visitReasons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visitReasons.map((reason) => (
        <span
          key={reason.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-default text-secondary"
        >
          {reason.name}
          {reason.is_new_patient && (
            <span className="text-[10px] font-semibold text-info">NEW</span>
          )}
        </span>
      ))}
    </div>
  );
};
