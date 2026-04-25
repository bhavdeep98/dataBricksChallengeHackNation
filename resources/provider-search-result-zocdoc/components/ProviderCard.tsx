import React from "react";
import type { ProviderItem } from "../types";

interface ProviderCardProps {
  provider: ProviderItem;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const name = provider.provider_name ?? provider.name ?? "Unknown Provider";

  // Resolve specialty from either shape
  const specialty =
    provider.specialty ??
    provider.specialties?.map((s) => s.name).join(", ") ??
    null;

  // Resolve city/state from either shape
  const address =
    provider.address ?? provider.affiliated_locations?.[0]?.address;
  const location = address ? `${address.city}, ${address.state}` : null;

  const distance = provider.distance_mi;

  return (
    <div className="rounded-2xl border border-default bg-surface p-4 flex flex-col gap-2">
      <h3 className="font-semibold text-base text-default truncate">{name}</h3>
      {specialty && (
        <p className="text-sm text-secondary truncate">{specialty}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-secondary mt-auto">
        {location && <span>{location}</span>}
        {distance != null && (
          <>
            {location && <span className="text-default/20">•</span>}
            <span>{distance.toFixed(1)} mi</span>
          </>
        )}
      </div>
    </div>
  );
};
