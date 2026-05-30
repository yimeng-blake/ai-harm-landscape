"use client";
import { useEffect, useState } from "react";
import PlotlyChart from "../../components/PlotlyChart";
import { fetchJSON, TimelineRow, Incident } from "../../lib/data";
import { CATEGORY_COLORS } from "../../lib/constants";

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([2012, 2026]);
  const [showUnclassified, setShowUnclassified] = useState(false);

  useEffect(() => {
    fetchJSON<TimelineRow[]>("/data/timeline.json").then(setTimeline);
    fetchJSON<Incident[]>("/data/incidents.json").then(setIncidents);
  }, []);

  if (!timeline.length) return <div className="text-gray-400">Loading...</div>;

  // Filter
  const categories = [...new Set(timeline.map((r) => r.risk_category))].filter(
    (c) => showUnclassified || c !== "Unclassified"
  );
  const filtered = timeline.filter(
    (r) => r.year >= yearRange[0] && r.year <= yearRange[1] && categories.includes(r.risk_category)
  );

  // Build traces for stacked area
  const traces = categories.map((cat) => {
    const catData = filtered.filter((r) => r.risk_category === cat);
    const years = [...new Set(filtered.map((r) => r.year))].sort();
    const countByYear: Record<number, number> = {};
    catData.forEach((r) => { countByYear[r.year] = r.count; });
    return {
      x: years,
      y: years.map((y) => countByYear[y] || 0),
      type: "scatter" as const,
      mode: "lines" as const,
      name: cat,
      stackgroup: "one",
      line: { width: 0.5 },
      fillcolor: (CATEGORY_COLORS[cat] || "#666") + "AA",
      marker: { color: CATEGORY_COLORS[cat] || "#666" },
    };
  });

  // Annual totals bar
  const annualTotals: Record<number, number> = {};
  filtered.forEach((r) => { annualTotals[r.year] = (annualTotals[r.year] || 0) + r.count; });
  const barYears = Object.keys(annualTotals).map(Number).sort();
  const barCounts = barYears.map((y) => annualTotals[y]);

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">📈 AI Incidents Timeline</h1>
      <p className="text-gray-400 mb-6">
        Incident volume over time by MIT AI Risk Taxonomy category. Notice the exponential growth after 2022.
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
            margin: { l: 50, r: 20, t: 20, b: 40 },
            xaxis: { title: "Year", showgrid: false, color: "#888" },
            yaxis: { title: "Incidents", showgrid: true, gridcolor: "#1f2937", color: "#888" },
            hovermode: "x unified",
            legend: { orientation: "h", y: -0.25, x: 0.5, xanchor: "center", font: { size: 10, color: "#aaa" } },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#ccc" },
            annotations: [
              { x: 2018, y: 0, text: "First AV fatality", showarrow: true, arrowhead: 2, ax: 0, ay: -50, font: { size: 10, color: "#fff" } },
              { x: 2022.9, y: 0, text: "ChatGPT launch", showarrow: true, arrowhead: 2, ax: 0, ay: -70, font: { size: 10, color: "#fff" } },
            ],
          }}
          config={{ displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Bar chart */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Annual Totals</h3>
        <PlotlyChart
          data={[{ x: barYears, y: barCounts, type: "bar", marker: { color: "#FF6B6B" } }]}
          layout={{
            height: 220,
            margin: { l: 40, r: 10, t: 10, b: 30 },
            xaxis: { showgrid: false, color: "#888" },
            yaxis: { showgrid: false, color: "#888" },
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
