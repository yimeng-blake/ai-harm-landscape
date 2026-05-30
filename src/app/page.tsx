"use client";
import { useEffect, useState } from "react";
import PlotlyChart from "../components/PlotlyChart";
import WordCloud, { extractWords } from "../components/WordCloud";
import { fetchJSON, Incident } from "../lib/data";

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    fetchJSON<Incident[]>("/data/incidents.json").then(setIncidents);
  }, []);

  if (!incidents.length) return <div className="text-gray-400">Loading...</div>;

  const total = incidents.length;
  const recent = incidents.filter((i) => i.year >= 2023).length;
  const pctRecent = ((recent / total) * 100).toFixed(0);
  const uniqueDevs = new Set(incidents.flatMap((i) => i.developers)).size;

  // Sparkline data
  const yearCounts: Record<number, number> = {};
  incidents.forEach((i) => { yearCounts[i.year] = (yearCounts[i.year] || 0) + 1; });
  const years = Object.keys(yearCounts).map(Number).filter(y => y >= 2005).sort();
  const counts = years.map((y) => yearCounts[y]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-4xl font-bold mb-2">AI Harm Landscape</h1>
      <p className="text-lg text-gray-400 mb-8">
        Interactive Visual Analytics of Real-World AI Failures
      </p>

      <blockquote className="border-l-4 border-red-400 pl-4 mb-8 text-gray-300">
        The AI Incident Database catalogs <strong>{total.toLocaleString()} documented incidents</strong> of
        AI causing harm in the real world (1983–2026). <strong>{pctRecent}% occurred since 2023</strong>,
        driven by the rapid proliferation of generative AI, deepfakes, and chatbots.
      </blockquote>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-white">{total.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Total Incidents</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-white">{uniqueDevs.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Organizations Involved</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-3xl font-bold text-white">12</div>
          <div className="text-sm text-gray-400 mt-1">AI Harm Themes Discovered</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-8">
        <PlotlyChart
          data={[{
            x: years,
            y: counts,
            type: "scatter",
            mode: "lines",
            fill: "tozeroy",
            line: { color: "#FF6B6B", width: 2 },
            fillcolor: "rgba(255,107,107,0.15)",
          }]}
          layout={{
            height: 180,
            margin: { l: 40, r: 20, t: 10, b: 30 },
            xaxis: { showgrid: false, color: "#666" },
            yaxis: { showgrid: false, color: "#666", title: "" },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#999" },
          }}
          config={{ displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Hero Word Cloud */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8">
        <WordCloud
          title="Most Frequent Terms Across All AI Incidents"
          words={extractWords(incidents.map((i) => `${i.title} ${i.description}`), 50)}
          height={260}
          maxWords={50}
        />
      </div>

      {/* Nav cards */}
      <h2 className="text-xl font-semibold mb-4">Explore</h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          { href: "/timeline", icon: "📈", title: "Timeline", desc: "Incident growth over time by harm category" },
          { href: "/network", icon: "🔗", title: "Network", desc: "Entity relationships: who deploys, who gets harmed" },
          { href: "/topics", icon: "🧠", title: "Topics", desc: "12 NLP-discovered themes in AI failures" },
          { href: "/heatmap", icon: "🗂️", title: "Harm Matrix", desc: "Sector vs. harm type heatmap" },
        ].map((card) => (
          <a key={card.href} href={card.href}
             className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="font-semibold text-white">{card.title}</span>
            </div>
            <p className="text-sm text-gray-400">{card.desc}</p>
          </a>
        ))}
      </div>

      <p className="text-xs text-gray-600 mt-8">
        Data: AI Incident Database (incidentdatabase.ai) · NLP: BERTopic + sentence-transformers · CSEN 377 — SCU 2026
      </p>
    </div>
  );
}
