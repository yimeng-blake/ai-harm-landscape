// ---------------------------------------------------------------------------
// COLOR SYSTEM
// Each semantic dimension gets its OWN stable palette so a given color always
// means one thing. Palettes are chosen to be distinguishable for the most
// common color-vision deficiencies (Okabe-Ito based; red-vs-grey, not red-vs-green).
// ---------------------------------------------------------------------------

// Okabe-Ito colorblind-safe base (used for risk categories — the dimension that
// recurs across the most pages, so it needs the most stable, accessible mapping).
const NEUTRAL = "#999999";

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

// TOPICS: 12-class qualitative set (Paul Tol family) — its own palette, distinct
// from the category and community palettes so "Topic 0" never reads as a category.
export const TOPIC_COLORS: string[] = [
  "#332288", "#117733", "#44AA99", "#88CCEE", "#DDCC77", "#CC6677",
  "#AA4499", "#882255", "#661100", "#6699CC", "#999933", "#EE8866",
];

// RISK CATEGORIES: Okabe-Ito, stable across timeline / network filter / topics filter.
// Keys must match the exact risk_category strings in incidents.json.
export const CATEGORY_COLORS: Record<string, string> = {
  "Discrimination and Toxicity": "#D55E00",
  "AI system safety, failures, and limitations": "#0072B2",
  "Privacy & Security": "#009E73",
  "Malicious Actors & Misuse": "#CC79A7",
  "Socioeconomic & Environmental Harms": "#E69F00",
  "Misinformation": "#56B4E9",
  "Human-Computer Interaction": "#F0E442",
  "Unclassified": NEUTRAL,
};

// Fallback for taxonomy donuts — same family as risk categories.
export const DONUT_PALETTE = [
  "#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9",
  "#D55E00", "#F0E442", "#882255", "#44AA99", "#AA4499",
  "#6699CC", "#999933", NEUTRAL,
];

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/timeline", label: "Timeline", icon: "📈" },
  { href: "/network", label: "Network", icon: "🔗" },
  { href: "/topics", label: "Topics", icon: "🧠" },
  { href: "/heatmap", label: "Harm Matrix", icon: "🗂️" },
];

// COMMUNITIES: a distinct (seaborn-muted) family so a community color is never
// mistaken for a risk-category color elsewhere in the app.
export const COMMUNITY_COLORS: Record<number, string> = {
  0: "#4C72B0",  // Big Tech
  1: "#DD8452",  // Surveillance & Policing
  2: "#55A868",  // Students & Minors
  3: "#C44E52",  // LLM Users
  4: "#8172B3",  // Generative AI
  5: "#937860",  // Education
  6: "#DA8BC3",  // Workplace
  7: "#CCB974",  // Cybercrime
  [-1 as unknown as number]: NEUTRAL, // Other
};

// ROLES: each role is now its OWN color (deployer and developer were identical
// before, which made them indistinguishable). Used for the deployer/harmed bars.
export const ROLE_COLORS: Record<string, string> = {
  deployer: "#0072B2",  // blue
  developer: "#56B4E9",  // sky blue
  harmed: "#E69F00",     // orange
  mixed: "#CC79A7",      // purple
};

// Semantic shortcuts for the recurring "who acted" vs "who was harmed" bar charts.
export const DEPLOYER_COLOR = ROLE_COLORS.deployer;
export const HARMED_COLOR = ROLE_COLORS.harmed;

// Shared tooltip styling (Fixes 2/3/5/6): one opaque, readable hover label used by every chart.
export const HOVERLABEL = {
  bgcolor: "#0f172a",
  bordercolor: "#334155",
  font: { color: "#e5e7eb", size: 12 },
  namelength: -1,
};
