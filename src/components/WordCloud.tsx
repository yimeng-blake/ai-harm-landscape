"use client";
import PlotlyChart from "./PlotlyChart";
import { DONUT_PALETTE } from "../lib/constants";

export interface WordItem {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: WordItem[];
  height?: number;
  title?: string;
  maxWords?: number;
}

/**
 * Word cloud using Plotly scatter with text mode.
 * Words are positioned in a spiral layout with size proportional to frequency.
 */
export default function WordCloud({ words, height = 300, title, maxWords = 40 }: WordCloudProps) {
  if (!words.length) return null;

  // Take top N words and normalize sizes
  const sorted = [...words].sort((a, b) => b.value - a.value).slice(0, maxWords);
  const maxVal = sorted[0]?.value || 1;
  const minVal = sorted[sorted.length - 1]?.value || 1;

  // Generate spiral positions for words
  const positions = sorted.map((_, i) => {
    const angle = i * 2.4; // golden angle spiral
    const radius = Math.sqrt(i) * 0.15;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });

  // Calculate font sizes (12-48px range)
  const sizes = sorted.map((w) => {
    if (maxVal === minVal) return 24;
    const normalized = (w.value - minVal) / (maxVal - minVal);
    return Math.round(12 + normalized * 36);
  });

  const colors = sorted.map((_, i) => DONUT_PALETTE[i % DONUT_PALETTE.length]);

  return (
    <div>
      {title && <h4 className="text-sm font-medium text-gray-300 mb-2">{title}</h4>}
      <PlotlyChart
        data={[{
          x: positions.map((p) => p.x),
          y: positions.map((p) => p.y),
          text: sorted.map((w) => w.text),
          mode: "text",
          type: "scatter",
          textfont: {
            size: sizes,
            color: colors,
            family: "Inter, system-ui, sans-serif",
          },
          hoverinfo: "text",
          hovertext: sorted.map((w) => `${w.text}: ${w.value}`),
        }]}
        layout={{
          height,
          margin: { l: 0, r: 0, t: 0, b: 0 },
          xaxis: { showgrid: false, zeroline: false, showticklabels: false, range: [-1.5, 1.5] },
          yaxis: { showgrid: false, zeroline: false, showticklabels: false, range: [-1.2, 1.2] },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          hovermode: "closest",
        }}
        config={{ displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </div>
  );
}

/**
 * Extract top words from an array of text strings.
 * Filters out common stop words and short words.
 */
export function extractWords(texts: string[], topN = 40): WordItem[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "was", "were", "is", "are", "been", "be", "have", "has", "had",
    "that", "this", "it", "its", "they", "their", "which", "who", "what", "when",
    "where", "how", "not", "no", "can", "will", "would", "could", "should", "may",
    "also", "than", "more", "other", "into", "about", "over", "after", "before",
    "between", "through", "during", "without", "within", "upon", "against",
    "said", "according", "reported", "reportedly", "allegedly", "using", "used",
    "new", "first", "one", "two", "being", "made", "including", "based",
    "such", "well", "just", "some", "them", "him", "her", "all", "each",
  ]);

  const counts: Record<string, number> = {};
  texts.forEach((text) => {
    if (!text) return;
    const words = text.toLowerCase()
      .replace(/[^a-z\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
    words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([text, value]) => ({ text, value }));
}
