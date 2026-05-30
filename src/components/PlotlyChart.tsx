"use client";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PlotlyChartProps {
  data: any[];
  layout?: any;
  config?: any;
  style?: CSSProperties;
}

export default function PlotlyChart({ data, layout, config, style }: PlotlyChartProps) {
  return <Plot data={data} layout={layout} config={config} style={style} />;
}
