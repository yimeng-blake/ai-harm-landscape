"use client";
import { useEffect, useState, useMemo } from "react";
import PlotlyChart from "../../components/PlotlyChart";
import TaxonomyBreakdown, { TaxonomyTab } from "../../components/TaxonomyBreakdown";
import WordCloud, { extractWords } from "../../components/WordCloud";
import { fetchJSON, TimelineRow, Incident } from "../../lib/data";
import { CATEGORY_COLORS, DONUT_PALETTE, HOVERLABEL } from "../../lib/constants";

// Map taxonomy tab to the field used for grouping
const TAXONOMY_FIELD: Record<TaxonomyTab, keyof Incident> = {
  MIT: "Risk Domain",
  GMF: "Known AI Goal",
  CSET: "Sector of Deployment",
};

const TAXONOMY_LABEL: Record<TaxonomyTab, string> = {
  MIT: "MIT AI Risk Taxonomy",
  GMF: "GMF AI Goal",
  CSET: "CSET Sector of Deployment",
};

function cleanLabel(label: string): string {
  // Strip "1. ", "4. " prefixes from MIT taxonomy
  return label.replace(/^\d+\.\s*/, "");
}

export default function TimelinePage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([2012, 2026]);
  const [showUnclassified, setShowUnclassified] = useState(false);
  const [taxonomyTab, setTaxonomyTab] = useState<TaxonomyTab>("MIT");

  useEffect(() => {
    fetchJSON<Incident[]>("/data/incidents.json").then(setIncidents);
  }, []);

  // Compute timeline data from incidents based on selected taxonomy
  const { traces, barYears, barCounts, areaLabels, yMax } = useMemo(() => {
    if (!incidents.length) return { traces: [], barYears: [], barCounts: [], areaLabels: [], yMax: 0 };

    const field = TAXONOMY_FIELD[taxonomyTab];
    const filteredIncidents = incidents.filter(
      (i) => i.year >= yearRange[0] && i.year <= yearRange[1]
    );

    // Build sorted list of year-month keys ("YYYY-MM") present in the data
    const monthSet = new Set<string>();
    filteredIncidents.forEach((i) => {
      monthSet.add(`${i.year}-${String(i.month).padStart(2, "0")}`);
    });
    const months = [...monthSet].sort();

    // Group by month + category
    const grouped: Record<string, Record<string, number>> = {};
    filteredIncidents.forEach((inc) => {
      let rawVal = inc[field] as string | null;
      if (!rawVal) rawVal = "Unclassified";
      const val = rawVal.split(",")[0].trim();
      const label = cleanLabel(val);
      if (!showUnclassified && label === "Unclassified") return;
      if (!grouped[label]) grouped[label] = {};
      const monthKey = `${inc.year}-${String(inc.month).padStart(2, "0")}`;
      grouped[label][monthKey] = (grouped[label][monthKey] || 0) + 1;
    });

    // Sort categories by total count
    const catEntries = Object.entries(grouped)
      .map(([cat, monthMap]) => ({ cat, total: Object.values(monthMap).reduce((s, v) => s + v, 0), monthMap }))
      .sort((a, b) => b.total - a.total);

    // Limit to top 10 categories for readability
    const topCats = catEntries.slice(0, 10);

    // Convert month keys to Date objects for Plotly (first of each month)
    const xDates = months.map((m) => `${m}-01`);

    const traces = topCats.map((entry, i) => ({
      x: xDates,
      y: months.map((m) => entry.monthMap[m] || 0),
      type: "scatter" as const,
      mode: "lines" as const,
      name: entry.cat,
      stackgroup: "one",
      line: { width: 0.5, shape: "spline" as const, smoothing: 1.3 },
      fillcolor: (CATEGORY_COLORS[entry.cat] || DONUT_PALETTE[i % DONUT_PALETTE.length]) + "AA",
      marker: { color: CATEGORY_COLORS[entry.cat] || DONUT_PALETTE[i % DONUT_PALETTE.length] },
    }));

    // Annual totals (for the bar chart)
    const annualTotals: Record<number, number> = {};
    filteredIncidents.forEach((i) => {
      if (!showUnclassified && !i[field]) return;
      annualTotals[i.year] = (annualTotals[i.year] || 0) + 1;
    });
    const barYears = Object.keys(annualTotals).map(Number).sort();
    const barCounts = barYears.map((y) => annualTotals[y]);

    // Direct band labels: place at the month where each category's band is thickest
    const areaLabels = topCats.map((entry, i) => {
      let peakMonth = months[0];
      let peakV = -1;
      months.forEach((m) => { const v = entry.monthMap[m] || 0; if (v > peakV) { peakV = v; peakMonth = m; } });
      if (peakV <= 0) return null;
      const below = topCats.slice(0, i).reduce((s, e) => s + (e.monthMap[peakMonth] || 0), 0);
      const mid = below + peakV / 2;
      return {
        x: `${peakMonth}-01`, y: mid, xanchor: "center" as const, yanchor: "middle" as const,
        text: entry.cat,
        showarrow: false,
        font: { size: 9, color: CATEGORY_COLORS[entry.cat] || DONUT_PALETTE[i % DONUT_PALETTE.length] },
        bgcolor: "rgba(15,23,42,0.7)", borderpad: 2,
      };
    }).filter((a): a is NonNullable<typeof a> => a !== null);

    // y-axis ceiling: tallest stacked total across months
    const yMax = months.reduce((mx, m) => {
      const total = topCats.reduce((s, e) => s + (e.monthMap[m] || 0), 0);
      return Math.max(mx, total);
    }, 0);

    return { traces, barYears, barCounts, areaLabels, yMax };
  }, [incidents, yearRange, showUnclassified, taxonomyTab]);

  if (!incidents.length) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="max-w-6xl">
      <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1">📈 AI Incidents Timeline</p>
      <h1 className="text-3xl font-bold mb-2">AI incident reports have exploded since 2022</h1>
      <p className="text-gray-400 mb-6">
        Incident volume over time grouped by <strong className="text-white">{TAXONOMY_LABEL[taxonomyTab]}</strong>.
        Switch taxonomy below to change the grouping.
      </p>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        <label className="text-sm text-gray-400">
          From: <input type="number" value={yearRange[0]} min={1990} max={2026}
            onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
            className="ml-1 w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
        </label>
        <label className="text-sm text-gray-400">
          To: <input type="number" value={yearRange[1]} min={1990} max={2026}
            onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
            className="ml-1 w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
        </label>
        <label className="text-sm text-gray-400 flex items-center gap-2">
          <input type="checkbox" checked={showUnclassified}
            onChange={(e) => setShowUnclassified(e.target.checked)}
            className="rounded" />
          Include Unclassified
        </label>
      </div>

      {/* Stacked Area */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <PlotlyChart
          data={traces}
          layout={{
            height: 420,
            margin: { l: 50, r: 150, t: 20, b: 40 },
            xaxis: { title: "Month", showgrid: false, color: "#888", type: "date" as const },
            yaxis: {
              title: "Incidents", showgrid: true, gridcolor: "#1f2937", color: "#888",
              range: [0, Math.ceil((yMax || 0) / 10) * 10 + 10],
            },
            hovermode: "x unified",
            hoverlabel: HOVERLABEL,
            showlegend: false,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#ccc" },
            annotations: [
              ...areaLabels,
              { x: "2018-03-01", y: 0, text: "First AV fatality", showarrow: true, arrowhead: 2, ax: 0, ay: -50, font: { size: 10, color: "#fff" } },
              { x: "2022-11-01", y: 0, text: "ChatGPT launch", showarrow: true, arrowhead: 2, ax: 0, ay: -70, font: { size: 10, color: "#fff" } },
            ],
          }}
          config={{ displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Taxonomy Breakdown Donuts - drives the timeline grouping */}
      {incidents.length > 0 && (
        <div className="mb-6">
          <TaxonomyBreakdown
            incidents={incidents.filter((i) => i.year >= yearRange[0] && i.year <= yearRange[1])}
            activeTab={taxonomyTab}
            onTabChange={setTaxonomyTab}
          />
        </div>
      )}

      {/* Period Word Cloud */}
      {incidents.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <WordCloud
            title={`Dominant Terms (${yearRange[0]}–${yearRange[1]})`}
            words={extractWords(
              incidents
                .filter((i) => i.year >= yearRange[0] && i.year <= yearRange[1])
                .map((i) => `${i.title} ${i.description}`),
              45
            )}
            height={280}
          />
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Annual Totals</h3>
        <PlotlyChart
          data={[{ x: barYears, y: barCounts, type: "bar", marker: { color: "#888888" },
            hovertemplate: "%{x}: %{y} incidents<extra></extra>" }]}
          layout={{
            height: 220,
            margin: { l: 40, r: 10, t: 10, b: 30 },
            xaxis: { showgrid: false, color: "#888" },
            yaxis: { showgrid: false, color: "#888" },
            hoverlabel: HOVERLABEL,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#ccc" },
          }}
          config={{ displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
