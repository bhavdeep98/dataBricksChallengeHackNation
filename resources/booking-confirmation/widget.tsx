import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import "../styles.css";
import type { BookingConfirmationProps } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Display the result of an appointment booking attempt",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Booking your appointment...",
    invoked: "Appointment booked",
  },
};

function formatDateTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const BookingConfirmation: React.FC = () => {
  const { props, isPending } = useWidget<BookingConfirmationProps>();

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="bg-surface-elevated border border-default rounded-3xl p-6">
          <div className="h-6 w-40 rounded-md bg-default/10 animate-pulse mb-3" />
          <div className="h-4 w-56 rounded-md bg-default/10 animate-pulse mb-2" />
          <div className="h-4 w-48 rounded-md bg-default/10 animate-pulse mb-2" />
          <div className="h-4 w-36 rounded-md bg-default/10 animate-pulse" />
        </div>
      </McpUseProvider>
    );
  }

  const { booking } = props;

  return (
    <McpUseProvider>
      <div className="bg-surface-elevated border border-default rounded-3xl p-6">
        {booking.status === "confirmed" && <ConfirmedState booking={booking} />}
        {booking.status === "pending" && <PendingState booking={booking} />}
        {booking.status === "failed" && <FailedState booking={booking} />}
      </div>
    </McpUseProvider>
  );
};

function ConfirmedState({
  booking,
}: {
  booking: BookingConfirmationProps["booking"];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">
          Appointment Confirmed
        </h2>
      </div>

      <div className="space-y-2 text-sm">
        <DetailRow label="Provider" value={booking.provider_name} />
        <DetailRow label="Location" value={booking.location} />
        <DetailRow label="Date & Time" value={formatDateTime(booking.start_time)} />
        <DetailRow label="Visit Reason" value={booking.visit_reason} />
        {booking.appointment_id && (
          <DetailRow label="Appointment ID" value={booking.appointment_id} />
        )}
      </div>
    </div>
  );
}

function PendingState({
  booking,
}: {
  booking: BookingConfirmationProps["booking"];
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8">
          <svg
            className="w-6 h-6 text-amber-500 dark:text-amber-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400">
          Appointment Pending
        </h2>
      </div>

      <p className="text-sm text-secondary mb-4">
        Your appointment is being processed. This may take a moment.
      </p>

      {booking.provider_name && (
        <div className="space-y-2 text-sm">
          <DetailRow label="Provider" value={booking.provider_name} />
          {booking.location && (
            <DetailRow label="Location" value={booking.location} />
          )}
          <DetailRow label="Date & Time" value={formatDateTime(booking.start_time)} />
        </div>
      )}
    </div>
  );
}

function FailedState({
  booking,
}: {
  booking: BookingConfirmationProps["booking"];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
          Booking Failed
        </h2>
      </div>

      {booking.error_message && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 mb-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            {booking.error_message}
          </p>
        </div>
      )}

      <p className="text-sm text-secondary">
        Please check availability again and try a different time slot.
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-secondary">{label}</span>
      <span className="text-default font-medium">{value}</span>
    </div>
  );
}

export default BookingConfirmation;
