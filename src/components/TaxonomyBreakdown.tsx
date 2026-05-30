"use client";
import { useState } from "react";
import PlotlyChart from "./PlotlyChart";
import { Incident } from "../lib/data";
import { DONUT_PALETTE } from "../lib/constants";

interface Props {
  incidents: Incident[];
}

type Tab = "MIT" | "GMF" | "CSET";

function countField(incidents: Incident[], field: keyof Incident, topN = 10): { labels: string[]; values: number[] } {
  const counts: Record<string, number> = {};
  incidents.forEach((inc) => {
    const val = inc[field];
    if (!val || val === "Unclassified") return;
    // Handle comma-separated multi-value fields
    const items = typeof val === "string" ? val.split(",").map((s) => s.trim()) : [String(val)];
    items.forEach((item) => {
      if (item) counts[item] = (counts[item] || 0) + 1;
    });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length <= topN) {
    return { labels: sorted.map(([l]) => l), values: sorted.map(([, v]) => v) };
  }
  const top = sorted.slice(0, topN);
  const otherCount = sorted.slice(topN).reduce((sum, [, v]) => sum + v, 0);
  return {
    labels: [...top.map(([l]) => l), "Other"],
    values: [...top.map(([, v]) => v), otherCount],
  };
}

function cleanDomainName(name: string): string {
  // Remove leading "1. ", "4. " etc prefix from MIT taxonomy
  return name.replace(/^\d+\.\s*/, "");
}

function DonutChart({ labels, values, title, colors, height = 260, onClick }: {
  labels: string[];
  values: number[];
  title: string;
  colors?: string[];
  height?: number;
  onClick?: (label: string) => void;
}) {
  const total = values.reduce((s, v) => s + v, 0);
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-300 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 mb-2">{total} classified</p>
      <PlotlyChart
        data={[{
          labels,
          values,
          type: "pie",
          hole: 0.45,
          marker: { colors: colors || DONUT_PALETTE },
          textinfo: "percent",
          textposition: "inside",
          textfont: { size: 10, color: "#fff" },
          hovertemplate: "<b>%{label}</b><br>%{value} incidents (%{percent})<extra></extra>",
          sort: false,
        }]}
        layout={{
          height,
          margin: { l: 10, r: 10, t: 10, b: 10 },
          showlegend: true,
          legend: { font: { size: 9, color: "#aaa" }, orientation: "v", x: 1.05, y: 0.5 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
        }}
        config={{ displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function MITTab({ incidents }: Props) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // High-level domains
  const domainCounts = countField(incidents, "Risk Domain" as keyof Incident, 7);
  const cleanLabels = domainCounts.labels.map(cleanDomainName);

  // Subdomain drill-down
  let subLabels: string[] = [];
  let subValues: number[] = [];
  if (selectedDomain) {
    const domainIncidents = incidents.filter((i) => i["Risk Domain"]?.includes(selectedDomain));
    const sub = countField(domainIncidents, "Risk Subdomain" as keyof Incident, 6);
    subLabels = sub.labels.map(cleanDomainName);
    subValues = sub.values;
  }

  // Entity and Intent breakdowns
  const entityData = countField(incidents, "Entity" as keyof Incident, 4);
  const intentData = countField(incidents, "Intent" as keyof Incident, 4);

  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        {/* Main domain donut */}
        <div>
          <DonutChart labels={cleanLabels} values={domainCounts.values} title="Risk Domains (High-Level)" height={300} />
          <div className="mt-2 flex flex-wrap gap-1">
            {domainCounts.labels.map((label, i) => (
              <button key={label}
                onClick={() => setSelectedDomain(selectedDomain === label ? null : label)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  selectedDomain === label
                    ? "border-white bg-gray-700 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}>
                {cleanLabels[i]}
              </button>
            ))}
          </div>
        </div>

        {/* Subdomain drill-down */}
        <div>
          {selectedDomain ? (
            <DonutChart labels={subLabels} values={subValues}
              title={`Subdomains: ${cleanDomainName(selectedDomain)}`} height={300} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Click a domain above to drill into subdomains
            </div>
          )}
        </div>
      </div>

      {/* Small supplementary donuts */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <DonutChart labels={entityData.labels} values={entityData.values}
          title="Causal Entity" colors={["#45B7D1", "#FF8C94", "#FFEAA7", "#999"]} height={220} />
        <DonutChart labels={intentData.labels} values={intentData.values}
          title="Intent" colors={["#82E0AA", "#FF6B6B", "#FFEAA7", "#999"]} height={220} />
      </div>
    </div>
  );
}

function GMFTab({ incidents }: Props) {
  const goalData = countField(incidents, "Known AI Goal" as keyof Incident, 10);
  const failureData = countField(incidents, "Known AI Technical Failure" as keyof Incident, 8);
  const coverage = incidents.filter((i) => i["Known AI Goal"]).length;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        GMF taxonomy coverage: {coverage} of {incidents.length} incidents classified
      </p>
      <div className="grid grid-cols-2 gap-6">
        <DonutChart labels={goalData.labels} values={goalData.values} title="AI Goal (Purpose)" height={300} />
        <DonutChart labels={failureData.labels} values={failureData.values} title="Technical Failure Mode" height={300} />
      </div>
    </div>
  );
}

function CSETTab({ incidents }: Props) {
  const sectorData = countField(incidents, "Sector of Deployment" as keyof Incident, 8);
  const autonomyData = countField(incidents, "Autonomy Level" as keyof Incident, 5);
  const coverage = incidents.filter((i) => i["Sector of Deployment"]).length;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        CSET taxonomy coverage: {coverage} of {incidents.length} incidents classified
      </p>
      <div className="grid grid-cols-2 gap-6">
        <DonutChart labels={sectorData.labels} values={sectorData.values} title="Sector of Deployment" height={300} />
        <DonutChart labels={autonomyData.labels} values={autonomyData.values}
          title="Autonomy Level" colors={["#4ECDC4", "#FFEAA7", "#FF6B6B", "#999", "#666"]} height={300} />
      </div>
    </div>
  );
}

export default function TaxonomyBreakdown({ incidents }: Props) {
  const [tab, setTab] = useState<Tab>("MIT");

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Taxonomy Breakdown</h3>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(["MIT", "GMF", "CSET"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === t ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {tab === "MIT" && "MIT AI Risk Repository — 7 high-level risk domains with sub-categories. Click a domain to drill down."}
        {tab === "GMF" && "Goals, Methods, and Failures taxonomy — classifies the AI's purpose and what went wrong technically."}
        {tab === "CSET" && "Georgetown CSET taxonomy — sector of deployment and system autonomy level."}
      </p>

      {tab === "MIT" && <MITTab incidents={incidents} />}
      {tab === "GMF" && <GMFTab incidents={incidents} />}
      {tab === "CSET" && <CSETTab incidents={incidents} />}
    </div>
  );
}
