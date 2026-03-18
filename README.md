# Autonomous Startup Builder

**Multi-Agent AI Platform for End-to-End Startup Generation**

> Describe a startup idea. Six autonomous AI agents will research the market, design the product, architect the backend, plan the go-to-market strategy, and build your investor pitch — all orchestrated through a single command.

Built by **Oke Iyanuoluwa Enoch** — Independent Robotics & AI Engineer | MSc Robotics & Automation, University of Salford

---

## Overview

The Autonomous Startup Builder is a multi-agent orchestration platform that takes a natural language startup description and runs it through a pipeline of six specialized AI agents, each building on the outputs of the previous agents. The system supports three execution modes:

| Mode | API Calls | Key Required | Output |
|------|-----------|-------------|--------|
| **Demo** | None | No | Fixed sample walkthrough — same every time |
| **Live API** | Real | Optional* | Tailored to your exact idea |
| **Local (Ollama)** | Local | No | Private, self-hosted inference |

*Live API offers Claude Account (no key), Anthropic Key, or OpenAI Key.

### Agent Pipeline

```
User Input
    │
    ▼
┌─────────────────────────┐
│  1. Market Research      │ ──▶  TAM/SAM/SOM, competitors, segments, trends
│  2. Product Design       │ ──▶  Features, tech stack, data model, MVP scope
│  3. UI/UX Designer       │ ──▶  Design system, pages, components, interactions
│  4. Backend Architect    │ ──▶  Services, APIs, databases, infrastructure
│  5. Growth Marketing     │ ──▶  GTM strategy, channels, launch plan, metrics
│  6. Investor Pitch       │ ──▶  Pitch deck, financials, unit economics, FAQs
└─────────────────────────┘
    │
    ▼
Structured JSON Outputs (viewable + raw export)
```

Each agent receives the accumulated context from all previous agents, enabling coherent end-to-end generation where the pitch references actual product features backed by real market data.

---

## Features

- **3 Execution Modes** — Demo (offline fixed sample), Live API (Claude/OpenAI/Claude Account), Local (Ollama)
- **6 Specialized Agents** — Market Research, Product Design, UI/UX, Backend Architecture, Growth Marketing, Investor Pitch
- **Sequential Context Passing** — Each agent builds on all previous outputs
- **Fault-Tolerant Pipeline** — Failed agents are skipped; pipeline continues
- **Structured JSON Output** — Rich visual renderer with recursive object/array display + raw JSON tab
- **Live Terminal** — Real-time logs with timestamps, token counts, and agent status
- **Agent Configuration** — Toggle individual agents on/off, select model per provider
- **Multi-Stage Launch Button** — Arm → Confirm → T-3 Countdown → Ignition with particle effects
- **Claude Account Linking** — Use your active Claude session without a separate API key
- **Ollama Support** — Self-hosted local inference with connection testing and model selection
- **Info Tooltips** — Each mode has a detailed setup guide accessible via `(i)` icon

---

## Quick Start

### Deploy to Vercel (Recommended)

```bash
# 1. Clone or download this repo
git clone https://github.com/YOUR_USERNAME/autonomous-startup-builder.git
cd autonomous-startup-builder

# 2. Install dependencies
npm install

# 3. Deploy
npx vercel --prod
```

Or via the Vercel dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import this GitHub repository
3. Vercel auto-detects Next.js — click **Deploy**
4. Live at `https://your-project.vercel.app`

### Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

---

## Usage Guide

### Demo Mode
Select the **Demo** tab and launch. Runs all 6 agents with pre-built sample data and realistic delays. Same output every time regardless of input — purely for demonstrating the system.

### Live API Mode
Select the **Live API** tab. Three provider options:

| Provider | Setup | Best For |
|----------|-------|----------|
| **Claude Account** | No key needed — uses built-in connection | Easiest option, real tailored outputs |
| **Anthropic Key** | Paste `sk-ant-...` from [console.anthropic.com](https://console.anthropic.com) | Full control, model selection (Sonnet 4 / Haiku 4.5) |
| **OpenAI Key** | Paste `sk-proj-...` from [platform.openai.com](https://platform.openai.com) | GPT-4o, GPT-4o-mini, GPT-4 Turbo |

### Local Mode (Ollama)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (pick one)
ollama pull llama3.1          # 8B — fast, basic quality
ollama pull mixtral            # Better JSON reliability
ollama pull qwen2.5:32b       # Best local quality (needs 20GB+ VRAM)

# Start with CORS enabled (required for browser access)
OLLAMA_ORIGINS='*' ollama serve
```

In the app: set URL to `http://localhost:11434`, enter model name, click **Test Connection**, then launch.

---

## Architecture

```
autonomous-startup-builder/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── globals.css          # Fonts, resets, scrollbar
│   │   ├── layout.tsx           # Root layout, SEO metadata, Open Graph
│   │   └── page.tsx             # Entry point → StartupBuilder
│   └── components/
│       └── StartupBuilder.tsx   # Main application (~1500 lines)
│           ├── State (useReducer)
│           ├── 6 Agent Definitions (system prompts + JSON schemas)
│           ├── API Router (Claude / OpenAI / Ollama / Demo)
│           ├── Demo Data (pre-built sample outputs)
│           ├── InputPhase (mode switcher, provider config, idea input)
│           ├── LaunchButton (animated multi-stage ignition)
│           ├── ExecutionPhase (sidebar, output viewer, terminal)
│           └── JsonViewer (recursive structured renderer)
├── package.json                 # Next.js 15 + React 19
├── tsconfig.json                # TypeScript config
├── next.config.js               # Next.js config
├── vercel.json                  # Vercel deployment config
├── .gitignore
├── LICENSE                      # MIT
└── README.md
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, CSS-in-JS (inline styles) |
| State | useReducer with typed action dispatch |
| API Routing | Anthropic Messages, OpenAI Chat Completions, Ollama REST |
| Typography | Instrument Sans + Serif, JetBrains Mono |
| Deployment | Vercel (zero-config) |

---

## How It Works

### Agent System Prompts
Each agent has a carefully engineered system prompt that:
1. Assigns an expert persona (e.g., "elite market research analyst at a top-tier VC firm")
2. Provides the user's startup idea + optional context
3. Injects accumulated outputs from all previous agents as JSON
4. Requests a strict JSON schema as the only response format
5. Includes field-level structure definitions for reliable parsing

### Pipeline Execution
```
for each enabled agent (sequential):
  1. Build prompt = persona + idea + context + previous outputs
  2. Route API call based on mode (demo/claude/openai/ollama)
  3. Parse JSON response (with fallback regex extraction)
  4. Store output → pass to next agent
  5. On error → log, skip, continue pipeline
```

### Fault Tolerance
If an agent returns malformed JSON or the API call fails, the error is logged in the terminal, the agent is marked as failed, and the pipeline continues to the next agent with whatever context is available.

---

## Inspiration

Architecture patterns inspired by:
- [RuFlo](https://github.com/ruvnet/ruflo) — Multi-agent swarm orchestration framework for Claude
- Hierarchical agent topologies with shared memory and sequential context passing
- Event-driven pipelines with fault-tolerant execution

---

## Project Context

This project demonstrates expertise in:
- **Multi-agent AI systems** — Autonomous orchestration of specialized LLM agents with context chaining
- **Full-stack engineering** — Next.js App Router, React 19, multi-provider API integration
- **Product design** — End-to-end UX from input to structured output visualization
- **API architecture** — Multi-provider routing (Anthropic, OpenAI, Ollama) with graceful degradation

Developed as an independent project by **Oke Iyanuoluwa Enoch** — MSc Robotics and Automation, University of Salford, Manchester, UK.

---

## License

MIT — see [LICENSE](./LICENSE).
