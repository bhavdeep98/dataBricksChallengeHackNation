import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import "../styles.css";
import { LocationInfo } from "./components/LocationInfo";
import { VisitReasonList } from "./components/VisitReasonList";
import type { ProviderDetailProps } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Display detailed information about a healthcare provider from ZocDoc",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading provider details...",
    invoked: "Provider details loaded",
  },
};

const ProviderDetail: React.FC = () => {
  const { props, isPending } = useWidget<ProviderDetailProps>();

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="bg-surface-elevated border border-default rounded-3xl p-6">
          <div className="h-6 w-48 rounded-md bg-default/10 animate-pulse mb-3" />
          <div className="h-4 w-36 rounded-md bg-default/10 animate-pulse mb-2" />
          <div className="h-4 w-28 rounded-md bg-default/10 animate-pulse mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-default bg-surface p-3"
              >
                <div className="h-3 w-32 rounded bg-default/10 animate-pulse mb-1" />
                <div className="h-3 w-48 rounded bg-default/10 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const { provider: detail } = props;
  const { provider } = detail;

  const specialties = provider.specialties.map((s) => s.name).join(", ");
  const languages = provider.spoken_languages.join(", ");

  return (
    <McpUseProvider>
      <div className="bg-surface-elevated border border-default rounded-3xl p-6">
        {/* Provider name */}
        <h2 className="text-xl font-semibold text-default mb-1">
          {provider.name}
        </h2>

        {/* Specialties */}
        {specialties && (
          <p className="text-sm text-secondary mb-1">{specialties}</p>
        )}

        {/* Languages & Gender identity */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-secondary mb-4">
          {languages && <span>Speaks: {languages}</span>}
          {languages && provider.gender_identity && (
            <span className="text-default/20">•</span>
          )}
          {provider.gender_identity && (
            <span>{provider.gender_identity}</span>
          )}
        </div>

        {/* Affiliated Locations */}
        {provider.affiliated_locations.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-default mb-2">
              Locations
            </h3>
            <div className="space-y-2">
              {provider.affiliated_locations.map((loc) => (
                <LocationInfo key={loc.id} location={loc} />
              ))}
            </div>
          </div>
        )}

        {/* Visit Reasons */}
        {detail.visit_reasons.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-default mb-2">
              Visit Reasons
            </h3>
            <VisitReasonList visitReasons={detail.visit_reasons} />
          </div>
        )}
      </div>
    </McpUseProvider>
  );
};

export default ProviderDetail;
