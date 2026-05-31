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

// MIT Risk Domain colors (clean names without numbering)
export const MIT_DOMAIN_COLORS: Record<string, string> = {
  "Malicious Actors & Misuse": "#FF6B6B",
  "AI system safety, failures, and limitations": "#4ECDC4",
  "Discrimination and Toxicity": "#45B7D1",
  "Misinformation": "#FFEAA7",
  "Privacy & Security": "#DDA0DD",
  "Human-Computer Interaction": "#96CEB4",
  "Socioeconomic & Environmental Harms": "#F7DC6F",
};

export const DONUT_PALETTE = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#F7DC6F", "#FF8C94", "#85C1E9", "#82E0AA",
  "#F8C471", "#BB8FCE", "#AED6F1", "#F5B7B1", "#A2D9CE",
];

export const COMMUNITY_COLORS: Record<number, string> = {
  0: "#FF6B6B",  // Big Tech
  1: "#4ECDC4",  // Surveillance & Policing
  2: "#45B7D1",  // Students & Minors
  3: "#FFEAA7",  // LLM Users
  4: "#DDA0DD",  // Generative AI
  5: "#96CEB4",  // Education
  6: "#F7DC6F",  // Workplace
  7: "#FF8C94",  // Cybercrime
  [-1]: "#555555", // Other
};

export const ROLE_COLORS: Record<string, string> = {
  deployer: "#FF6B6B",
  developer: "#FF6B6B",
  harmed: "#4ECDC4",
  mixed: "#FFEAA7",
};
