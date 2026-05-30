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
 * Packed word cloud using a treemap-style layout.
 * Words are arranged in rows, sized proportionally, with no overlap.
 */
export default function WordCloud({ words, height = 300, title, maxWords = 35 }: WordCloudProps) {
  if (!words.length) return null;

  const sorted = [...words].sort((a, b) => b.value - a.value).slice(0, maxWords);
  const maxVal = sorted[0]?.value || 1;
  const minVal = sorted[sorted.length - 1]?.value || 1;

  // Compute font sizes (range: 11px to 38px)
  const sizes = sorted.map((w) => {
    if (maxVal === minVal) return 20;
    const normalized = (w.value - minVal) / (maxVal - minVal);
    return Math.round(11 + normalized * 27);
  });

  // Estimate word widths (chars * fontSize * 0.55 is a rough approximation)
  const estimatedWidths = sorted.map((w, i) => w.text.length * sizes[i] * 0.55);
  const wordHeights = sizes.map((s) => s * 1.4);

  // Pack words into rows using a greedy row-packing algorithm
  const canvasWidth = 700; // approximate plotly chart width in px
  const rows: { words: number[]; rowWidth: number; rowHeight: number }[] = [];
  let currentRow: number[] = [];
  let currentRowWidth = 0;
  let currentRowHeight = 0;

  sorted.forEach((_, i) => {
    const wWidth = estimatedWidths[i] + 12; // padding between words
    const wHeight = wordHeights[i];

    if (currentRowWidth + wWidth > canvasWidth && currentRow.length > 0) {
      rows.push({ words: currentRow, rowWidth: currentRowWidth, rowHeight: currentRowHeight });
      currentRow = [];
      currentRowWidth = 0;
      currentRowHeight = 0;
    }
    currentRow.push(i);
    currentRowWidth += wWidth;
    currentRowHeight = Math.max(currentRowHeight, wHeight);
  });
  if (currentRow.length) {
    rows.push({ words: currentRow, rowWidth: currentRowWidth, rowHeight: currentRowHeight });
  }

  // Compute absolute positions from row layout
  const totalHeight = rows.reduce((sum, r) => sum + r.rowHeight, 0);
  const positions: { x: number; y: number }[] = new Array(sorted.length);
  let yOffset = totalHeight / 2;

  rows.forEach((row) => {
    yOffset -= row.rowHeight / 2;
    let xOffset = -row.rowWidth / 2;
    row.words.forEach((wordIdx) => {
      const wWidth = estimatedWidths[wordIdx] + 12;
      positions[wordIdx] = {
        x: xOffset + wWidth / 2,
        y: yOffset,
      };
      xOffset += wWidth;
    });
    yOffset -= row.rowHeight / 2;
  });

  // Normalize to a -1..1 coordinate space for Plotly
  const maxAbsX = Math.max(...positions.map((p) => Math.abs(p.x)), 1);
  const maxAbsY = Math.max(...positions.map((p) => Math.abs(p.y)), 1);
  const normalizedX = positions.map((p) => p.x / maxAbsX);
  const normalizedY = positions.map((p) => p.y / maxAbsY);

  const colors = sorted.map((_, i) => DONUT_PALETTE[i % DONUT_PALETTE.length]);

  return (
    <div>
      {title && <h4 className="text-sm font-medium text-gray-300 mb-2">{title}</h4>}
      <PlotlyChart
        data={[{
          x: normalizedX,
          y: normalizedY,
          text: sorted.map((w) => w.text),
          mode: "text",
          type: "scatter",
          textfont: {
            size: sizes,
            color: colors,
            family: "Inter, system-ui, sans-serif",
            weight: sizes.map((s) => (s > 25 ? 700 : s > 18 ? 600 : 400)),
          },
          hoverinfo: "text",
          hovertext: sorted.map((w) => `${w.text}: ${w.value} occurrences`),
        }]}
        layout={{
          height,
          margin: { l: 10, r: 10, t: 5, b: 5 },
          xaxis: {
            showgrid: false, zeroline: false, showticklabels: false,
            range: [-1.3, 1.3], fixedrange: true,
          },
          yaxis: {
            showgrid: false, zeroline: false, showticklabels: false,
            range: [-1.3, 1.3], fixedrange: true,
          },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          hovermode: "closest",
        }}
        config={{ displayModeBar: false, staticPlot: false }}
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
    "who", "its", "there", "then", "only", "even", "back", "still", "many",
    "while", "these", "those", "most", "very", "down", "does", "did",
    "system", "systems", "data", "people", "company", "time",
  ]);

  const counts: Record<string, number> = {};
  texts.forEach((text) => {
    if (!text) return;
    const words = text.toLowerCase()
      .replace(/[^a-z\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
    words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([text, value]) => ({ text, value }));
}
