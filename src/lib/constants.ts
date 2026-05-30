export const TOPIC_LABELS: Record<number, string> = {
  0: "Autonomous Vehicles & Robotics",
  1: "Facial Recognition & Surveillance",
  2: "AI-Powered Scams & Fraud",
  3: "Gig Economy & Worker Exploitation",
  4: "AI Chatbots & Virtual Companions",
  5: "Algorithmic Bias in Healthcare",
  6: "Recommendation Algorithms & Platforms",
  7: "AI-Generated CSAM & Student Exploitation",
  8: "Enterprise AI & Copilots",
  9: "Language AI & Search",
  10: "Audio Deepfakes & Impersonation",
  11: "Political Deepfakes & Disinformation",
};

export const TOPIC_COLORS: string[] = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#F7DC6F", "#FF8C94", "#85C1E9", "#82E0AA",
  "#F8C471", "#BB8FCE",
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Discrimination and Toxicity": "#FF6B6B",
  "AI system safety, failures, and limitations": "#4ECDC4",
  "Privacy and Security": "#45B7D1",
  "Malicious Actors and Misuse": "#FFEAA7",
  "Socioeconomic and Environmental Harms": "#DDA0DD",
  "Misinformation and Disinformation": "#F7DC6F",
  "Human Autonomy and Oversight": "#96CEB4",
  "Unclassified": "#555555",
};

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/timeline", label: "Timeline", icon: "📈" },
  { href: "/network", label: "Network", icon: "🔗" },
  { href: "/topics", label: "Topics", icon: "🧠" },
  { href: "/heatmap", label: "Harm Matrix", icon: "🗂️" },
];
