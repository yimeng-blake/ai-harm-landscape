"use client";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { PlotlyClickEvent } from "react-plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PlotlyChartProps {
  data: any[];
  layout?: any;
  config?: any;
  style?: CSSProperties;
  onClick?: (event: PlotlyClickEvent) => void;
}

export default function PlotlyChart({ data, layout, config, style, onClick }: PlotlyChartProps) {
  return <Plot data={data} layout={layout} config={config} style={style} onClick={onClick} />;
}
