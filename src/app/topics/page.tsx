"use client";
import { useEffect, useState } from "react";
import PlotlyChart from "../../components/PlotlyChart";
import { fetchJSON, Incident, TopicInfo } from "../../lib/data";
import { TOPIC_LABELS, TOPIC_COLORS } from "../../lib/constants";

export default function TopicsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [topicInfo, setTopicInfo] = useState<TopicInfo[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  useEffect(() => {
    fetchJSON<Incident[]>("/data/incidents.json").then(setIncidents);
    fetchJSON<TopicInfo[]>("/data/topics.json").then(setTopicInfo);
  }, []);

  if (!incidents.length) return <div className="text-gray-400">Loading...</div>;

  // Build scatter traces - one per topic for color control
  const topics = [...new Set(incidents.map((i) => i.topic))].filter((t) => t !== -1).sort();
  const scatterTraces = topics.map((topicId) => {
    const pts = incidents.filter((i) => i.topic === topicId);
    const isSelected = selectedTopic === null || selectedTopic === topicId;
    return {
      x: pts.map((p) => p.umap_x),
      y: pts.map((p) => p.umap_y),
      text: pts.map((p) => p.title),
      customdata: pts.map((p) => [p.title, p.year, p.risk_category]),
      type: "scatter" as const,
      mode: "markers" as const,
      name: TOPIC_LABELS[topicId] || `Topic ${topicId}`,
      marker: {
        color: TOPIC_COLORS[topicId % TOPIC_COLORS.length],
        size: 7,
        opacity: isSelected ? 0.85 : 0.15,
        line: { width: 0.3, color: "rgba(255,255,255,0.4)" },
      },
      hovertemplate: "<b>%{customdata[0]}</b><br>Year: %{customdata[1]}<br>Category: %{customdata[2]}<extra></extra>",
    };
  });

  // Topic counts
  const topicCounts: Record<number, number> = {};
  incidents.forEach((i) => { if (i.topic !== -1) topicCounts[i.topic] = (topicCounts[i.topic] || 0) + 1; });

  // Selected topic details
  const selInfo = topicInfo.find((t) => t.Topic === selectedTopic);
  const selIncidents = selectedTopic !== null ? incidents.filter((i) => i.topic === selectedTopic) : [];

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">🧠 Topic Explorer</h1>
      <p className="text-gray-400 mb-6">
        BERTopic discovers <strong className="text-white">12 latent themes</strong> in AI incident
        descriptions using sentence embeddings and hierarchical clustering. Click a theme card to highlight it.
      </p>

      {/* Scatter */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <PlotlyChart
          data={scatterTraces}
          layout={{
            height: 550,
            margin: { l: 0, r: 0, t: 10, b: 0 },
            xaxis: { showgrid: false, showticklabels: false, zeroline: false },
            yaxis: { showgrid: false, showticklabels: false, zeroline: false },
            legend: {
              orientation: "v", y: 0.98, x: 1.01, font: { size: 10, color: "#bbb" },
              bgcolor: "rgba(17,24,39,0.9)", bordercolor: "rgba(255,255,255,0.05)", borderwidth: 1,
            },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            hovermode: "closest",
          }}
          config={{ displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Topic Cards */}
      <h2 className="text-xl font-semibold mb-3">Themes</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {topics.sort((a, b) => (topicCounts[b] || 0) - (topicCounts[a] || 0)).map((t) => {
          const info = topicInfo.find((ti) => ti.Topic === t);
          const active = selectedTopic === t;
          return (
            <button key={t} onClick={() => setSelectedTopic(active ? null : t)}
              className={`text-left p-4 rounded-lg border transition-all ${
                active ? "border-white bg-gray-800" : "border-gray-800 bg-gray-900 hover:border-gray-600"
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TOPIC_COLORS[t % TOPIC_COLORS.length] }} />
                <span className="text-sm font-medium text-white">{TOPIC_LABELS[t] || `Topic ${t}`}</span>
              </div>
              <div className="text-xs text-gray-400">
                {topicCounts[t] || 0} incidents · {info?.Representation?.slice(0, 4).join(", ")}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedTopic !== null && selInfo && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">{TOPIC_LABELS[selectedTopic]}</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Key Terms</h4>
              <PlotlyChart
                data={[{
                  x: selInfo.Representation.slice(0, 10).map((_, i) => 10 - i),
                  y: selInfo.Representation.slice(0, 10),
                  type: "bar", orientation: "h",
                  marker: { color: TOPIC_COLORS[selectedTopic % TOPIC_COLORS.length] },
                }]}
                layout={{
                  height: 280, margin: { l: 100, r: 10, t: 10, b: 30 },
                  xaxis: { title: "Relevance", color: "#888" },
                  yaxis: { autorange: "reversed", color: "#ccc" },
                  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#ccc" },
                }}
                config={{ displayModeBar: false }}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Recent Incidents ({selIncidents.length} total)</h4>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {selIncidents.sort((a, b) => b.year - a.year).slice(0, 10).map((inc) => (
                  <div key={inc.incident_id} className="text-sm border-b border-gray-800 pb-2">
                    <div className="text-white font-medium">{inc.title}</div>
                    <div className="text-xs text-gray-500">{inc.date} · {inc.risk_category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
