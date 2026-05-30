"use client";
import { useEffect, useRef, useState } from "react";
import cloud from "d3-cloud";
import { DONUT_PALETTE } from "../lib/constants";

export interface WordItem {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: WordItem[];
  height?: number;
  width?: number;
  title?: string;
  maxWords?: number;
}

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
  value: number;
}

/**
 * Word cloud using d3-cloud for proper collision-free layout.
 * Renders to SVG with spiral packing and optional rotation.
 */
export default function WordCloud({ words, height = 320, width = 700, title, maxWords = 50 }: WordCloudProps) {
  const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!words.length) return;

    const sorted = [...words].sort((a, b) => b.value - a.value).slice(0, maxWords);
    const maxVal = sorted[0]?.value || 1;
    const minVal = sorted[sorted.length - 1]?.value || 1;

    // Compute container width from ref if available
    const w = containerRef.current?.offsetWidth || width;
    const h = height - 30; // subtract title space

    const coloredWords = sorted.map((word, i) => ({
      text: word.text,
      size: minVal === maxVal
        ? 22
        : 12 + ((word.value - minVal) / (maxVal - minVal)) * 42,
      color: DONUT_PALETTE[i % DONUT_PALETTE.length],
      value: word.value,
    }));

    const layout = cloud()
      .size([w, h])
      .words(coloredWords as any)
      .padding(3)
      .rotate(() => {
        // 60% horizontal, 30% vertical, 10% slight angle
        const r = Math.random();
        if (r < 0.6) return 0;
        if (r < 0.9) return 90;
        return Math.random() > 0.5 ? -30 : 30;
      })
      .font("Inter, system-ui, sans-serif")
      .fontSize((d: any) => d.size)
      .spiral("archimedean")
      .on("end", (output: any[]) => {
        const result: LayoutWord[] = output.map((word: any) => ({
          text: word.text || "",
          size: word.size || 12,
          x: (word.x || 0) + w / 2,
          y: (word.y || 0) + h / 2,
          rotate: word.rotate || 0,
          color: word.color || "#fff",
          value: word.value || 0,
        }));
        setLayoutWords(result);
      });

    layout.start();
  }, [words, height, width, maxWords]);

  if (!words.length) return null;

  const h = height - 30;
  const w = containerRef.current?.offsetWidth || width;

  return (
    <div ref={containerRef}>
      {title && <h4 className="text-sm font-medium text-gray-300 mb-2">{title}</h4>}
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {layoutWords.map((word, i) => (
          <text
            key={`${word.text}-${i}`}
            transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
            textAnchor="middle"
            style={{
              fontSize: `${word.size}px`,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: word.size > 30 ? 700 : word.size > 20 ? 600 : 400,
              fill: word.color,
              cursor: "default",
            }}
          >
            <title>{`${word.text}: ${word.value}`}</title>
            {word.text}
          </text>
        ))}
      </svg>
    </div>
  );
}

/**
 * Extract top words from an array of text strings.
 * Filters out common stop words and short words.
 */
export function extractWords(texts: string[], topN = 50): WordItem[] {
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
    "system", "systems", "data", "people", "company", "time", "year",
    "could", "would", "should", "like", "much", "another", "since",
    "however", "because", "both", "found", "part", "several", "three",
    "after", "help", "take", "come", "make", "know", "think",
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
