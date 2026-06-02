# AI Harm Landscape

**Interactive Visual Analytics of Real-World AI Failures**

A data visualization tool that explores patterns, trends, and relationships in 1,491 documented AI incidents (1983–2026) from the [AI Incident Database](https://incidentdatabase.ai/). Built as a final project for CSEN 377 Data Visualization at Santa Clara University.

## What This Project Does

AI systems increasingly cause real-world harm — from self-driving car fatalities to facial recognition misidentification to deepfake scams. This project applies **NLP-powered topic modeling** (BERTopic with sentence-transformers) to discover latent themes in incident descriptions, then presents the results through four interconnected interactive visualizations.

The four pages form a **cohesive analytical system** — they share filtering patterns (harm type dropdown, year range), visual language (consistent color palettes, dark theme), and cross-reference each other's data (topics link to entities, entities link to time periods).

---

## Visualizations

### 1. Timeline (📈)

**Purpose**: How have AI-related harms evolved over time? Which categories are growing fastest?

**Design choices**:
- **Stacked area chart** as the primary visualization — chosen because it shows both total volume growth AND compositional change simultaneously. The exponential surge after 2022 is immediately visible.
- **Taxonomy-linked grouping** — The stacked area dynamically re-groups based on which taxonomy tab (MIT/GMF/CSET) is selected below. This was chosen so users can see the same temporal data through three different analytical lenses without navigating away.
- **Taxonomy donut charts (MIT, GMF, CSET)** — Interactive percentage donuts with drill-down capability. MIT tab shows 7 high-level risk domains; clicking one drills into subdomains. GMF shows AI goals and technical failure modes. CSET shows deployment sectors and autonomy levels. We chose donuts over pie charts for the center-hole space and over bar charts for part-to-whole comparison.
- **Period-specific word cloud** — A d3-cloud word cloud that updates with the year range filter. Chosen to give an immediate visceral impression of dominant terms in any time period (e.g., 2015-2018 shows "self-driving, recognition, bias" while 2023-2026 shows "deepfake, chatgpt, scam"). Uses Archimedean spiral layout with collision detection for tight, professional packing.
- **Event annotations** — Key milestones (first AV fatality 2018, ChatGPT launch 2022) are marked directly on the chart to provide historical context.
- **Year range slider** — Filters all visualizations on the page simultaneously.

### 2. Entity Network (🔗)

**Purpose**: Which organizations keep appearing in AI incidents? How are deployers, developers, and harmed parties connected?

**Design choices**:
- **Co-occurrence graph** — Entities are connected if they appear in the same incident. Chosen over simple ranking because it reveals structural relationships (e.g., which companies share the same victims, which companies co-deploy systems).
- **Role-based spatial layout** — Deployers/developers are positioned to the left, harmed parties to the right. This was chosen to give spatial position semantic meaning rather than relying on arbitrary force-directed physics. Users can immediately see the "who causes harm → who gets harmed" flow.
- **8 named community clusters** — Community detection (modularity optimization) identifies natural groupings. We limited to 8 labeled communities (Big Tech, Surveillance & Policing, Students & Minors, LLM Ecosystem, Generative AI, Education, Workplace, Cybercrime) because 200 auto-detected communities were meaningless. The labels come from inspecting the top members of each cluster.
- **Harm type filter** — Same dropdown as the Topics page. Filters the network to only show entities involved in a specific risk category. Reveals, for example, that the "Discrimination" network is dominated by Google, Amazon, and hiring platforms, while "Malicious Actors" is dominated by cybercriminals and deepfake creators.
- **Click-to-highlight** — Selecting an entity from the list highlights it and all directly connected neighbors, dimming everything else to 12% opacity. Chosen because force-directed graphs are inherently hard to read; the highlight mechanic lets users trace individual entity stories.
- **Summary stats bars** — "Top Deployers" and "Most Harmed" horizontal bar charts provide immediate ranked answers without requiring users to parse the graph visually. These update when filters change.
- **Entity exclusion** — Generic placeholder entities ("unknown-deepfake-technology-developers", "general-public", "epistemic-integrity") were removed from the graph because they added noise without insight. Only named, identifiable organizations remain.

### 3. Topic Explorer (🧠)

**Purpose**: What latent themes exist in AI incident descriptions? How do they relate to time, entities, and harm types?

**Design choices**:
- **UMAP scatter plot** — 2D projection of sentence embeddings (all-MiniLM-L6-v2) reduced via UMAP. Each dot is an incident, positioned by semantic similarity. Chosen because it reveals cluster structure that manual categorization might miss — incidents that "sound similar" cluster together regardless of their official taxonomy label.
- **12 consolidated topics** — BERTopic initially found 49 topics; we used `reduce_topics(nr_topics=12)` and `reduce_outliers()` to merge them into interpretable themes. 12 was chosen as the sweet spot between granularity (enough to distinguish "AI Chatbots" from "Audio Deepfakes") and readability (few enough to fit in a legend and card grid).
- **Human-readable topic labels** — Auto-generated BERTopic names like "0_tesla_facebook_driving_robot" were replaced with curated labels ("Autonomous Vehicles & Robotics") for immediate comprehension.
- **Year range filter** — Filters the scatter, cards, detail panel, and time chart. Lets users ask "what topics dominated 2023-2024 specifically?" The scatter still shows all UMAP positions (since those are computed globally) but only colors/shows incidents within the range.
- **Growth badges (±%)** — Each topic card shows percentage growth comparing the first half vs second half of the selected year range. Immediately highlights escalating vs declining themes. Red = growing (worse), green = declining (improving).
- **Per-topic word cloud** — When a topic is selected, a d3-cloud word cloud is generated from that topic's incident text. Chosen over a keyword bar chart because word clouds give faster gestalt recognition of a theme's "feel."
- **Top Entities per Topic bar chart** — Bridges to the Network page. Shows which companies are most associated with each theme. Reveals, e.g., that "Facial Recognition" is dominated by Clearview AI and police departments, while "AI Chatbots" centers on OpenAI and Meta.
- **Topics Over Time stacked area** — Parallels the Timeline page's visual language. Shows how the 8 largest topics have grown/declined since 2010. Makes it viscerally clear that "Autonomous Vehicles" peaked 2018-2020 while "AI-Powered Scams" exploded 2023+.
- **Harm type filter** — Same dropdown as Network page. Filters to show only topics that appear within a specific risk category. Reveals which NLP themes overlap with which official taxonomy categories.

### 4. Harm Matrix (🗂️)

**Purpose**: How do deployment sectors and harm types intersect? Where is AI causing the most concentrated damage?

**Design choices**:
- **Heatmap** — Chosen because it's the most efficient way to show the intersection of two categorical dimensions. Darker cells = more incidents. Immediately reveals concentrations (e.g., "Information & Communication" × "Malicious Actors" is the densest cell).
- **Sorted by totals** — Both axes are sorted by descending total count so the most important categories appear first.
- **Marginal bar charts** — Horizontal bars on each side show the row/column totals, providing ranked context that the heatmap alone doesn't convey.
- **Minimum count filter** — Slider to hide sparse cells. Default is 2 to remove noise while keeping meaningful intersections visible.
- **Truncated labels** — Long taxonomy names are truncated to 35 characters to prevent axis label overflow.

### 5. Landing Page (🏠)

**Purpose**: Overview, key metrics, and navigation entry point.

**Design choices**:
- **Narrative insight** — A blockquote stating "65% occurred since 2023" gives immediate analytical takeaway before any interaction.
- **Sparkline area chart** — Small, un-annotated area chart showing the growth curve. Chosen to create visual interest and convey the "exponential growth" story at a glance.
- **Global word cloud** — d3-cloud of all incident terms as a visual hook. Gives visitors an immediate sense of what the dataset contains.
- **Navigation cards** — Four cards linking to each visualization page, with one-line descriptions.

---

## Cross-Page Design Patterns

| Pattern | Timeline | Network | Topics | Heatmap |
|---------|----------|---------|--------|---------|
| Harm type filter | Taxonomy tabs (MIT/GMF/CSET) | Dropdown | Dropdown | — |
| Year range filter | Number inputs | — | Number inputs | — |
| Word cloud | Period-specific | — | Per-topic | — |
| Stacked area chart | By taxonomy category | — | By topic | — |
| Entity stats | — | Top deployers + harmed bars | Top entities per topic | — |
| Growth metrics | — | — | ±% badges on cards | — |

---

## Key Findings

- **65% of all documented AI incidents occurred since 2023**, driven by generative AI proliferation
- **12 distinct harm themes** emerge from NLP clustering, ranging from autonomous vehicle crashes to deepfake-enabled political disinformation
- **OpenAI, Google, Meta, and Tesla** are the most frequently appearing entities in the incident network
- The fastest-growing themes are AI-powered scams (+340%), chatbot harms, and AI-generated CSAM
- **8 natural community clusters** emerge from the entity network: Big Tech, Surveillance/Policing, Students/Minors, LLM Ecosystem, Generative AI, Education, Workplace, Cybercrime
- "Malicious Actors & Misuse" is the dominant risk category (34% of classified incidents), followed by "AI System Safety" (23%)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Charts | Plotly.js via react-plotly.js |
| Word Clouds | d3-cloud (Archimedean spiral layout) |
| NLP Pipeline | Python, BERTopic, sentence-transformers (all-MiniLM-L6-v2), UMAP, HDBSCAN |
| Network Analysis | NetworkX (community detection, role-biased layout) |
| Data | Static JSON (pre-computed from Python pipeline) |
| Deployment | Vercel |

## Architecture

```
[Python Pipeline]                         [Next.js Frontend]

AI Incident DB ──► BERTopic ──────────►  public/data/incidents.json  ──► React Pages
(1,491 incidents)  (12 topics, UMAP 2D)  public/data/topics.json         (Plotly + d3)
                   NetworkX              public/data/network.json
                   (communities, layout) public/data/timeline.json
                   Pandas                public/data/heatmap.json
                   (aggregations)
```

The Python pipeline (`run_bertopic_pipeline.py`) runs offline to produce pre-computed JSON files. The frontend is a fully static Next.js app that loads these files at runtime — no API server, no database, no authentication needed. This makes deployment trivial (push to Vercel) and ensures the app loads fast.

## Data Source

AI Incident Database: https://incidentdatabase.ai/

> McGregor, S. (2021). Preventing Repeated Real World AI Failures by Cataloging Incidents: The AI Incident Database. *Proceedings of the Thirty-Third Annual Conference on Innovative Applications of Artificial Intelligence (IAAI-21)*.

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Regenerating the Data

The pre-computed JSON files are included in `public/data/`. To regenerate them (e.g., with updated incident data or different BERTopic parameters):

```bash
cd ../ai-harm-landscape
source .venv/bin/activate
python run_bertopic_pipeline.py
# Then copy outputs to the web project:
cp data/processed/incidents.json ../ai-harm-landscape-web/public/data/
cp data/processed/topic_model_results.json ../ai-harm-landscape-web/public/data/topics.json
cp data/processed/network_data.json ../ai-harm-landscape-web/public/data/network.json
cp data/processed/timeline_data.json ../ai-harm-landscape-web/public/data/timeline.json
cp data/processed/heatmap_data.json ../ai-harm-landscape-web/public/data/heatmap.json
```

## Sustainability

This project supports sustainable AI governance by making systemic failure patterns visible. Understanding where and how AI causes harm enables proactive prevention — reducing societal costs and building public trust in the AI technologies needed for sustainability goals (autonomous transport, smart energy, climate modeling). Specifically:

- Identifying repeat-offender organizations enables targeted regulatory intervention
- Temporal trend analysis reveals whether existing governance frameworks are working
- Topic clustering surfaces emerging harm categories before they become widespread
- Cross-referencing taxonomies (MIT, GMF, CSET) provides multi-perspective accountability

## Authors

CSEN 377 Data Visualization — Santa Clara University, Spring 2026
