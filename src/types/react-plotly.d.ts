declare module "react-plotly.js" {
  import { Component } from "react";

  interface PlotlyClickPoint {
    customdata?: unknown[];
    curveNumber?: number;
    x?: number | string;
    y?: number | string;
  }
  export interface PlotlyClickEvent {
    points?: PlotlyClickPoint[];
  }

  interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    style?: React.CSSProperties;
    className?: string;
    onInitialized?: (figure: any, graphDiv: any) => void;
    onUpdate?: (figure: any, graphDiv: any) => void;
    onError?: (err: any) => void;
    onClick?: (event: PlotlyClickEvent) => void;
    useResizeHandler?: boolean;
  }

  export default class Plot extends Component<PlotParams> {}
  export type { PlotParams };
}
