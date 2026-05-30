"use client";
import { useEffect, useState } from "react";
import PlotlyChart from "../../components/PlotlyChart";
import { fetchJSON, NetworkData, Incident } from "../../lib/data";

const COLORS = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE","#85C1E9"];

export default function NetworkPage() {
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [minIncidents, setMinIncidents] = useState(10);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  useEffect(() => {
    fetchJSON<NetworkData>("/data/network.json").then(setNetwork);
    fetchJSON<Incident[]>("/data/incidents.json").then(setIncidents);
  }, []);

  if (!network) return <div className="text-gray-400">Loading...</div>;

  // Filter
  const nodes = network.nodes.filter((n) => n.count >= minIncidents);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = network.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  const lookup = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // Edge traces
  const edgeX: (number | null)[] = [];
  const edgeY: (number | null)[] = [];
  edges.forEach((e) => {
    const s = lookup[e.source], t = lookup[e.target];
    if (s && t) { edgeX.push(s.x, t.x, null); edgeY.push(s.y, t.y, null); }
  });

  const labelThreshold = Math.max(minIncidents + 5, 15);

  // Entity incidents
  const entityIncidents = selectedEntity
    ? incidents.filter((i) => i.deployers.includes(selectedEntity) || i.developers.includes(selectedEntity))
    : [];

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">🔗 Entity Network</h1>
      <p className="text-gray-400 mb-6">
        Organizations connected by co-occurrence in AI incidents. Node size = incident count.
      </p>

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-gray-400">
          Min. incidents:
          <input type="range" min={3} max={40} value={minIncidents}
            onChange={(e) => setMinIncidents(+e.target.value)}
            className="ml-2 w-40 align-middle" />
          <span className="ml-2 text-white">{minIncidents}</span>
        </label>
        <span className="text-xs text-gray-500">{nodes.length} entities · {edges.length} connections</span>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <PlotlyChart
          data={[
            {
              x: edgeX, y: edgeY, type: "scatter", mode: "lines",
              line: { width: 0.4, color: "rgba(150,150,150,0.2)" }, hoverinfo: "none",
            },
            {
              x: nodes.map((n) => n.x),
              y: nodes.map((n) => n.y),
              text: nodes.map((n) => n.count >= labelThreshold ? n.id : ""),
              customdata: nodes.map((n) => [n.id, n.count, n.roles.join(", ")]),
              type: "scatter", mode: "markers+text",
              textposition: "top center",
              textfont: { size: 9, color: "rgba(255,255,255,0.8)" },
              hovertemplate: "<b>%{customdata[0]}</b><br>Incidents: %{customdata[1]}<br>Roles: %{customdata[2]}<extra></extra>",
              marker: {
                size: nodes.map((n) => Math.max(8, Math.min(50, n.count * 1.5))),
                color: nodes.map((n) => COLORS[n.community % COLORS.length]),
                line: { width: 0.6, color: "rgba(255,255,255,0.2)" },
              },
            },
          ]}
          layout={{
            height: 580,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            showlegend: false, hovermode: "closest",
            xaxis: { showgrid: false, zeroline: false, showticklabels: false },
            yaxis: { showgrid: false, zeroline: false, showticklabels: false },
            paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
          }}
          config={{ displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Entity lookup */}
      <div className="grid grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Top Entities</h3>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {nodes.sort((a, b) => b.count - a.count).slice(0, 20).map((n) => (
              <button key={n.id} onClick={() => setSelectedEntity(n.id)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded ${
                  selectedEntity === n.id ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800"
                }`}>
                {n.id} <span className="text-gray-600">({n.count})</span>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          {selectedEntity && (
            <>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Incidents involving <span className="text-white">{selectedEntity}</span> ({entityIncidents.length})
              </h3>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {entityIncidents.sort((a, b) => b.year - a.year).slice(0, 15).map((inc) => (
                  <div key={inc.incident_id} className="text-sm border-b border-gray-800 pb-2">
                    <div className="text-white">{inc.title}</div>
                    <div className="text-xs text-gray-500">{inc.date} · {inc.risk_category}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {!selectedEntity && <p className="text-sm text-gray-500">Select an entity from the list to see its incidents.</p>}
        </div>
      </div>
    </div>
  );
}
