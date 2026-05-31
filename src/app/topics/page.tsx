"use client";
import { useEffect, useState, useMemo } from "react";
import PlotlyChart from "../../components/PlotlyChart";
import WordCloud, { extractWords } from "../../components/WordCloud";
import { fetchJSON, Incident, TopicInfo } from "../../lib/data";
import { TOPIC_LABELS, TOPIC_COLORS, DONUT_PALETTE } from "../../lib/constants";

export default function TopicsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [topicInfo, setTopicInfo] = useState<TopicInfo[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [harmFilter, setHarmFilter] = useState<string>("All");

  useEffect(() => {
    fetchJSON<Incident[]>("/data/incidents.json").then(setIncidents);
    fetchJSON<TopicInfo[]>("/data/topics.json").then(setTopicInfo);
  }, []);

  // Available harm categories
  const riskCategories = useMemo(() => {
    const cats = new Set<string>();
    incidents.forEach((i) => {
      if (i.risk_category && i.risk_category !== "Unclassified") cats.add(i.risk_category);
    });
    return ["All", ...Array.from(cats).sort()];
  }, [incidents]);

  // Filtered incidents by harm type
  const filteredIncidents = useMemo(() => {
    if (harmFilter === "All") return incidents;
    return incidents.filter((i) => i.risk_category === harmFilter);
  }, [incidents, harmFilter]);

  if (!incidents.length) return <div className="text-gray-400">Loading...</div>;

  const topics = [...new Set(filteredIncidents.map((i) => i.topic))].filter((t) => t !== -1).sort();

  // Build scatter traces
  const scatterTraces = topics.map((topicId) => {
    const pts = filteredIncidents.filter((i) => i.topic === topicId);
    const isSelected = selectedTopic === null || selectedTopic === topicId;
    return {
      x: pts.map((p) => p.umap_x),
      y: pts.map((p) => p.umap_y),
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

  // Topic counts from filtered data
  const topicCounts: Record<number, number> = {};
  filteredIncidents.forEach((i) => { if (i.topic !== -1) topicCounts[i.topic] = (topicCounts[i.topic] || 0) + 1; });

  // YoY growth per topic (compare last 2 years)
  const topicGrowth: Record<number, number> = {};
  topics.forEach((t) => {
    const thisYear = filteredIncidents.filter((i) => i.topic === t && i.year >= 2025).length;
    const lastYear = filteredIncidents.filter((i) => i.topic === t && i.year >= 2023 && i.year < 2025).length;
    topicGrowth[t] = lastYear > 0 ? Math.round(((thisYear - lastYear) / lastYear) * 100) : (thisYear > 0 ? 100 : 0);
  });

  // Selected topic details
  const selInfo = topicInfo.find((t) => t.Topic === selectedTopic);
  const selIncidents = selectedTopic !== null ? filteredIncidents.filter((i) => i.topic === selectedTopic) : [];

  // Top entities for selected topic
  const selEntities = useMemo(() => {
    if (!selIncidents.length) return [];
    const counts: Record<string, number> = {};
    selIncidents.forEach((i) => {
      [...i.deployers, ...i.developers].forEach((e) => {
        if (e && !e.startsWith("unknown")) counts[e] = (counts[e] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [selIncidents]);

  // Topics over time data
  const topicsOverTime = useMemo(() => {
    const yearTopicCounts: Record<number, Record<number, number>> = {};
    filteredIncidents.forEach((i) => {
      if (i.topic === -1 || i.year < 2010) return;
      if (!yearTopicCounts[i.year]) yearTopicCounts[i.year] = {};
      yearTopicCounts[i.year][i.topic] = (yearTopicCounts[i.year][i.topic] || 0) + 1;
    });
    return yearTopicCounts;
  }, [filteredIncidents]);

  const timeYears = Object.keys(topicsOverTime).map(Number).sort();
  // Top 8 topics by total count for the time chart
  const topTopics = topics
    .sort((a, b) => (topicCounts[b] || 0) - (topicCounts[a] || 0))
    .slice(0, 8);

  const timeTraces = topTopics.map((topicId) => ({
    x: timeYears,
    y: timeYears.map((y) => topicsOverTime[y]?.[topicId] || 0),
    type: "scatter" as const,
    mode: "lines" as const,
    name: TOPIC_LABELS[topicId] || `Topic ${topicId}`,
    stackgroup: "one",
    line: { width: 0.5 },
    fillcolor: TOPIC_COLORS[topicId % TOPIC_COLORS.length] + "AA",
    marker: { color: TOPIC_COLORS[topicId % TOPIC_COLORS.length] },
  }));

  return (
    <div className="max-w-7xl">
      <h1 className="text-3xl font-bold mb-2">🧠 Topic Explorer</h1>
      <p className="text-gray-400 mb-4">
        BERTopic discovers <strong className="text-white">12 latent themes</strong> in AI incident
        descriptions using sentence embeddings and hierarchical clustering.
        Click a theme card to inspect it.
      </p>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm text-gray-400">
          Filter by harm type:
          <select value={harmFilter} onChange={(e) => { setHarmFilter(e.target.value); setSelectedTopic(null); }}
            className="ml-2 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            {riskCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>
        <span className="text-xs text-gray-500">
          {filteredIncidents.filter((i) => i.topic !== -1).length} incidents shown
        </span>
      </div>

      {/* Scatter */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <PlotlyChart
          data={scatterTraces}
          layout={{
            height: 500,
            margin: { l: 0, r: 0, t: 10, b: 0 },
            xaxis: { showgrid: false, showticklabels: false, zeroline: false, fixedrange: true },
            yaxis: { showgrid: false, showticklabels: false, zeroline: false, fixedrange: true },
            legend: {
              orientation: "v", y: 0.98, x: 1.01, font: { size: 9, color: "#bbb" },
              bgcolor: "rgba(17,24,39,0.9)", bordercolor: "rgba(255,255,255,0.05)", borderwidth: 1,
            },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            hovermode: "closest",
            dragmode: false,
          }}
          config={{ displayModeBar: false, scrollZoom: false }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Topic Cards with growth stats */}
      <h2 className="text-xl font-semibold mb-3">Themes</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {topics.sort((a, b) => (topicCounts[b] || 0) - (topicCounts[a] || 0)).map((t) => {
          const info = topicInfo.find((ti) => ti.Topic === t);
          const active = selectedTopic === t;
          const growth = topicGrowth[t] || 0;
          return (
            <button key={t} onClick={() => setSelectedTopic(active ? null : t)}
              className={`text-left p-4 rounded-lg border transition-all ${
                active ? "border-white bg-gray-800" : "border-gray-800 bg-gray-900 hover:border-gray-600"
              }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TOPIC_COLORS[t % TOPIC_COLORS.length] }} />
                  <span className="text-sm font-medium text-white">{TOPIC_LABELS[t] || `Topic ${t}`}</span>
                </div>
                {growth !== 0 && (
                  <span className={`text-xs font-medium ${growth > 0 ? "text-red-400" : "text-green-400"}`}>
                    {growth > 0 ? "+" : ""}{growth}%
                  </span>
                )}
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
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{TOPIC_LABELS[selectedTopic]}</h3>
          <div className="grid grid-cols-3 gap-6">
            {/* Word cloud */}
            <div>
              <WordCloud
                title="Topic Word Cloud"
                words={extractWords(
                  selIncidents.map((i) => `${i.title} ${i.description}`),
                  35
                )}
                height={280}
              />
            </div>

            {/* Top entities for this topic */}
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Top Entities in This Theme</h4>
              {selEntities.length > 0 ? (
                <PlotlyChart
                  data={[{
                    x: selEntities.map(([, count]) => count),
                    y: selEntities.map(([name]) => name.replace(/-/g, " ")),
                    type: "bar", orientation: "h",
                    marker: { color: TOPIC_COLORS[selectedTopic % TOPIC_COLORS.length] },
                  }]}
                  layout={{
                    height: 260, margin: { l: 100, r: 10, t: 5, b: 5 },
                    xaxis: { color: "#888", showgrid: false, title: "Incidents" },
                    yaxis: { autorange: "reversed", color: "#ccc", tickfont: { size: 10 } },
                    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#ccc" },
                  }}
                  config={{ displayModeBar: false }}
                  style={{ width: "100%" }}
                />
              ) : (
                <p className="text-xs text-gray-500">No named entities for this topic.</p>
              )}
            </div>

            {/* Recent incidents */}
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Recent Incidents ({selIncidents.length} total)</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {selIncidents.sort((a, b) => b.year - a.year).slice(0, 8).map((inc) => (
                  <div key={inc.incident_id} className="text-xs border-b border-gray-800 pb-1.5">
                    <div className="text-white">{inc.title}</div>
                    <div className="text-gray-600">{inc.date} · {inc.risk_category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topics Over Time */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold mb-1">Topic Trends Over Time</h3>
        <p className="text-xs text-gray-500 mb-4">
          How have different AI harm themes grown or declined? Stacked area shows the top 8 topics from 2010 onward.
        </p>
        <PlotlyChart
          data={timeTraces}
          layout={{
            height: 350,
            margin: { l: 50, r: 20, t: 10, b: 40 },
            xaxis: { title: "Year", showgrid: false, color: "#888" },
            yaxis: { title: "Incidents", showgrid: true, gridcolor: "#1f2937", color: "#888" },
            hovermode: "x unified",
            legend: { orientation: "h", y: -0.3, x: 0.5, xanchor: "center", font: { size: 9, color: "#aaa" } },
            paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#ccc" },
          }}
          config={{ displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
