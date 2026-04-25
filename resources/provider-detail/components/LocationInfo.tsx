import React from "react";
import type { AffiliatedLocationItem } from "../types";

interface LocationInfoProps {
  location: AffiliatedLocationItem;
}

export const LocationInfo: React.FC<LocationInfoProps> = ({ location }) => {
  const { address, phone_number } = location;
  const fullAddress = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.zip_code}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl border border-default bg-surface p-3 flex flex-col gap-1">
      <h4 className="font-medium text-sm text-default">{location.name}</h4>
      <p className="text-xs text-secondary">{fullAddress}</p>
      {phone_number && (
        <p className="text-xs text-info">{phone_number}</p>
      )}
    </div>
  );
};
