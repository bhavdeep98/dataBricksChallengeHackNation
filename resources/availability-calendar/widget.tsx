import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React, { useCallback } from "react";
import "../styles.css";
import { DateColumn } from "./components/DateColumn";
import type { AvailabilityCalendarProps, TimeSlotItem } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Display available appointment time slots grouped by date",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Checking availability...",
    invoked: "Availability loaded",
  },
};

function formatDateHeader(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDateKey(isoString: string): string {
  return new Date(isoString).toISOString().split("T")[0];
}

const AvailabilityCalendar: React.FC = () => {
  const { props, isPending, sendFollowUpMessage } =
    useWidget<AvailabilityCalendarProps>();

  const handleSlotSelect = useCallback(
    (providerName: string, providerLocationId: string, slot: TimeSlotItem) => {
      sendFollowUpMessage(
        `Book an appointment with ${providerName} at ${slot.start_time} (provider_location_id: ${providerLocationId})`
      );
    },
    [sendFollowUpMessage]
  );

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="bg-surface-elevated border border-default rounded-3xl p-6">
          <div className="h-5 w-48 rounded-md bg-default/10 animate-pulse mb-4" />
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 min-w-[120px]">
                <div className="h-4 w-20 mx-auto rounded bg-default/10 animate-pulse" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-9 rounded-lg bg-default/10 animate-pulse"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const { availabilities } = props;

  // Group all slots by date across all providers
  const slotsByDate = new Map<
    string,
    { dateLabel: string; slots: { slot: TimeSlotItem; providerName: string; providerLocationId: string }[] }
  >();

  for (const availability of availabilities) {
    for (const slot of availability.slots) {
      const dateKey = getDateKey(slot.start_time);
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, {
          dateLabel: formatDateHeader(slot.start_time),
          slots: [],
        });
      }
      slotsByDate.get(dateKey)!.slots.push({
        slot,
        providerName: availability.provider_name,
        providerLocationId: availability.provider_location_id,
      });
    }
  }

  // Sort dates chronologically
  const sortedDates = Array.from(slotsByDate.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const totalAvailable = availabilities.reduce(
    (sum, a) => sum + a.slots.filter((s) => s.is_available).length,
    0
  );

  return (
    <McpUseProvider>
      <div className="bg-surface-elevated border border-default rounded-3xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-default">
            Available Time Slots
          </h2>
          <p className="text-sm text-secondary">
            {totalAvailable} available slot{totalAvailable !== 1 ? "s" : ""}{" "}
            across {sortedDates.length} day{sortedDates.length !== 1 ? "s" : ""}
          </p>
        </div>

        {sortedDates.length === 0 ? (
          <p className="text-sm text-secondary">
            No time slots available for the selected dates.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {sortedDates.map(([dateKey, { dateLabel, slots }]) => (
              <DateColumn
                key={dateKey}
                dateLabel={dateLabel}
                slots={slots.map((s) => s.slot)}
                onSlotSelect={(slot) => {
                  const entry = slots.find((s) => s.slot === slot);
                  if (entry) {
                    handleSlotSelect(
                      entry.providerName,
                      entry.providerLocationId,
                      slot
                    );
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </McpUseProvider>
  );
};

export default AvailabilityCalendar;
