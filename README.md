# AI Harm Landscape

**Interactive Visual Analytics of Real-World AI Failures**

A data visualization tool that explores patterns, trends, and relationships in 1,491 documented AI incidents (1983–2026) from the [AI Incident Database](https://incidentdatabase.ai/). Built as a final project for CSEN 377 Data Visualization at Santa Clara University.

## What This Project Does

AI systems increasingly cause real-world harm — from self-driving car fatalities to facial recognition misidentification to deepfake scams. This project applies **NLP-powered topic modeling** (BERTopic with sentence-transformers) to discover latent themes in incident descriptions, then presents the results through four interactive visualizations:

1. **Timeline** — Stacked area chart showing incident growth over time by harm category (MIT AI Risk Taxonomy). Highlights the exponential surge after 2022 driven by generative AI.

2. **Entity Network** — Graph connecting organizations (deployers/developers) that co-appear in AI incidents. Reveals which companies are repeat actors and how they cluster.

3. **Topic Explorer** — UMAP scatter plot of all incidents colored by 12 auto-discovered themes (e.g., "Autonomous Vehicles," "Facial Recognition & Surveillance," "AI-Powered Scams"). Click a theme to see its keywords and representative incidents.

4. **Harm Matrix** — Heatmap showing the intersection of risk categories and AI technologies, revealing where specific types of AI cause the most concentrated harm.

## Key Findings

- **65% of all documented AI incidents occurred since 2023**, driven by generative AI proliferation
- **12 distinct harm themes** emerge from NLP clustering, ranging from autonomous vehicle crashes to deepfake-enabled political disinformation
- **Tesla, Meta, Google, and OpenAI** are the most frequently appearing entities in the incident network
- The fastest-growing categories are AI-powered scams, chatbot harms, and AI-generated CSAM

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Visualization | Plotly.js via react-plotly.js |
| NLP Pipeline | Python, BERTopic, sentence-transformers (all-MiniLM-L6-v2), UMAP, HDBSCAN |
| Data | Static JSON (pre-computed from Python pipeline) |
| Deployment | Vercel |

## Architecture

```
[Python Pipeline]                    [Next.js Frontend]
                                     
AI Incident DB  ──►  BERTopic  ──►  public/data/*.json  ──►  React Pages
(1,491 incidents)    (12 topics)     (static assets)          (Plotly charts)
                     UMAP 2D
                     NetworkX
```

The Python pipeline runs offline to produce pre-computed JSON files. The frontend is a static Next.js app that loads these JSON files at runtime — no server or API needed.

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
cp data/processed/*.json ../ai-harm-landscape-web/public/data/
```

## Sustainability

This project supports sustainable AI governance by making systemic failure patterns visible. Understanding where and how AI causes harm enables proactive prevention — reducing societal costs and building public trust in the AI technologies needed for sustainability goals (autonomous transport, smart energy, climate modeling).

## Authors

CSEN 377 Data Visualization — Santa Clara University, Spring 2026
