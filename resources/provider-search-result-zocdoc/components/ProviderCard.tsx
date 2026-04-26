import React from "react";
import type { ProviderItem } from "../types";

interface ProviderCardProps {
  provider: ProviderItem;
  patientInsurance?: string;
}

const callStatusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Pending", color: "text-secondary", icon: "⏳" },
  calling: { label: "Calling...", color: "text-blue-500", icon: "📞" },
  confirmed: { label: "Confirmed!", color: "text-green-600", icon: "✅" },
  failed: { label: "No answer", color: "text-red-500", icon: "❌" },
  skipped: { label: "Skipped", color: "text-secondary", icon: "⏭️" },
};

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, patientInsurance }) => {
  const name = provider.provider_name ?? provider.name ?? "Unknown Provider";

  const specialty =
    provider.specialty ??
    provider.specialties?.map((s) => s.name).join(", ") ??
    null;

  const address =
    provider.address ?? provider.affiliated_locations?.[0]?.address;
  const location = address ? `${address.city}, ${address.state}` : null;
  const locationName = provider.location_name;

  const distance = provider.distance_mi;
  const rating = provider.rating;
  const reviewsCount = provider.reviews_count;
  const callStatus = provider.call_status;

  // Check insurance match
  const insuranceMatch =
    patientInsurance && provider.insurance_accepted
      ? provider.insurance_accepted.some(
          (ins) => ins.toLowerCase().includes(patientInsurance.toLowerCase())
        )
      : null;

  const statusInfo = callStatus ? callStatusConfig[callStatus] : null;

  return (
    <div className={`rounded-2xl border bg-surface p-4 flex flex-col gap-2 ${
      callStatus === "confirmed"
        ? "border-green-400 ring-1 ring-green-200"
        : callStatus === "calling"
        ? "border-blue-400 ring-1 ring-blue-200"
        : "border-default"
    }`}>
      {/* Header: name + call status */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base text-default truncate">{name}</h3>
        {statusInfo && (
          <span className={`text-xs font-medium whitespace-nowrap ${statusInfo.color}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        )}
      </div>

      {/* Specialty */}
      {specialty && (
        <p className="text-sm text-secondary truncate">{specialty}</p>
      )}

      {/* Location name */}
      {locationName && (
        <p className="text-xs text-secondary truncate">{locationName}</p>
      )}

      {/* Rating */}
      {rating != null && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-default">
            {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
          </span>
          <span className="text-xs text-secondary">
            {rating.toFixed(1)}
            {reviewsCount != null && ` (${reviewsCount} reviews)`}
          </span>
        </div>
      )}

      {/* Bottom row: location, distance, insurance */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-secondary mt-auto">
        {location && <span>{location}</span>}
        {distance != null && (
          <>
            {location && <span className="text-default/20">•</span>}
            <span>{distance.toFixed(1)} mi</span>
          </>
        )}
        {insuranceMatch != null && (
          <>
            <span className="text-default/20">•</span>
            <span className={insuranceMatch ? "text-green-600 font-medium" : "text-red-500"}>
              {insuranceMatch ? "✓ In-network" : "✗ Out-of-network"}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
