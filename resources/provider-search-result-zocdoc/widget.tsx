import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import "../styles.css";
import { ProviderCard } from "./components/ProviderCard";
import type { ProviderSearchResultProps } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Display healthcare provider search results from ZocDoc",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Searching for providers...",
    invoked: "Provider results loaded",
  },
};

const ProviderSearchResult: React.FC = () => {
  const { props, isPending } = useWidget<ProviderSearchResultProps>();

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="bg-surface-elevated border border-default rounded-3xl p-6">
          <div className="mb-4">
            <div className="h-4 w-40 rounded-md bg-default/10 animate-pulse mb-2" />
            <div className="h-6 w-64 rounded-md bg-default/10 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-default bg-surface p-4 flex flex-col gap-2"
              >
                <div className="h-4 w-32 rounded bg-default/10 animate-pulse" />
                <div className="h-3 w-24 rounded bg-default/10 animate-pulse" />
                <div className="h-3 w-20 rounded bg-default/10 animate-pulse mt-auto" />
              </div>
            ))}
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const { providers, query, totalCount, patientInsurance } = props;

  return (
    <McpUseProvider>
      <div className="bg-surface-elevated border border-default rounded-3xl p-6">
        <div className="mb-4">
          <p className="text-sm text-secondary mb-1">{query}</p>
          <h2 className="text-lg font-semibold text-default">
            Showing {totalCount} provider{totalCount !== 1 ? "s" : ""}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {providers.map((provider, index) => (
            <ProviderCard key={index} provider={provider} patientInsurance={patientInsurance} />
          ))}
        </div>
      </div>
    </McpUseProvider>
  );
};

export default ProviderSearchResult;
