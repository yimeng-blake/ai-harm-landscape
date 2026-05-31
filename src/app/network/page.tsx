"use client";
import { useEffect, useState, useMemo } from "react";
import PlotlyChart from "../../components/PlotlyChart";
import { fetchJSON, NetworkData, Incident } from "../../lib/data";
import { COMMUNITY_COLORS } from "../../lib/constants";

export default function NetworkPage() {
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [minIncidents, setMinIncidents] = useState(10);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [harmFilter, setHarmFilter] = useState<string>("All");

  useEffect(() => {
    fetchJSON<NetworkData>("/data/network.json").then(setNetwork);
    fetchJSON<Incident[]>("/data/incidents.json").then(setIncidents);
  }, []);

  // Compute entity -> risk_category mapping for filtering
  const entityCategories = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    incidents.forEach((inc) => {
      const cat = inc.risk_category;
      if (!cat || cat === "Unclassified") return;
      [...inc.deployers, ...inc.developers].forEach((e) => {
        if (!map[e]) map[e] = new Set();
        map[e].add(cat);
      });
    });
    return map;
  }, [incidents]);

  // Available harm categories
  const riskCategories = useMemo(() => {
    const cats = new Set<string>();
    incidents.forEach((i) => {
      if (i.risk_category && i.risk_category !== "Unclassified") cats.add(i.risk_category);
    });
    return ["All", ...Array.from(cats).sort()];
  }, [incidents]);

  // Filter nodes by min incidents + harm category
  const filteredNodes = useMemo(() => {
    if (!network) return [];

    return network.nodes.filter((n) => {
      if (n.count < minIncidents) return false;
      if (harmFilter !== "All") {
        const cats = entityCategories[n.id];
        if (!cats || !cats.has(harmFilter)) return false;
      }
      return true;
    });
  }, [entityCategories, harmFilter, minIncidents, network]);

  const filteredEdges = useMemo(() => {
    if (!network) return [];

    const filteredIds = new Set(filteredNodes.map((n) => n.id));
    return network.edges.filter(
      (e) => filteredIds.has(e.source) && filteredIds.has(e.target)
    );
  }, [filteredNodes, network]);

  // Highlight logic: when an entity is selected, find its neighbors
  const neighbors = useMemo(() => {
    if (!selectedEntity) return null;
    const set = new Set<string>([selectedEntity]);
    filteredEdges.forEach((e) => {
      if (e.source === selectedEntity) set.add(e.target);
      if (e.target === selectedEntity) set.add(e.source);
    });
    return set;
  }, [selectedEntity, filteredEdges]);

  if (!network) return <div className="text-gray-400">Loading...</div>;

  // Build graph traces
  const lookup = Object.fromEntries(filteredNodes.map((n) => [n.id, n]));

  // Edge trace - highlight connected edges
  const edgeX: (number | null)[] = [];
  const edgeY: (number | null)[] = [];
  const highlightEdgeX: (number | null)[] = [];
  const highlightEdgeY: (number | null)[] = [];

  filteredEdges.forEach((e) => {
    const s = lookup[e.source], t = lookup[e.target];
    if (!s || !t) return;
    if (neighbors && (neighbors.has(e.source) && neighbors.has(e.target))) {
      highlightEdgeX.push(s.x, t.x, null);
      highlightEdgeY.push(s.y, t.y, null);
    } else {
      edgeX.push(s.x, t.x, null);
      edgeY.push(s.y, t.y, null);
    }
  });

  // Node opacity based on selection
  const nodeOpacity = filteredNodes.map((n) => {
    if (!neighbors) return 0.85;
    return neighbors.has(n.id) ? 1.0 : 0.12;
  });
  const nodeColors = filteredNodes.map((n) =>
    COMMUNITY_COLORS[n.community] ?? "#555555"
  );
  const nodeSizes = filteredNodes.map((n) => Math.max(8, Math.min(50, n.count * 1.2)));
  const labelThreshold = Math.max(minIncidents + 3, 8);

  // Community legend (only show communities present in filtered nodes)
  const visibleCommunities = [...new Set(filteredNodes.map((n) => n.community))].filter((c) => c !== -1).sort();
  const communityLabelMap: Record<number, string> = {};
  filteredNodes.forEach((n) => {
    if (n.community >= 0 && !communityLabelMap[n.community]) {
      communityLabelMap[n.community] = n.community_label;
    }
  });

  // Summary stats
  const topDeployers = filteredNodes
    .filter((n) => n.primary_role === "deployer" || n.primary_role === "mixed")
    .sort((a, b) => b.count - a.count).slice(0, 8);
  const topHarmed = filteredNodes
    .filter((n) => n.primary_role === "harmed")
    .sort((a, b) => b.count - a.count).slice(0, 8);

  // Entity incidents for detail panel
  const entityIncidents = selectedEntity
    ? incidents.filter((i) => i.deployers.includes(selectedEntity) || i.developers.includes(selectedEntity))
    : [];
  const selectableNodes = [...filteredNodes].sort((a, b) => b.count - a.count).slice(0, 25);

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-bold mb-2">🔗 Entity Network</h1>
      <p className="text-gray-400 mb-4">
        Which organizations keep appearing in AI incidents? This graph connects entities by
        <strong className="text-white"> co-occurrence</strong> — if two companies appear in the same incident, they share an edge.
        <span className="text-gray-500"> Deployers/developers cluster left, harmed parties cluster right.</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-4 flex-wrap">
        <label className="text-sm text-gray-400">
          Min. incidents:
          <input type="range" min={3} max={30} value={minIncidents}
            onChange={(e) => { setMinIncidents(+e.target.value); setSelectedEntity(null); }}
            className="ml-2 w-32 align-middle" />
          <span className="ml-2 text-white font-medium">{minIncidents}</span>
        </label>
        <label className="text-sm text-gray-400">
          Filter by harm type:
          <select value={harmFilter} onChange={(e) => { setHarmFilter(e.target.value); setSelectedEntity(null); }}
            className="ml-2 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            {riskCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>
        <span className="text-xs text-gray-500">
          {filteredNodes.length} entities · {filteredEdges.length} connections
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        The <strong className="text-gray-300">min. incidents</strong> slider controls how many times an entity must appear in the database to be shown.
        Raise it to focus on major repeat actors; lower it to reveal smaller organizations.
      </p>

      {/* Community Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {visibleCommunities.map((comm) => (
          <div key={comm} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COMMUNITY_COLORS[comm] || "#555" }} />
            {communityLabelMap[comm] || `Cluster ${comm}`}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#555" }} />
          Other
        </div>
      </div>

      {/* Main Graph */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <PlotlyChart
          data={[
            // Dim edges
            { x: edgeX, y: edgeY, type: "scatter", mode: "lines",
              line: { width: 0.3, color: neighbors ? "rgba(100,100,100,0.08)" : "rgba(150,150,150,0.2)" },
              hoverinfo: "none" },
            // Highlight edges (always present, empty when no selection)
            { x: highlightEdgeX.length > 0 ? highlightEdgeX : [null],
              y: highlightEdgeY.length > 0 ? highlightEdgeY : [null],
              type: "scatter", mode: "lines",
              line: { width: 1.5, color: "rgba(255,255,255,0.5)" },
              hoverinfo: "none" },
            // Nodes
            { x: filteredNodes.map((n) => n.x),
              y: filteredNodes.map((n) => n.y),
              text: filteredNodes.map((n) => n.count >= labelThreshold ? n.id.replace(/-/g, " ") : ""),
              customdata: filteredNodes.map((n) => [n.id, n.count, n.roles.join(", "), n.community_label]),
              type: "scatter", mode: "markers+text",
              textposition: "top center",
              textfont: { size: 9, color: filteredNodes.map((_, i) => `rgba(255,255,255,${nodeOpacity[i]})`) },
              hovertemplate: "<b>%{customdata[0]}</b><br>Incidents: %{customdata[1]}<br>Roles: %{customdata[2]}<br>Cluster: %{customdata[3]}<extra></extra>",
              marker: {
                size: nodeSizes,
                color: nodeColors,
                opacity: nodeOpacity,
                line: { width: 0.5, color: "rgba(255,255,255,0.2)" },
              },
            },
          ]}
          layout={{
            height: 550,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            showlegend: false, hovermode: "closest",
            xaxis: { showgrid: false, zeroline: false, showticklabels: false, fixedrange: true },
            yaxis: { showgrid: false, zeroline: false, showticklabels: false, fixedrange: true },
            paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
            dragmode: false,
            annotations: [
              { x: -1.5, y: 1.3, text: "← Deployers / Developers", showarrow: false, font: { size: 10, color: "#666" } },
              { x: 1.5, y: 1.3, text: "Harmed Parties →", showarrow: false, font: { size: 10, color: "#666" } },
            ],
          }}
          config={{ displayModeBar: false, scrollZoom: false }}
          style={{ width: "100%" }}
        />
        <p className="text-xs text-gray-600 mt-2">Click an entity in the list below to highlight its connections.</p>
      </div>

      {/* Bottom Panel: Stats + Detail */}
      <div className="grid grid-cols-4 gap-6">
        {/* Top Deployers/Developers */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Top Deployers</h3>
          <PlotlyChart
            data={[{
              x: topDeployers.map((n) => n.count),
              y: topDeployers.map((n) => n.id.replace(/-/g, " ")),
              type: "bar", orientation: "h",
              marker: { color: "#FF6B6B" },
            }]}
            layout={{
              height: 240, margin: { l: 90, r: 10, t: 5, b: 5 },
              xaxis: { color: "#888", showgrid: false },
              yaxis: { autorange: "reversed", color: "#ccc", tickfont: { size: 10 } },
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#ccc" },
            }}
            config={{ displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>

        {/* Top Harmed */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Most Harmed</h3>
          <PlotlyChart
            data={[{
              x: topHarmed.map((n) => n.count),
              y: topHarmed.map((n) => n.id.replace(/-/g, " ")),
              type: "bar", orientation: "h",
              marker: { color: "#4ECDC4" },
            }]}
            layout={{
              height: 240, margin: { l: 90, r: 10, t: 5, b: 5 },
              xaxis: { color: "#888", showgrid: false },
              yaxis: { autorange: "reversed", color: "#ccc", tickfont: { size: 10 } },
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#ccc" },
            }}
            config={{ displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>

        {/* Entity List (clickable) */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Select Entity</h3>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {selectableNodes.map((n) => (
              <button key={n.id} onClick={() => setSelectedEntity(selectedEntity === n.id ? null : n.id)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                  selectedEntity === n.id ? "bg-gray-700 text-white font-medium" : "text-gray-400 hover:bg-gray-800"
                }`}>
                <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COMMUNITY_COLORS[n.community] || "#555" }} />
                {n.id.replace(/-/g, " ")} <span className="text-gray-600">({n.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Entity Detail */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          {selectedEntity ? (
            <>
              <h3 className="text-sm font-medium text-white mb-1">{selectedEntity.replace(/-/g, " ")}</h3>
              <p className="text-xs text-gray-500 mb-3">{entityIncidents.length} incidents</p>
              <div className="max-h-56 overflow-y-auto space-y-2">
                {entityIncidents.sort((a, b) => b.year - a.year).slice(0, 10).map((inc) => (
                  <div key={inc.incident_id} className="text-xs border-b border-gray-800 pb-1.5">
                    <div className="text-gray-200">{inc.title}</div>
                    <div className="text-gray-600">{inc.date}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-xs">
              Click an entity to see its incidents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
