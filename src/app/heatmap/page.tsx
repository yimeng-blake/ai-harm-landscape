"use client";
import { useEffect, useState } from "react";
import PlotlyChart from "../../components/PlotlyChart";
import { fetchJSON, HeatmapRow } from "../../lib/data";

export default function HeatmapPage() {
  const [data, setData] = useState<HeatmapRow[]>([]);
  const [minCount, setMinCount] = useState(2);

  useEffect(() => {
    fetchJSON<HeatmapRow[]>("/data/heatmap.json").then(setData);
  }, []);

  if (!data.length) return <div className="text-gray-400">Loading...</div>;

  const cols = Object.keys(data[0]);
  const rowCol = cols[0]; // e.g. risk_category
  const colCol = cols[1]; // e.g. Known AI Technology
  const valCol = cols[2]; // count

  const filtered = data.filter((r) => (r[valCol] as number) >= minCount);

  // Build pivot matrix
  const rows = [...new Set(filtered.map((r) => r[rowCol] as string))];
  const columns = [...new Set(filtered.map((r) => r[colCol] as string))];

  // Sort by total
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  filtered.forEach((r) => {
    rowTotals[r[rowCol] as string] = (rowTotals[r[rowCol] as string] || 0) + (r[valCol] as number);
    colTotals[r[colCol] as string] = (colTotals[r[colCol] as string] || 0) + (r[valCol] as number);
  });
  rows.sort((a, b) => (rowTotals[b] || 0) - (rowTotals[a] || 0));
  columns.sort((a, b) => (colTotals[b] || 0) - (colTotals[a] || 0));

  // Build z matrix
  const lookup: Record<string, number> = {};
  filtered.forEach((r) => { lookup[`${r[rowCol]}__${r[colCol]}`] = r[valCol] as number; });
  const z = rows.map((row) => columns.map((col) => lookup[`${row}__${col}`] || 0));

  // Truncate labels
  const truncate = (s: string, n = 30) => s.length > n ? s.slice(0, n) + "…" : s;

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">🗂️ Harm Matrix</h1>
      <p className="text-gray-400 mb-6">
        Which risk categories intersect with which AI technologies? Darker cells = more incidents.
      </p>

      <label className="text-sm text-gray-400 mb-4 block">
        Min. incidents per cell:
        <input type="range" min={1} max={8} value={minCount}
          onChange={(e) => setMinCount(+e.target.value)} className="ml-2 w-32 align-middle" />
        <span className="ml-2 text-white">{minCount}</span>
      </label>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <PlotlyChart
          data={[{
            z, x: columns.map((c) => truncate(c)), y: rows.map((r) => truncate(r)),
            type: "heatmap", colorscale: "YlOrRd",
            hovertemplate: "<b>%{y}</b> × <b>%{x}</b><br>Incidents: %{z}<extra></extra>",
          }]}
          layout={{
            height: Math.max(350, rows.length * 40),
            margin: { l: 180, r: 20, t: 10, b: 100 },
            xaxis: { tickangle: -40, tickfont: { size: 10, color: "#aaa" } },
            yaxis: { tickfont: { size: 10, color: "#aaa" }, autorange: "reversed" },
            paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#ccc" },
          }}
          config={{ displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Marginals */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">By {rowCol}</h3>
          <PlotlyChart
            data={[{
              x: rows.map((r) => rowTotals[r] || 0),
              y: rows.map((r) => truncate(r)),
              type: "bar", orientation: "h", marker: { color: "#FF6B6B" },
            }]}
            layout={{
              height: Math.max(200, rows.length * 28),
              margin: { l: 160, r: 10, t: 10, b: 20 },
              xaxis: { color: "#888" }, yaxis: { autorange: "reversed", color: "#aaa" },
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#ccc" },
            }}
            config={{ displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">By {colCol}</h3>
          <PlotlyChart
            data={[{
              x: columns.map((c) => colTotals[c] || 0),
              y: columns.map((c) => truncate(c)),
              type: "bar", orientation: "h", marker: { color: "#4ECDC4" },
            }]}
            layout={{
              height: Math.max(200, columns.length * 28),
              margin: { l: 160, r: 10, t: 10, b: 20 },
              xaxis: { color: "#888" }, yaxis: { autorange: "reversed", color: "#aaa" },
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#ccc" },
            }}
            config={{ displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
