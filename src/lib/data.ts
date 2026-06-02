export interface Incident {
  incident_id: number;
  date: string;
  year: number;
  month: number;
  title: string;
  description: string;
  deployers: string[];
  developers: string[];
  harmed_parties: string[];
  "Risk Domain": string | null;
  "Risk Subdomain": string | null;
  "Entity": string | null;
  "Timing": string | null;
  "Intent": string | null;
  "Known AI Goal": string | null;
  "Known AI Technology": string | null;
  "Known AI Technical Failure": string | null;
  "Harm Domain": string | null;
  "Sector of Deployment": string | null;
  "Autonomy Level": string | null;
  topic: number;
  topic_prob: number;
  umap_x: number;
  umap_y: number;
  risk_category: string;
}

export interface TopicInfo {
  Topic: number;
  Count: number;
  Name: string;
  Representation: string[];
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface NetworkNode {
  id: string;
  count: number;
  roles: string[];
  primary_role: "deployer" | "harmed" | "mixed";
  community: number;
  community_label: string;
  x: number;
  y: number;
  x_role: number; y_role: number;
  x_force: number; y_force: number;
  x_circular: number; y_circular: number;
  x_community: number; y_community: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

export interface TimelineRow {
  year: number;
  risk_category: string;
  count: number;
}

export interface HeatmapRow {
  [key: string]: string | number;
}

export async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}
