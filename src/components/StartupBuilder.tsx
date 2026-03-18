"use client";
import { useState, useEffect, useRef, useCallback, useReducer } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  bg: "#07090D",
  panel: "#0D1017",
  card: "#111620",
  cardHover: "#161C2A",
  border: "#1A2030",
  borderActive: "#2A3450",
  text: "#E2E8F0",
  sub: "#8892A6",
  dim: "#4B5568",
  accent: "#F97316",
  accentMuted: "#C2410C",
  ok: "#10B981",
  info: "#3B82F6",
  warn: "#FBBF24",
  purple: "#A855F7",
  pink: "#EC4899",
  cyan: "#06B6D4",
  red: "#EF4444",
  mono: "'JetBrains Mono','Fira Code',monospace",
  sans: "'Instrument Sans','DM Sans',-apple-system,sans-serif",
  serif: "'Instrument Serif',Georgia,serif",
};

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
const AGENT_DEFS = [
  {
    id: "market_research",
    name: "Market Research",
    short: "MR",
    color: T.info,
    description: "Analyzes market size, competitors, customer segments, trends",
    systemPrompt: (idea, ctx, prev) => `You are an elite market research analyst at a top-tier venture capital firm. Given a startup idea, produce a rigorous market analysis.

STARTUP IDEA: "${idea}"
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ""}

Respond ONLY with a JSON object (no markdown, no backticks, no preamble) with this exact structure:
{
  "summary": "2-3 sentence executive summary of market opportunity",
  "tam": {"value": "$XB", "description": "Total addressable market explanation"},
  "sam": {"value": "$XB", "description": "Serviceable addressable market explanation"},
  "som": {"value": "$XM", "description": "Serviceable obtainable market, year 3 target"},
  "cagr": "X.X%",
  "competitors": [
    {"name": "Competitor 1", "strength": "their key strength", "weakness": "their key weakness", "pricing": "$X/mo"},
    {"name": "Competitor 2", "strength": "...", "weakness": "...", "pricing": "$X/mo"},
    {"name": "Competitor 3", "strength": "...", "weakness": "...", "pricing": "$X/mo"}
  ],
  "customer_segments": [
    {"segment": "Segment name", "size": "X% of market", "pain": "Key pain point", "willingness_to_pay": "$X/mo"},
    {"segment": "Segment 2", "size": "...", "pain": "...", "willingness_to_pay": "$X/mo"}
  ],
  "trends": ["Trend 1 driving growth", "Trend 2", "Trend 3"],
  "risks": ["Risk 1", "Risk 2"],
  "moat_opportunities": ["Potential moat 1", "Potential moat 2"]
}`,
  },
  {
    id: "product_design",
    name: "Product Design",
    short: "PD",
    color: T.purple,
    description: "Architects features, data models, tech stack, MVP scope",
    systemPrompt: (idea, ctx, prev) => `You are a world-class product architect who has designed products at Stripe, Figma, and Linear. Given a startup idea and market research, design the product.

STARTUP IDEA: "${idea}"
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ""}
MARKET RESEARCH: ${JSON.stringify(prev.market_research || "Not available")}

Respond ONLY with a JSON object (no markdown, no backticks, no preamble):
{
  "product_name": "Catchy product name",
  "tagline": "One-line value proposition",
  "core_value_prop": "2-3 sentence description of what this product does and why it matters",
  "features": [
    {"name": "Feature name", "description": "What it does", "priority": "P0", "complexity": "Low|Medium|High", "user_story": "As a [user], I want to [action] so that [benefit]"},
    {"name": "Feature 2", "description": "...", "priority": "P0", "complexity": "...", "user_story": "..."},
    {"name": "Feature 3", "description": "...", "priority": "P1", "complexity": "...", "user_story": "..."},
    {"name": "Feature 4", "description": "...", "priority": "P1", "complexity": "...", "user_story": "..."},
    {"name": "Feature 5", "description": "...", "priority": "P2", "complexity": "...", "user_story": "..."},
    {"name": "Feature 6", "description": "...", "priority": "P2", "complexity": "...", "user_story": "..."}
  ],
  "tech_stack": {
    "frontend": "Recommended frontend technologies",
    "backend": "Recommended backend technologies",
    "database": "Recommended databases",
    "infrastructure": "Recommended cloud/infra",
    "ai_ml": "Any AI/ML components needed",
    "integrations": "Key third-party integrations"
  },
  "data_model": [
    {"entity": "Entity name", "key_fields": "field1, field2, field3", "relationships": "relates to X"},
    {"entity": "Entity 2", "key_fields": "...", "relationships": "..."}
  ],
  "mvp_scope": "What to build in the first 8 weeks - be specific",
  "success_metrics": ["Metric 1 with target", "Metric 2 with target", "Metric 3 with target"]
}`,
  },
  {
    id: "ui_designer",
    name: "UI/UX Designer",
    short: "UI",
    color: T.pink,
    description: "Designs interface system, pages, components, interactions",
    systemPrompt: (idea, ctx, prev) => `You are a senior UI/UX designer who has worked at Apple and Airbnb. Given a product spec, design the interface system.

STARTUP IDEA: "${idea}"
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ""}
PRODUCT SPEC: ${JSON.stringify(prev.product_design || "Not available")}

Respond ONLY with a JSON object (no markdown, no backticks, no preamble):
{
  "design_system": {
    "name": "Design system name",
    "philosophy": "2-sentence design philosophy",
    "primary_color": "#hexcode",
    "secondary_color": "#hexcode",
    "accent_color": "#hexcode",
    "bg_color": "#hexcode",
    "font_heading": "Font name for headings",
    "font_body": "Font name for body text",
    "border_radius": "Xpx",
    "tone": "Warm|Cool|Neutral|Bold|Playful"
  },
  "pages": [
    {"name": "Page name", "purpose": "What this page does", "key_components": ["Component 1", "Component 2"], "layout": "Description of layout approach"},
    {"name": "Page 2", "purpose": "...", "key_components": ["..."], "layout": "..."}
  ],
  "key_interactions": [
    {"interaction": "Interaction name", "trigger": "What triggers it", "response": "What happens", "delight_factor": "What makes it special"}
  ],
  "component_library": [
    {"component": "Component name", "variants": "List of variants", "usage": "When to use it"}
  ],
  "accessibility": ["Accessibility consideration 1", "Consideration 2"],
  "mobile_strategy": "How the product adapts to mobile"
}`,
  },
  {
    id: "backend_dev",
    name: "Backend Architect",
    short: "BE",
    color: T.ok,
    description: "Architects services, APIs, databases, infrastructure",
    systemPrompt: (idea, ctx, prev) => `You are a principal backend engineer who has built systems at scale at Stripe and Cloudflare. Architect the backend.

STARTUP IDEA: "${idea}"
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ""}
PRODUCT SPEC: ${JSON.stringify(prev.product_design || "Not available")}

Respond ONLY with a JSON object (no markdown, no backticks, no preamble):
{
  "architecture_pattern": "Monolith|Microservices|Modular Monolith|Serverless",
  "architecture_rationale": "Why this pattern for this stage",
  "services": [
    {"name": "Service name", "responsibility": "What it handles", "technology": "Tech stack", "api_endpoints": ["POST /api/v1/...", "GET /api/v1/..."]},
    {"name": "Service 2", "responsibility": "...", "technology": "...", "api_endpoints": ["..."]}
  ],
  "database_design": [
    {"database": "Database name", "type": "PostgreSQL|Redis|etc", "purpose": "What data it stores", "key_tables": ["table1", "table2"]}
  ],
  "api_design": {
    "style": "REST|GraphQL|gRPC|Hybrid",
    "auth": "Authentication strategy",
    "rate_limiting": "Rate limiting approach",
    "versioning": "API versioning strategy"
  },
  "infrastructure": {
    "hosting": "Where and how deployed",
    "ci_cd": "CI/CD pipeline description",
    "monitoring": "Monitoring and alerting stack",
    "estimated_monthly_cost": "$X for Y users"
  },
  "security": ["Security measure 1", "Security measure 2", "Security measure 3"],
  "scalability_plan": "How the system scales from 100 to 100K users"
}`,
  },
  {
    id: "marketing",
    name: "Growth Marketing",
    short: "GM",
    color: T.warn,
    description: "Designs GTM strategy, channels, content, launch plan",
    systemPrompt: (idea, ctx, prev) => `You are a Head of Growth who has scaled 3 SaaS companies from $0 to $10M ARR. Design the go-to-market strategy.

STARTUP IDEA: "${idea}"
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ""}
PRODUCT: ${JSON.stringify(prev.product_design || "Not available")}
MARKET: ${JSON.stringify(prev.market_research || "Not available")}

Respond ONLY with a JSON object (no markdown, no backticks, no preamble):
{
  "brand": {
    "positioning": "One-sentence positioning statement",
    "voice": "Brand voice description",
    "key_messages": ["Message 1", "Message 2", "Message 3"]
  },
  "channels": [
    {"channel": "Channel name", "strategy": "How to use this channel", "budget_pct": "X%", "expected_cac": "$X", "timeline": "When to start"}
  ],
  "content_strategy": {
    "blog_topics": ["Topic 1", "Topic 2", "Topic 3"],
    "seo_keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
    "social_strategy": "Social media approach"
  },
  "launch_plan": {
    "pre_launch": ["Action 1 with timeline", "Action 2"],
    "launch_week": ["Action 1", "Action 2"],
    "post_launch": ["Action 1", "Action 2"]
  },
  "metrics": {
    "target_cac": "$X",
    "target_ltv": "$X",
    "ltv_cac_ratio": "X:1",
    "payback_months": 0,
    "month_6_target": "X customers",
    "month_12_target": "X customers"
  },
  "growth_loops": ["Growth loop 1 description", "Growth loop 2 description"],
  "referral_program": "Description of referral/viral mechanism"
}`,
  },
  {
    id: "investor_pitch",
    name: "Investor Pitch",
    short: "IP",
    color: T.accent,
    description: "Creates pitch, financials, unit economics, milestones",
    systemPrompt: (idea, ctx, prev) => `You are a Y Combinator partner who has coached 500+ startups on fundraising. Create the investor pitch using ALL previous agent outputs.

STARTUP IDEA: "${idea}"
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ""}
MARKET: ${JSON.stringify(prev.market_research || "Not available")}
PRODUCT: ${JSON.stringify(prev.product_design || "Not available")}
BACKEND: ${JSON.stringify(prev.backend_dev || "Not available")}
GO-TO-MARKET: ${JSON.stringify(prev.marketing || "Not available")}

Respond ONLY with a JSON object (no markdown, no backticks, no preamble):
{
  "elevator_pitch": "30-second pitch (2-3 sentences)",
  "slides": [
    {"title": "Slide title", "key_point": "The one thing this slide communicates", "talking_points": ["Point 1", "Point 2"]},
    {"title": "Slide 2", "key_point": "...", "talking_points": ["..."]}
  ],
  "financials": {
    "seed_amount": "$X",
    "pre_money_valuation": "$X-$Y range",
    "use_of_funds": [{"category": "Category", "percentage": "X%", "amount": "$X"}],
    "runway_months": 18,
    "arr_projections": {"year1": "$X", "year2": "$X", "year3": "$X"},
    "break_even": "Month X"
  },
  "unit_economics": {
    "arpu": "$X/mo",
    "gross_margin": "X%",
    "cac": "$X",
    "ltv": "$X",
    "ltv_cac_ratio": "X:1",
    "payback_months": 0
  },
  "team_requirements": [
    {"role": "Role title", "why": "Why this role is critical", "hire_timeline": "When to hire"}
  ],
  "milestones_18_months": ["Milestone 1 with timeline", "Milestone 2", "Milestone 3"],
  "investor_faqs": [
    {"question": "Likely investor question", "answer": "Strong answer"},
    {"question": "Question 2", "answer": "Answer 2"}
  ]
}`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════
const mkAgentStates = () => Object.fromEntries(AGENT_DEFS.map(a => [a.id, { status: "idle", output: null, error: null, startedAt: null, finishedAt: null }]));

const initState = {
  phase: "input",
  idea: "",
  context: "",
  mode: "demo",           // demo | api | local
  provider: "claude",     // claude | openai | ollama
  apiKeySet: false,
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.1",
  agentStates: mkAgentStates(),
  logs: [],
  selectedAgent: null,
  selectedTab: "output",
  config: {
    agentsEnabled: Object.fromEntries(AGENT_DEFS.map(a => [a.id, true])),
    model: "claude-sonnet-4-20250514",
  },
  totalTokens: 0,
  totalCost: 0,
};

function reducer(st, act) {
  switch (act.type) {
    case "SET_IDEA": return { ...st, idea: act.v };
    case "SET_CONTEXT": return { ...st, context: act.v };
    case "SET_MODE": return { ...st, mode: act.v, apiKeySet: act.v === "demo" ? true : st.apiKeySet, provider: act.v === "local" ? "ollama" : act.v === "demo" ? "claude" : st.provider };
    case "SET_PROVIDER": return { ...st, provider: act.v, apiKeySet: false };
    case "SET_API_KEY": return { ...st, apiKeySet: true };
    case "SET_OLLAMA": return { ...st, ollamaUrl: act.url ?? st.ollamaUrl, ollamaModel: act.model ?? st.ollamaModel, apiKeySet: true };
    case "SET_CONFIG": return { ...st, config: { ...st.config, ...act.v } };
    case "TOGGLE_AGENT": return { ...st, config: { ...st.config, agentsEnabled: { ...st.config.agentsEnabled, [act.id]: !st.config.agentsEnabled[act.id] } } };
    case "START": return { ...st, phase: "running", logs: [], agentStates: mkAgentStates(), selectedAgent: AGENT_DEFS[0].id, totalTokens: 0, totalCost: 0 };
    case "AGENT_START": return { ...st, selectedAgent: act.id, agentStates: { ...st.agentStates, [act.id]: { ...st.agentStates[act.id], status: "running", startedAt: Date.now() } } };
    case "AGENT_OK": return { ...st, agentStates: { ...st.agentStates, [act.id]: { ...st.agentStates[act.id], status: "complete", output: act.output, finishedAt: Date.now() } }, totalTokens: st.totalTokens + (act.tokens || 0) };
    case "AGENT_ERR": return { ...st, agentStates: { ...st.agentStates, [act.id]: { ...st.agentStates[act.id], status: "error", error: act.error, finishedAt: Date.now() } } };
    case "LOG": return { ...st, logs: [...st.logs, { ...act.log, time: new Date().toLocaleTimeString("en-GB") }] };
    case "DONE": return { ...st, phase: "complete" };
    case "FAIL": return { ...st, phase: "error" };
    case "SELECT": return { ...st, selectedAgent: act.id };
    case "TAB": return { ...st, selectedTab: act.tab };
    case "RESET": return { ...initState, apiKeySet: st.mode === "demo", mode: st.mode, provider: st.provider, idea: st.idea, context: st.context, ollamaUrl: st.ollamaUrl, ollamaModel: st.ollamaModel };
    default: return st;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════════════════════════
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MICRO-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const css = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.border};border-radius:5px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fi{animation:fadeIn .35s ease forwards}
textarea:focus,input:focus,select:focus{border-color:${T.accent}!important;outline:none}

@keyframes launchGlow{
  0%{box-shadow:0 0 15px ${T.accent}20,0 0 30px ${T.accent}10,inset 0 0 20px ${T.accent}08}
  50%{box-shadow:0 0 25px ${T.accent}40,0 0 60px ${T.accent}20,inset 0 0 30px ${T.accent}12}
  100%{box-shadow:0 0 15px ${T.accent}20,0 0 30px ${T.accent}10,inset 0 0 20px ${T.accent}08}
}
@keyframes launchRing{
  0%{transform:scale(1);opacity:.6}
  100%{transform:scale(2.2);opacity:0}
}
@keyframes countPulse{
  0%{transform:scale(1)}
  50%{transform:scale(1.08)}
  100%{transform:scale(1)}
}
@keyframes particleUp{
  0%{transform:translateY(0) scale(1);opacity:1}
  100%{transform:translateY(-60px) scale(0);opacity:0}
}
@keyframes igniteSweep{
  0%{background-position:200% center}
  100%{background-position:-200% center}
}
@keyframes borderRotate{
  to{--angle:360deg}
}
@property --angle{syntax:'<angle>';initial-value:0deg;inherits:false}
.launch-btn{
  position:relative;overflow:visible;cursor:pointer;
  animation:launchGlow 2.5s ease-in-out infinite;
  transition:all .3s cubic-bezier(.4,0,.2,1);
}
.launch-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
.launch-btn:active{transform:translateY(0);filter:brightness(.95)}
.launch-btn.armed{animation:countPulse .6s ease-in-out infinite}
.launch-btn.launching{pointer-events:none}
.launch-ring{
  position:absolute;inset:-4px;border-radius:16px;
  border:2px solid ${T.accent};opacity:0;pointer-events:none;
}
.launch-btn:hover .launch-ring{animation:launchRing 1.2s ease-out infinite}
.launch-particle{
  position:absolute;width:4px;height:4px;border-radius:50%;
  background:${T.accent};pointer-events:none;
  animation:particleUp .8s ease-out forwards;
}
.launch-btn-disabled{
  cursor:not-allowed;opacity:.5;
  animation:none!important;
}
.launch-btn-disabled:hover{transform:none;filter:none}
`;

const Badge = ({ children, color = T.accent }) => (
  <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color,background:color+"12",border:`1px solid ${color}25`,borderRadius:6,whiteSpace:"nowrap" }}>{children}</span>
);

const PBar = ({ pct, color = T.accent }) => (
  <div style={{ width:"100%",height:3,background:T.border,borderRadius:3,overflow:"hidden" }}>
    <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:3,transition:"width .5s ease",boxShadow:`0 0 8px ${color}50` }} />
  </div>
);

const Spin = ({ size = 16, color = T.accent }) => (
  <div style={{ width:size,height:size,border:`2px solid ${T.border}`,borderTopColor:color,borderRadius:"50%",animation:"spin .8s linear infinite",flexShrink:0 }} />
);

// ═══════════════════════════════════════════════════════════════════════════════
// JSON VIEWER — renders structured output beautifully
// ═══════════════════════════════════════════════════════════════════════════════
function JView({ data, depth = 0 }) {
  if (data == null) return <span style={{ color:T.dim,fontStyle:"italic" }}>null</span>;
  if (typeof data === "string") return <span style={{ color:depth > 2 ? T.sub : T.text,fontSize:12,lineHeight:1.6 }}>{data}</span>;
  if (typeof data === "number") return <span style={{ color:T.warn,fontSize:12,fontFamily:T.mono }}>{data}</span>;
  if (typeof data === "boolean") return <span style={{ color:T.purple,fontSize:12,fontFamily:T.mono }}>{String(data)}</span>;

  if (Array.isArray(data)) {
    if (!data.length) return <span style={{ color:T.dim }}>[]</span>;
    if (typeof data[0] === "object" && data[0] !== null) {
      return (
        <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:4 }}>
          {data.map((item, i) => (
            <div key={i} style={{ padding:12,background:depth < 1 ? T.bg : T.panel,border:`1px solid ${T.border}`,borderRadius:8 }}>
              <JView data={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:2 }}>
        {data.map((item, i) => (
          <span key={i} style={{ padding:"3px 10px",background:T.info+"12",border:`1px solid ${T.info}20`,borderRadius:6,fontSize:11,color:T.text }}>{String(item)}</span>
        ))}
      </div>
    );
  }

  if (typeof data === "object") {
    return (
      <div style={{ display:"flex",flexDirection:"column",gap:depth > 1 ? 6 : 14 }}>
        {Object.entries(data).map(([key, val]) => (
          <div key={key}>
            <div style={{ fontSize:11,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:".04em",marginBottom:4 }}>
              {key.replace(/_/g, " ")}
            </div>
            <div style={{ paddingLeft:depth < 2 ? 12 : 0 }}><JView data={val} depth={depth + 1} /></div>
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(data)}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT PHASE
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// LAUNCH BUTTON — Animated multi-stage ignition button
// ═══════════════════════════════════════════════════════════════════════════════
function LaunchButton({ ok, agentCount, onLaunch }) {
  const [stage, setStage] = useState("idle"); // idle | armed | countdown | launching
  const [count, setCount] = useState(3);
  const [particles, setParticles] = useState([]);
  const btnRef = useRef(null);
  const timerRef = useRef(null);

  const spawnParticles = useCallback(() => {
    const newP = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      left: 20 + Math.random() * 60,
      delay: Math.random() * 0.3,
      size: 2 + Math.random() * 4,
    }));
    setParticles(newP);
    setTimeout(() => setParticles([]), 1000);
  }, []);

  const handleClick = useCallback(() => {
    if (!ok) return;

    if (stage === "idle") {
      setStage("armed");
      return;
    }

    if (stage === "armed") {
      setStage("countdown");
      setCount(3);

      let c = 3;
      timerRef.current = setInterval(() => {
        c--;
        setCount(c);
        if (c <= 0) {
          clearInterval(timerRef.current);
          setStage("launching");
          spawnParticles();
          setTimeout(() => {
            onLaunch();
          }, 600);
        }
      }, 600);
      return;
    }
  }, [ok, stage, onLaunch, spawnParticles]);

  // Reset if not ok
  useEffect(() => {
    if (!ok && stage !== "idle") {
      setStage("idle");
      clearInterval(timerRef.current);
    }
  }, [ok, stage]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const isDisabled = !ok;
  const isArmed = stage === "armed";
  const isCounting = stage === "countdown";
  const isLaunching = stage === "launching";

  // Button content by stage
  let label, sublabel;
  if (isDisabled) {
    label = "Enter API key and describe your idea";
    sublabel = null;
  } else if (stage === "idle") {
    label = "Arm Launch Sequence";
    sublabel = `${agentCount} agents ready`;
  } else if (isArmed) {
    label = "Confirm Launch";
    sublabel = "Click again to initiate countdown";
  } else if (isCounting) {
    label = `T-${count}`;
    sublabel = "Ignition sequence started";
  } else if (isLaunching) {
    label = "Launching...";
    sublabel = "Agents deploying";
  }

  return (
    <div style={{ position: "relative", marginTop: 4 }}>
      {/* Status indicators above button */}
      {ok && stage !== "idle" && (
        <div style={{
          display: "flex", justifyContent: "center", gap: 24, marginBottom: 14,
          animation: "fadeIn .3s ease",
        }}>
          {["Systems", "API", "Agents", "Pipeline"].map((sys, i) => {
            const isLit = stage === "armed" ? i < 2 : isCounting ? i < 2 + (3 - count) : true;
            return (
              <div key={sys} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: isLit ? T.ok : T.dim,
                  boxShadow: isLit ? `0 0 8px ${T.ok}` : "none",
                  transition: "all .3s",
                }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: isLit ? T.ok : T.dim, fontFamily: T.mono, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {sys}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* The button */}
      <button
        ref={btnRef}
        onClick={handleClick}
        disabled={isDisabled || isLaunching}
        className={`launch-btn ${isDisabled ? "launch-btn-disabled" : ""} ${isArmed ? "armed" : ""} ${isLaunching ? "launching" : ""}`}
        style={{
          position: "relative",
          width: "100%",
          padding: isCounting ? "24px 24px" : "18px 24px",
          background: isDisabled
            ? T.border
            : isLaunching
              ? `linear-gradient(135deg, ${T.ok}, #059669)`
              : isCounting
                ? `linear-gradient(135deg, #DC2626, ${T.accent})`
                : isArmed
                  ? `linear-gradient(135deg, ${T.accent}, #DC2626)`
                  : `linear-gradient(135deg, ${T.accent}, ${T.accentMuted})`,
          border: isArmed || isCounting
            ? `2px solid ${isCounting ? "#DC2626" : T.accent}`
            : `2px solid ${isDisabled ? T.border : T.accent}40`,
          borderRadius: 14,
          color: "#fff",
          fontFamily: "inherit",
          outline: "none",
          overflow: "visible",
          zIndex: 1,
          transition: "all .3s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Expanding ring on hover */}
        {ok && !isLaunching && <div className="launch-ring" />}

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{
            fontSize: isCounting ? 36 : 15,
            fontWeight: 700,
            fontFamily: isCounting ? T.mono : "inherit",
            letterSpacing: isCounting ? ".15em" : ".04em",
            textTransform: "uppercase",
            lineHeight: 1.2,
            transition: "all .2s",
          }}>
            {label}
          </div>
          {sublabel && (
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              opacity: 0.8,
              marginTop: 4,
              letterSpacing: ".02em",
              fontFamily: T.mono,
            }}>
              {sublabel}
            </div>
          )}
        </div>

        {/* Corner status lights */}
        {ok && !isDisabled && (
          <>
            <div style={{
              position: "absolute", top: 10, left: 12,
              width: 5, height: 5, borderRadius: "50%",
              background: isArmed || isCounting || isLaunching ? T.ok : T.accent,
              boxShadow: `0 0 6px ${isArmed || isCounting ? T.ok : T.accent}`,
              animation: isArmed ? "pulse 1s infinite" : isCounting ? "pulse .4s infinite" : "none",
            }} />
            <div style={{
              position: "absolute", top: 10, right: 12,
              width: 5, height: 5, borderRadius: "50%",
              background: isArmed || isCounting || isLaunching ? T.ok : T.accent,
              boxShadow: `0 0 6px ${isArmed || isCounting ? T.ok : T.accent}`,
              animation: isArmed ? "pulse 1s infinite .2s" : isCounting ? "pulse .4s infinite .1s" : "none",
            }} />
          </>
        )}
      </button>

      {/* Particles on launch */}
      {particles.map(p => (
        <div
          key={p.id}
          className="launch-particle"
          style={{
            left: `${p.left}%`,
            bottom: 0,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Info line */}
      <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: T.dim }}>
        {stage === "idle"
          ? `~${agentCount} API calls | ~2 min | Costs ~$0.10-0.30 depending on model`
          : stage === "armed"
            ? "All systems green. Confirm to begin countdown."
            : isCounting
              ? "Stand by for ignition..."
              : "Deploying agent swarm..."
        }
      </p>
    </div>
  );
}

function InputPhase({ st, d, onGo }) {
  const [key, setKey] = useState("");
  const [showAdv, setShowAdv] = useState(false);
  const [showInfo, setShowInfo] = useState(null); // null | "demo" | "api" | "local"
  const mob = useIsMobile();
  const ok = st.mode === "demo" ? st.apiKeySet : (st.idea.trim().length > 10 && st.apiKeySet);

  const fieldStyle: React.CSSProperties = { width:"100%",padding:mob?"10px 12px":"12px 14px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:mob?12:13,fontFamily:"inherit",resize:"vertical",lineHeight:1.6 };

  const modes = [
    { id: "demo", label: "Demo", icon: "D", desc: "Fixed sample walkthrough", color: T.ok },
    { id: "api", label: "Live API", icon: "A", desc: "Real AI, tailored outputs", color: T.accent },
    { id: "local", label: "Local (Ollama)", icon: "L", desc: "Self-hosted, private", color: T.purple },
  ];

  const InfoTooltip = ({ mode, onClose }) => {
    const content = {
      demo: {
        title: "Demo Mode (Fixed Showcase)",
        color: T.ok,
        body: "Walks through the entire 6-agent pipeline with pre-built sample outputs. Same results every time, regardless of what you type. No API calls, no key, no cost.",
        steps: [
          "Select Demo mode",
          "Optionally type an idea (it won't affect the output)",
          "Hit Launch -- agents simulate with realistic delays",
          "Explore all 6 agent outputs to understand the system",
        ],
        note: "This is purely for demonstration. The outputs are a fixed sample based on a SaaS analytics product. To get outputs tailored to YOUR idea, switch to Live API and use Claude Account (free, no key) or paste your own API key.",
      },
      api: {
        title: "Live API Mode",
        color: T.accent,
        body: "Make real API calls to generate outputs tailored to your exact idea. Three connection options: use your active Claude account (no key needed), bring your own Anthropic key, or use an OpenAI key.",
        steps: [
          "Claude Account: No key needed -- uses your logged-in Claude session. Best option to start.",
          "Anthropic Key: Get a key from console.anthropic.com, paste it. You pay standard API rates.",
          "OpenAI Key: Get a key from platform.openai.com. GPT-4o works but JSON may be less reliable.",
          "Each build costs ~$0.10-0.30 depending on model. Key stored in browser memory only.",
        ],
        note: "Claude Account is the easiest way to get real, tailored outputs without managing API keys. Anthropic Key gives you full control over model selection and usage tracking.",
      },
      local: {
        title: "Local Mode (Ollama)",
        color: T.purple,
        body: "Run agents against a local Ollama instance on your machine. Fully private -- no data leaves your computer. Requires Ollama installed and running.",
        steps: [
          "Install Ollama: curl -fsSL https://ollama.com/install.sh | sh",
          "Pull a model: ollama pull llama3.1",
          "Start Ollama (runs on port 11434 by default)",
          "Enable CORS: OLLAMA_ORIGINS='*' ollama serve",
          "Set the URL and model name below, then launch",
        ],
        note: "Output quality depends on model size. llama3.1 8B is fast but less accurate. mixtral or llama3.1 70B produce better results but need more VRAM. JSON parsing may fail more often with smaller models.",
      },
    };

    const c = content[mode];
    if (!c) return null;

    return (
      <div style={{
        padding: 20, background: T.panel, border: `1px solid ${c.color}30`, borderRadius: 12,
        marginBottom: 12, position: "relative",
      }} className="fi">
        {/* Close button */}
        <div onClick={onClose}
          style={{ position: "absolute", top: 10, right: 12, width: 22, height: 22, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: T.border, cursor: "pointer", fontSize: 12, color: T.sub, fontWeight: 700 }}>
          x
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: c.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: c.color + "20", border: `1px solid ${c.color}35`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: c.color }}>i</div>
          {c.title}
        </div>

        <p style={{ fontSize: 12, color: T.sub, marginBottom: 14, lineHeight: 1.6 }}>{c.body}</p>

        <div style={{ padding: 14, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Setup Steps</div>
          {c.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, background: c.color + "15", border: `1px solid ${c.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: c.color, fontFamily: T.mono, flexShrink: 0, marginTop: 1,
              }}>{i + 1}</div>
              <span style={{ color: T.text, lineHeight: 1.5, fontFamily: mode === "local" && i > 0 && i < 4 ? T.mono : "inherit", fontSize: mode === "local" && i > 0 && i < 4 ? 11 : 12 }}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "10px 12px", background: c.color + "08", border: `1px solid ${c.color}15`, borderRadius: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: c.color, flexShrink: 0, marginTop: 1 }}>NOTE</span>
          <span style={{ fontSize: 11, color: T.sub, lineHeight: 1.5 }}>{c.note}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:mob?16:40,position:"relative" }}>
      <div style={{ position:"absolute",width:500,height:500,background:`radial-gradient(circle,${T.accent}08,transparent 70%)`,top:"5%",left:"30%",pointerEvents:"none" }} />
      <div style={{ position:"absolute",width:400,height:400,background:`radial-gradient(circle,${T.purple}06,transparent 70%)`,bottom:"10%",right:"20%",pointerEvents:"none" }} />

      <div style={{ width:"100%",maxWidth:680,zIndex:1 }}>
        {/* Header */}
        <div style={{ textAlign:"center",marginBottom:mob?28:44 }}>
          <div style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:mob?44:56,height:mob?44:56,borderRadius:mob?10:14,background:`linear-gradient(135deg,${T.accent},${T.accentMuted})`,boxShadow:`0 0 40px ${T.accent}25`,marginBottom:mob?14:20,fontSize:mob?18:24,fontWeight:700,color:"#fff" }}>S</div>
          <h1 style={{ fontFamily:T.serif,fontSize:mob?28:44,fontWeight:400,marginBottom:mob?8:10,lineHeight:1.1,color:T.text }}>Autonomous Startup Builder</h1>
          <p style={{ fontSize:mob?13:15,color:T.sub,maxWidth:520,margin:"0 auto",lineHeight:1.6 }}>
            Describe your startup idea. Six AI agents will research, design, architect, market, and pitch it — powered by Claude, OpenAI, or your local Ollama instance.
          </p>
        </div>

        {/* ══════ MODE SWITCHER ══════ */}
        <div style={{ padding: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, marginBottom: 12, display: "flex", flexDirection: mob ? "column" : "row", gap: 4 }}>
          {modes.map(m => {
            const active = st.mode === m.id;
            return (
              <div key={m.id} style={{ flex: 1, position: "relative" }}>
                <button
                  onClick={() => d({ type: "SET_MODE", v: m.id })}
                  style={{
                    width: "100%", padding: "12px 8px", borderRadius: 10,
                    background: active ? m.color + "18" : "transparent",
                    border: active ? `1px solid ${m.color}35` : `1px solid transparent`,
                    cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: active ? m.color : T.dim,
                      boxShadow: active ? `0 0 6px ${m.color}` : "none",
                      transition: "all .3s",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? m.color : T.sub, transition: "color .2s" }}>{m.label}</span>
                  </div>
                  <span style={{ fontSize: 10, color: active ? T.sub : T.dim }}>{m.desc}</span>
                </button>
                {/* Info icon */}
                <div
                  onClick={(e) => { e.stopPropagation(); setShowInfo(showInfo === m.id ? null : m.id); }}
                  style={{
                    position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%",
                    background: T.border, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 10, fontWeight: 700, color: showInfo === m.id ? m.color : T.dim,
                    border: `1px solid ${showInfo === m.id ? m.color + "40" : T.border}`,
                    transition: "all .2s",
                  }}
                >i</div>
              </div>
            );
          })}
        </div>

        {/* Info Tooltip (expanded) */}
        {showInfo && <InfoTooltip mode={showInfo} onClose={() => setShowInfo(null)} />}

        {/* ══════ DEMO MODE — fixed showcase ══════ */}
        {st.mode === "demo" && (
          <div style={{ padding: 16, background: T.ok + "08", border: `1px solid ${T.ok}20`, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.ok, boxShadow: `0 0 6px ${T.ok}` }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.ok }}>Demo Mode -- Fixed Showcase</span>
            </div>
            <p style={{ fontSize: 11, color: T.sub, lineHeight: 1.5, paddingLeft: 18 }}>
              Runs a pre-built sample walkthrough with the same outputs every time, regardless of input. No API calls, no cost. Just demonstrates how the full 6-agent pipeline works. Switch to <strong style={{ color: T.accent }}>Live API</strong> for real, tailored outputs.
            </p>
          </div>
        )}

        {/* ══════ API MODE — provider select + key input ══════ */}
        {st.mode === "api" && (
          <div style={{ padding: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 12 }}>
            {/* Provider Toggle — 3 options */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[
                { id: "claude_account", label: "Claude Account", sub: "No key needed", color: T.cyan },
                { id: "claude", label: "Anthropic Key", sub: "Your own key", color: T.accent },
                { id: "openai", label: "OpenAI Key", sub: "GPT-4o / 4-turbo", color: T.ok },
              ].map(p => (
                <button key={p.id}
                  onClick={() => {
                    d({ type: "SET_PROVIDER", v: p.id });
                    if (p.id === "claude_account") d({ type: "SET_API_KEY" });
                  }}
                  style={{
                    flex: 1, padding: "10px 10px 8px", borderRadius: 8,
                    background: st.provider === p.id ? p.color + "12" : T.bg,
                    border: `1px solid ${st.provider === p.id ? p.color + "40" : T.border}`,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.provider === p.id ? p.color : T.dim, boxShadow: st.provider === p.id ? `0 0 5px ${p.color}` : "none" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.provider === p.id ? p.color : T.sub }}>{p.label}</span>
                  </div>
                  <span style={{ fontSize: 9, color: T.dim }}>{p.sub}</span>
                </button>
              ))}
            </div>

            {/* Claude Account — no key, uses built-in API */}
            {st.provider === "claude_account" && (
              <div style={{ padding: 14, background: T.cyan + "08", border: `1px solid ${T.cyan}20`, borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.ok, boxShadow: `0 0 6px ${T.ok}`, marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.ok, marginBottom: 4 }}>Connected via Claude Account</div>
                  <p style={{ fontSize: 11, color: T.sub, lineHeight: 1.5 }}>
                    Uses your active Claude session to make API calls. No API key required — this routes through the built-in Anthropic connection. Best option if you don't have a separate API key.
                  </p>
                </div>
              </div>
            )}

            {/* Anthropic Key or OpenAI Key — need key input */}
            {(st.provider === "claude" || st.provider === "openai") && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.apiKeySet ? T.ok : T.red }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                    {st.provider === "claude" ? "Anthropic" : "OpenAI"} API Key
                  </span>
                  {st.apiKeySet && <Badge color={T.ok}>Connected</Badge>}
                </div>
                {!st.apiKeySet ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="password" value={key} onChange={e => setKey(e.target.value)}
                      placeholder={st.provider === "claude" ? "sk-ant-api03-..." : "sk-proj-..."}
                      style={{ ...fieldStyle, fontFamily: T.mono, flex: 1, resize: "none" }} />
                    <button onClick={() => {
                      if (key.length > 10) {
                        if (st.provider === "claude") window.__ANTH_KEY = key;
                        else window.__OPENAI_KEY = key;
                        d({ type: "SET_API_KEY" });
                      }
                    }}
                      disabled={key.length <= 10}
                      style={{ padding: "10px 20px", background: key.length > 10 ? T.accent : T.border, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: key.length > 10 ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                      Connect
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: T.dim }}>Key stored in browser memory only. Sent directly to {st.provider === "claude" ? "Anthropic" : "OpenAI"}'s API.</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════ LOCAL MODE — Ollama config ══════ */}
        {st.mode === "local" && (
          <div style={{ padding: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.apiKeySet ? T.ok : T.warn, boxShadow: `0 0 6px ${st.apiKeySet ? T.ok : T.warn}` }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Ollama Connection</span>
              {st.apiKeySet && <Badge color={T.ok}>Ready</Badge>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 4 }}>Server URL</label>
                <input value={st.ollamaUrl} onChange={e => d({ type: "SET_OLLAMA", url: e.target.value })}
                  placeholder="http://localhost:11434"
                  style={{ ...fieldStyle, padding: "9px 12px", fontSize: 12, fontFamily: T.mono, resize: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 4 }}>Model</label>
                <input value={st.ollamaModel} onChange={e => d({ type: "SET_OLLAMA", model: e.target.value })}
                  placeholder="llama3.1"
                  style={{ ...fieldStyle, padding: "9px 12px", fontSize: 12, fontFamily: T.mono, resize: "none" }} />
              </div>
            </div>

            <button onClick={async () => {
              try {
                const r = await fetch(st.ollamaUrl + "/api/tags");
                if (r.ok) {
                  d({ type: "SET_OLLAMA" });
                  d({ type: "SET_API_KEY" });
                } else throw new Error("Bad response");
              } catch {
                alert("Cannot reach Ollama at " + st.ollamaUrl + ". Make sure Ollama is running with CORS enabled:\n\nOLLAMA_ORIGINS='*' ollama serve");
              }
            }}
              style={{ width: "100%", padding: "10px 16px", background: T.purple + "20", border: `1px solid ${T.purple}30`, borderRadius: 8, color: T.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Test Connection
            </button>

            <div style={{ marginTop: 10, padding: "8px 12px", background: T.warn + "08", border: `1px solid ${T.warn}15`, borderRadius: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.warn }}>NOTE </span>
              <span style={{ fontSize: 10, color: T.sub }}>Smaller models (8B) may produce incomplete or malformed JSON. For best results use mixtral, llama3.1:70b, or qwen2.5:32b.</span>
            </div>
          </div>
        )}

        {/* Idea */}
        <div style={{ padding:20,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:12 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:600,color:T.text,marginBottom:8 }}>
            Your startup idea {st.mode !== "demo" && <span style={{ color: T.red }}>*</span>}
            {st.mode === "demo" && <span style={{ fontWeight:400,color:T.dim,fontSize:11 }}> (optional in demo)</span>}
          </label>
          <textarea value={st.idea} onChange={e => d({type:"SET_IDEA",v:e.target.value})}
            placeholder={st.mode === "demo"
              ? 'Optional -- demo runs the same sample data regardless. Try Live API for tailored outputs.'
              : 'e.g. "Build a SaaS product for restaurant analytics that helps owners track revenue, optimize menus, reduce food waste, and forecast demand using AI"'}
            rows={st.mode === "demo" ? 2 : 4} style={fieldStyle} />
          {st.mode !== "demo" && (
            <span style={{ fontSize:10,color:st.idea.length > 10 ? T.dim : T.red,marginTop:4,display:"block" }}>{st.idea.length} chars {st.idea.length <= 10 && " -- need at least 10"}</span>
          )}
        </div>

        {/* Context */}
        <div style={{ padding:20,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:12 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:600,color:T.text,marginBottom:8 }}>Additional context <span style={{ fontWeight:400,color:T.dim }}>(optional)</span></label>
          <textarea value={st.context} onChange={e => d({type:"SET_CONTEXT",v:e.target.value})}
            placeholder="Target market, competitors to watch, budget, team size, geographic focus, technical constraints..."
            rows={2} style={fieldStyle} />
        </div>

        {/* Agent Config */}
        <div onClick={() => setShowAdv(!showAdv)}
          style={{ padding:"12px 20px",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:12,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span style={{ fontSize:13,fontWeight:600,color:T.text }}>Agent Configuration</span>
          <span style={{ fontSize:20,color:T.dim,transform:showAdv?"rotate(180deg)":"none",transition:"transform .2s" }}>{"\u25BE"}</span>
        </div>

        {showAdv && (
          <div style={{ padding:20,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:12 }} className="fi">
            <p style={{ fontSize:11,color:T.sub,marginBottom:14 }}>Agents run sequentially. Each builds on previous outputs. Toggle off agents you don't need.</p>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {AGENT_DEFS.map(a => (
                <div key={a.id} onClick={() => d({type:"TOGGLE_AGENT",id:a.id})}
                  style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:T.bg,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer" }}>
                  <div style={{ width:18,height:18,borderRadius:4,background:st.config.agentsEnabled[a.id]?a.color:T.border,border:`2px solid ${st.config.agentsEnabled[a.id]?a.color:T.dim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700,flexShrink:0 }}>
                    {st.config.agentsEnabled[a.id] ? "OK" : ""}
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:12,fontWeight:600,color:T.text }}>{a.name}</span>
                    <span style={{ fontSize:11,color:T.dim,marginLeft:8 }}>{a.description}</span>
                  </div>
                  <Badge color={a.color}>{a.short}</Badge>
                </div>
              ))}
            </div>

            <div style={{ marginTop:14 }}>
              <label style={{ fontSize:11,fontWeight:600,color:T.text,display:"block",marginBottom:4 }}>Model</label>
              {st.mode === "local" ? (
                <p style={{ fontSize:11,color:T.dim }}>Model is set in the Ollama Connection panel above ({st.ollamaModel}).</p>
              ) : st.mode === "api" && st.provider === "openai" ? (
                <select value={st.config.model} onChange={e => d({type:"SET_CONFIG",v:{model:e.target.value}})}
                  style={{ ...fieldStyle,padding:"8px 12px",fontSize:12,fontFamily:T.mono,resize:"none" }}>
                  <option value="gpt-4o">GPT-4o (Recommended)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Faster/Cheaper)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              ) : (
                <select value={st.config.model} onChange={e => d({type:"SET_CONFIG",v:{model:e.target.value}})}
                  style={{ ...fieldStyle,padding:"8px 12px",fontSize:12,fontFamily:T.mono,resize:"none" }}>
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Faster/Cheaper)</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* ══════ LAUNCH BUTTON ══════ */}
        <LaunchButton ok={ok} agentCount={AGENT_DEFS.filter(a => st.config.agentsEnabled[a.id]).length} onLaunch={onGo} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERMINAL
// ═══════════════════════════════════════════════════════════════════════════════
function Term({ logs }) {
  const ref = useRef(null);
  useEffect(() => { ref.current && (ref.current.scrollTop = ref.current.scrollHeight) }, [logs]);
  return (
    <div ref={ref} style={{ background:"#060810",border:`1px solid ${T.border}`,borderRadius:10,padding:14,height:"100%",minHeight:200,overflowY:"auto",fontFamily:T.mono,fontSize:11,lineHeight:1.8 }}>
      <div style={{ color:T.dim,marginBottom:6 }}>$ autonomous-startup-builder --mode=production</div>
      {logs.map((l,i) => (
        <div key={i} style={{ display:"flex",gap:8 }}>
          <span style={{ color:T.dim,minWidth:56 }}>{l.time}</span>
          <span style={{ color:l.agentColor||T.dim,minWidth:24,fontWeight:600 }}>[{l.agent}]</span>
          <span style={{ color:l.color||T.sub }}>{l.message}</span>
        </div>
      ))}
      {logs.length > 0 && <span style={{ color:T.accent,animation:"pulse 1s infinite" }}>{">"} _</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTION PHASE
// ═══════════════════════════════════════════════════════════════════════════════
function ExecPhase({ st, d }) {
  const mob = useIsMobile();
  const enabled = AGENT_DEFS.filter(a => st.config.agentsEnabled[a.id]);
  const done = enabled.filter(a => st.agentStates[a.id].status === "complete").length;
  const pct = enabled.length > 0 ? (done / enabled.length) * 100 : 0;
  const sel = AGENT_DEFS.find(a => a.id === st.selectedAgent);
  const selSt = st.selectedAgent ? st.agentStates[st.selectedAgent] : null;

  return (
    <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:mob?"10px 14px":"14px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8 }}>
        <div style={{ display:"flex",alignItems:"center",gap:mob?6:10,minWidth:0,flex:1 }}>
          <div style={{ width:mob?26:30,height:mob?26:30,borderRadius:7,background:`linear-gradient(135deg,${T.accent},${T.accentMuted})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:mob?11:13,fontWeight:700,color:"#fff",flexShrink:0 }}>S</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:mob?12:14,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{mob ? "Startup Builder" : "Autonomous Startup Builder"}</div>
            {!mob && <div style={{ fontSize:10,color:T.dim,maxWidth:350,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{st.idea.slice(0,80)}</div>}
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:mob?4:8,flexShrink:0 }}>
          {st.phase === "running" && <Spin size={mob?12:16} />}
          <Badge color={st.phase === "complete" ? T.ok : st.phase === "error" ? T.red : T.accent}>
            {st.phase === "running" ? `${done}/${enabled.length}` : st.phase === "complete" ? (mob ? "DONE" : "COMPLETE") : "ERROR"}
          </Badge>
          {!mob && st.totalTokens > 0 && <Badge color={T.dim}>{st.totalTokens.toLocaleString()} tokens</Badge>}
          <button onClick={() => d({type:"RESET"})}
            style={{ padding:mob?"5px 10px":"6px 14px",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,color:T.sub,fontSize:mob?10:11,cursor:"pointer",fontFamily:"inherit" }}>
            {mob ? "New" : "New Build"}
          </button>
        </div>
      </div>
      <div style={{ padding:mob?"0 14px":"0 24px",flexShrink:0 }}><PBar pct={pct} /></div>

      {/* ── MOBILE: vertical stack with horizontal agent strip ── */}
      {mob ? (
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          {/* Agent horizontal scroll strip */}
          <div style={{ flexShrink:0,borderBottom:`1px solid ${T.border}`,padding:"8px 10px",overflowX:"auto",display:"flex",gap:6,WebkitOverflowScrolling:"touch" }}>
            {enabled.map((a,i) => {
              const s = st.agentStates[a.id];
              const isSel = st.selectedAgent === a.id;
              const sCol = s.status==="complete"?T.ok:s.status==="running"?a.color:s.status==="error"?T.red:T.dim;
              return (
                <div key={a.id} onClick={() => d({type:"SELECT",id:a.id})}
                  style={{ flexShrink:0,padding:"6px 12px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                    background:isSel?T.cardHover:"transparent",border:`1px solid ${isSel?a.color+"40":T.border}`,transition:"all .15s" }}>
                  <div style={{ width:18,height:18,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",background:sCol+"18",border:`1px solid ${sCol}30`,fontSize:7,fontWeight:700,color:sCol,fontFamily:T.mono,flexShrink:0 }}>
                    {s.status==="complete"?"OK":s.status==="running"?"..":s.status==="error"?"!!":String(i+1).padStart(2,"0")}
                  </div>
                  <span style={{ fontSize:11,fontWeight:600,color:isSel?T.text:T.sub,whiteSpace:"nowrap" }}>{a.short}</span>
                  {s.status === "running" && <Spin size={10} color={a.color} />}
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 10px",flexShrink:0 }}>
            {["output","raw","terminal"].map(tab => (
              <button key={tab} onClick={() => d({type:"TAB",tab})}
                style={{ padding:"8px 12px",fontSize:11,fontWeight:600,fontFamily:"inherit",color:st.selectedTab===tab?T.accent:T.dim,background:"transparent",border:"none",borderBottom:`2px solid ${st.selectedTab===tab?T.accent:"transparent"}`,cursor:"pointer",textTransform:"capitalize" }}>
                {tab === "raw" ? "JSON" : tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1,padding:12,overflowY:"auto" }}>
            {st.selectedTab === "terminal" && <Term logs={st.logs} />}
            {st.selectedTab === "output" && sel && selSt && (
              <div className="fi">
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
                  <div style={{ width:28,height:28,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:sel.color+"18",border:`1px solid ${sel.color}30`,fontSize:11,fontWeight:700,color:sel.color,fontFamily:T.mono }}>{sel.short}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:14,fontWeight:700,color:T.text }}>{sel.name}</div>
                    <div style={{ fontSize:10,color:T.dim }}>{sel.description}</div>
                  </div>
                  <Badge color={selSt.status==="complete"?T.ok:selSt.status==="running"?sel.color:selSt.status==="error"?T.red:T.dim}>{selSt.status}</Badge>
                </div>
                {selSt.status === "running" && (
                  <div style={{ display:"flex",alignItems:"center",gap:10,padding:16,background:T.card,borderRadius:10,border:`1px solid ${T.border}` }}>
                    <Spin size={18} color={sel.color} />
                    <div><div style={{ fontSize:12,color:T.text }}>Thinking...</div><div style={{ fontSize:10,color:T.dim }}>10-30 seconds per agent</div></div>
                  </div>
                )}
                {selSt.status === "error" && (
                  <div style={{ padding:14,background:T.red+"08",border:`1px solid ${T.red}25`,borderRadius:10 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:T.red,marginBottom:6 }}>Error</div>
                    <pre style={{ fontSize:10,color:T.sub,fontFamily:T.mono,whiteSpace:"pre-wrap",wordBreak:"break-all" }}>{selSt.error}</pre>
                  </div>
                )}
                {selSt.status === "complete" && selSt.output && (
                  <div style={{ padding:14,background:T.card,border:`1px solid ${T.border}`,borderRadius:10 }}><JView data={selSt.output} /></div>
                )}
                {selSt.status === "idle" && <div style={{ padding:24,textAlign:"center",color:T.dim,fontSize:12 }}>Queued — waiting for dependencies.</div>}
              </div>
            )}
            {st.selectedTab === "output" && !sel && <div style={{ padding:24,textAlign:"center",color:T.dim,fontSize:12 }}>Select an agent above.</div>}
            {st.selectedTab === "raw" && selSt?.output && (
              <pre style={{ background:"#060810",padding:12,borderRadius:10,border:`1px solid ${T.border}`,overflow:"auto",maxHeight:"60vh",fontFamily:T.mono,fontSize:10,lineHeight:1.6,color:T.sub,whiteSpace:"pre-wrap" }}>{JSON.stringify(selSt.output, null, 2)}</pre>
            )}
            {st.selectedTab === "raw" && !selSt?.output && <div style={{ padding:24,textAlign:"center",color:T.dim,fontSize:12 }}>No output yet.</div>}
          </div>
        </div>
      ) : (
      /* ── DESKTOP: sidebar + main panel grid ── */
      <div style={{ flex:1,display:"grid",gridTemplateColumns:"240px 1fr",overflow:"hidden" }}>
        {/* Sidebar */}
        <div style={{ borderRight:`1px solid ${T.border}`,padding:12,overflowY:"auto",display:"flex",flexDirection:"column",gap:4 }}>
          <div style={{ fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",letterSpacing:".08em",padding:"6px 8px" }}>Agent Pipeline</div>
          {enabled.map((a,i) => {
            const s = st.agentStates[a.id];
            const isSel = st.selectedAgent === a.id;
            const sCol = s.status==="complete"?T.ok:s.status==="running"?a.color:s.status==="error"?T.red:T.dim;
            const sIcon = s.status==="complete"?"OK":s.status==="running"?"..":s.status==="error"?"!!":String(i+1).padStart(2,"0");
            const dur = s.finishedAt && s.startedAt ? ((s.finishedAt-s.startedAt)/1000).toFixed(1)+"s" : "";
            return (
              <div key={a.id} onClick={() => d({type:"SELECT",id:a.id})}
                style={{ padding:"8px 10px",borderRadius:8,cursor:"pointer",background:isSel?T.cardHover:"transparent",border:`1px solid ${isSel?a.color+"40":"transparent"}`,transition:"all .15s" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:24,height:24,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:sCol+"18",border:`1px solid ${sCol}30`,fontSize:8,fontWeight:700,color:sCol,fontFamily:T.mono,flexShrink:0 }}>{sIcon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{a.name}</div>
                    <div style={{ fontSize:10,color:T.dim }}>
                      {s.status==="running"?"Calling API...":s.status==="complete"?`Done ${dur}`:s.status==="error"?"Failed":"Queued"}
                    </div>
                  </div>
                  {s.status === "running" && <Spin size={12} color={a.color} />}
                </div>
              </div>
            );
          })}

          {st.phase === "complete" && (
            <div style={{ marginTop:12,padding:10,background:T.ok+"08",border:`1px solid ${T.ok}20`,borderRadius:8 }}>
              <div style={{ fontSize:10,fontWeight:700,color:T.ok,marginBottom:6 }}>ALL DELIVERABLES READY</div>
              {enabled.filter(a => st.agentStates[a.id].status === "complete").map(a => (
                <div key={a.id} style={{ fontSize:10,color:T.sub,padding:"2px 0",display:"flex",alignItems:"center",gap:5 }}>
                  <span style={{ color:T.ok,fontFamily:T.mono,fontSize:8 }}>OK</span> {a.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main panel */}
        <div style={{ display:"flex",flexDirection:"column",overflow:"hidden" }}>
          {/* Tabs */}
          <div style={{ display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 16px",flexShrink:0 }}>
            {["output","raw","terminal"].map(tab => (
              <button key={tab} onClick={() => d({type:"TAB",tab})}
                style={{ padding:"9px 14px",fontSize:12,fontWeight:600,fontFamily:"inherit",color:st.selectedTab===tab?T.accent:T.dim,background:"transparent",border:"none",borderBottom:`2px solid ${st.selectedTab===tab?T.accent:"transparent"}`,cursor:"pointer",textTransform:"capitalize" }}>
                {tab === "raw" ? "Raw JSON" : tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1,padding:16,overflowY:"auto" }}>
            {st.selectedTab === "terminal" && <Term logs={st.logs} />}

            {st.selectedTab === "output" && sel && selSt && (
              <div className="fi">
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18 }}>
                  <div style={{ width:34,height:34,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:sel.color+"18",border:`1px solid ${sel.color}30`,fontSize:13,fontWeight:700,color:sel.color,fontFamily:T.mono }}>{sel.short}</div>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700,color:T.text }}>{sel.name} Agent</div>
                    <div style={{ fontSize:11,color:T.dim }}>{sel.description}</div>
                  </div>
                  <Badge color={selSt.status==="complete"?T.ok:selSt.status==="running"?sel.color:selSt.status==="error"?T.red:T.dim}>{selSt.status}</Badge>
                </div>

                {selSt.status === "running" && (
                  <div style={{ display:"flex",alignItems:"center",gap:12,padding:24,background:T.card,borderRadius:10,border:`1px solid ${T.border}` }}>
                    <Spin size={20} color={sel.color} />
                    <div>
                      <div style={{ fontSize:13,color:T.text,fontWeight:500 }}>Agent is thinking...</div>
                      <div style={{ fontSize:11,color:T.dim,marginTop:2 }}>Calling Claude API. This typically takes 10-30 seconds per agent.</div>
                    </div>
                  </div>
                )}

                {selSt.status === "error" && (
                  <div style={{ padding:20,background:T.red+"08",border:`1px solid ${T.red}25`,borderRadius:10 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:T.red,marginBottom:8 }}>Agent Error</div>
                    <pre style={{ fontSize:11,color:T.sub,fontFamily:T.mono,whiteSpace:"pre-wrap",wordBreak:"break-all" }}>{selSt.error}</pre>
                  </div>
                )}

                {selSt.status === "complete" && selSt.output && (
                  <div style={{ padding:20,background:T.card,border:`1px solid ${T.border}`,borderRadius:12 }}>
                    <JView data={selSt.output} />
                  </div>
                )}

                {selSt.status === "idle" && (
                  <div style={{ padding:40,textAlign:"center",color:T.dim,fontSize:13 }}>
                    This agent is queued and will run after its dependencies complete.
                  </div>
                )}
              </div>
            )}

            {st.selectedTab === "output" && !sel && (
              <div style={{ padding:40,textAlign:"center",color:T.dim }}>Select an agent from the sidebar.</div>
            )}

            {st.selectedTab === "raw" && selSt?.output && (
              <pre style={{ background:"#060810",padding:16,borderRadius:10,border:`1px solid ${T.border}`,overflow:"auto",maxHeight:"calc(100vh - 200px)",fontFamily:T.mono,fontSize:11,lineHeight:1.7,color:T.sub,whiteSpace:"pre-wrap" }}>
                {JSON.stringify(selSt.output, null, 2)}
              </pre>
            )}
            {st.selectedTab === "raw" && !selSt?.output && (
              <div style={{ padding:40,textAlign:"center",color:T.dim,fontSize:13 }}>No output yet.</div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [st, d] = useReducer(reducer, initState);

  const runPipeline = useCallback(async () => {
    d({ type: "START" });
    const log = (agent, message, color, agentColor) => d({ type: "LOG", log: { agent, message, color, agentColor } });

    log("ORCH", `Pipeline starting: "${st.idea.slice(0, 60) || "(demo showcase)"}..."`, T.accent, T.accent);
    log("ORCH", `Mode: ${st.mode === "demo" ? "DEMO (fixed sample data)" : st.mode} | Provider: ${st.mode === "local" ? "ollama/" + st.ollamaModel : st.mode === "demo" ? "none" : st.provider} | Agents: ${AGENT_DEFS.filter(a => st.config.agentsEnabled[a.id]).length}`, T.text, T.accent);

    const enabled = AGENT_DEFS.filter(a => st.config.agentsEnabled[a.id]);
    const outputs = {};

    for (let i = 0; i < enabled.length; i++) {
      const agent = enabled[i];
      d({ type: "AGENT_START", id: agent.id });
      log(agent.short, `Spawned: ${agent.name}`, agent.color, agent.color);

      try {
        const prompt = agent.systemPrompt(st.idea, st.context, outputs);
        let text = "";
        let inTok = 0, outTok = 0;

        // ─── DEMO MODE: offline simulation, no API calls ────────────
        if (st.mode === "demo") {
          log(agent.short, "Loading sample data (demo mode)...", T.sub, agent.color);
          await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

          const demoOutputs = {
            market_research: {
              summary: `The market for "${st.idea.slice(0,50)}" represents a significant opportunity. The sector is experiencing rapid digital transformation with increasing demand for data-driven solutions. Early movers with AI-native platforms can capture meaningful market share before incumbents adapt.`,
              tam: { value: "$8.5B", description: "Total addressable market across all verticals and geographies for this solution category" },
              sam: { value: "$2.1B", description: "Serviceable market focusing on SMB and mid-market segments in English-speaking markets" },
              som: { value: "$24M", description: "Realistic year-3 capture assuming 1.1% SAM penetration with focused GTM" },
              cagr: "16.4%",
              competitors: [
                { name: "Incumbent Leader A", strength: "Brand recognition and existing customer base", weakness: "Legacy architecture, slow to adopt AI", pricing: "$350/mo" },
                { name: "VC-Backed Startup B", strength: "Strong engineering team, modern stack", weakness: "Narrow feature set, high burn rate", pricing: "$199/mo" },
                { name: "Enterprise Player C", strength: "Deep integrations, enterprise sales team", weakness: "Complex pricing, poor SMB experience", pricing: "$500+/mo" }
              ],
              customer_segments: [
                { segment: "Small businesses (1-10 employees)", size: "62% of market", pain: "Cannot afford enterprise tools, rely on spreadsheets", willingness_to_pay: "$49-99/mo" },
                { segment: "Mid-market (11-200 employees)", size: "28% of market", pain: "Outgrowing basic tools, need automation", willingness_to_pay: "$199-499/mo" },
                { segment: "Enterprise (200+ employees)", size: "10% of market", pain: "Need custom integrations, compliance, SLAs", willingness_to_pay: "$800-2000/mo" }
              ],
              trends: ["AI/ML becoming table stakes for analytics products", "Shift from on-premise to cloud-native SaaS", "Growing demand for real-time insights over batch reporting", "API-first platforms winning over monolithic suites"],
              risks: ["Large incumbents adding AI features", "Economic downturn reducing software budgets", "Data privacy regulations increasing compliance costs"],
              moat_opportunities: ["Proprietary data flywheel from aggregated insights", "Network effects through community benchmarking", "Deep integration ecosystem creating switching costs"]
            },
            product_design: {
              product_name: "InsightForge",
              tagline: "Turn raw data into decisions in seconds",
              core_value_prop: `InsightForge is an AI-powered analytics platform that connects to your existing tools, automatically surfaces actionable insights, and helps teams make data-driven decisions without needing a data science team. Built for the specific needs identified in "${st.idea.slice(0,40)}".`,
              features: [
                { name: "AI Insight Engine", description: "Automatically detects patterns, anomalies, and trends across all connected data sources", priority: "P0", complexity: "High", user_story: "As a business owner, I want to see AI-generated insights so that I can make faster decisions" },
                { name: "Real-Time Dashboard", description: "Customizable dashboard with live KPIs, charts, and alerting", priority: "P0", complexity: "Medium", user_story: "As a manager, I want to see live metrics so that I can react to changes immediately" },
                { name: "Predictive Forecasting", description: "ML-powered forecasting for key business metrics", priority: "P0", complexity: "High", user_story: "As an operator, I want to predict future trends so that I can plan resources ahead" },
                { name: "One-Click Integrations", description: "Connect to 20+ popular tools via pre-built connectors", priority: "P1", complexity: "Medium", user_story: "As a user, I want to connect my tools easily so that data flows automatically" },
                { name: "Automated Reports", description: "Scheduled PDF/email reports with natural language summaries", priority: "P1", complexity: "Low", user_story: "As a stakeholder, I want weekly reports so that I stay informed without logging in" },
                { name: "Team Collaboration", description: "Shared dashboards, annotations, and action item tracking", priority: "P2", complexity: "Medium", user_story: "As a team lead, I want to share insights so that everyone is aligned on priorities" }
              ],
              tech_stack: { frontend: "Next.js 15, React 19, TailwindCSS, Recharts", backend: "FastAPI (Python 3.12), Celery, Redis", database: "PostgreSQL 16, ClickHouse (analytics), Redis (cache)", infrastructure: "Docker, Kubernetes, Hetzner Cloud, Vercel (frontend)", ai_ml: "Prophet, XGBoost, LangChain, Claude API for NL insights", integrations: "Stripe, OAuth2, Webhooks, REST API connectors" },
              data_model: [
                { entity: "Organization", key_fields: "id, name, plan, settings", relationships: "has many Users, DataSources, Dashboards" },
                { entity: "DataSource", key_fields: "id, type, credentials, sync_status", relationships: "belongs to Organization, has many DataPoints" },
                { entity: "Dashboard", key_fields: "id, name, layout, widgets", relationships: "belongs to Organization, has many Widgets" },
                { entity: "Insight", key_fields: "id, type, severity, description, data_ref", relationships: "belongs to Organization, references DataPoints" }
              ],
              mvp_scope: "Core dashboard with 3 integrations, basic AI insights, and a single predictive model. 8-week build targeting 20 beta users.",
              success_metrics: ["50 paying customers within 6 months of launch", "Net Promoter Score above 50", "Monthly recurring revenue of $15K by month 6"]
            },
            ui_designer: {
              design_system: { name: "Forge UI", philosophy: "Data density meets visual clarity. Every pixel serves insight delivery with warm, confident aesthetics.", primary_color: "#F97316", secondary_color: "#3B82F6", accent_color: "#10B981", bg_color: "#0A0F1A", font_heading: "Cal Sans", font_body: "DM Sans", border_radius: "10px", tone: "Bold" },
              pages: [
                { name: "Dashboard", purpose: "Primary workspace showing KPIs, charts, and AI insights", key_components: ["KPI Cards", "Chart Grid", "Insight Feed", "Date Picker"], layout: "Sidebar navigation + header with main content grid" },
                { name: "Integrations Hub", purpose: "Connect and manage data sources", key_components: ["Integration Cards", "Setup Wizard", "Sync Status"], layout: "Card grid with modal setup flows" },
                { name: "Insights Explorer", purpose: "Deep-dive into AI-generated insights with drill-down", key_components: ["Insight Cards", "Trend Charts", "Filter Panel"], layout: "Masonry feed with expandable detail panels" },
                { name: "Settings", purpose: "Team management, billing, preferences", key_components: ["Tab Navigation", "Forms", "Plan Selector"], layout: "Vertical tabs with content area" }
              ],
              key_interactions: [
                { interaction: "Insight Reveal", trigger: "New AI insight detected", response: "Card slides in with subtle glow, severity-coded border", delight_factor: "Typewriter animation on insight text" },
                { interaction: "Dashboard Drag", trigger: "User drags a widget", response: "Smooth reflow with ghost preview and snap-to-grid", delight_factor: "Haptic-style bounce on drop" }
              ],
              component_library: [
                { component: "KPI Card", variants: "Default, Trending Up, Trending Down, Alert", usage: "Dashboard header row for key metrics" },
                { component: "Chart Widget", variants: "Line, Bar, Pie, Heatmap, Sparkline", usage: "Main dashboard visualization containers" },
                { component: "Insight Card", variants: "Info, Warning, Opportunity, Anomaly", usage: "AI insight feed items" }
              ],
              accessibility: ["WCAG 2.1 AA compliance", "Keyboard navigation for all interactions", "Screen reader labels on all charts", "High contrast mode toggle"],
              mobile_strategy: "Responsive dashboard with stacked card layout. Critical KPIs and insights prioritized. Native-feel swipe gestures for navigation."
            },
            backend_dev: {
              architecture_pattern: "Modular Monolith",
              architecture_rationale: "A modular monolith provides the simplicity of a single deployment while maintaining clear boundaries between domains. This enables rapid iteration at seed stage while preserving the option to extract microservices later as scale demands.",
              services: [
                { name: "Core API", responsibility: "Authentication, authorization, organization management, user CRUD", technology: "FastAPI + SQLAlchemy + PostgreSQL", api_endpoints: ["POST /api/v1/auth/login", "GET /api/v1/users/me", "PUT /api/v1/org/settings"] },
                { name: "Data Ingestion", responsibility: "Connector management, data sync, transformation pipeline", technology: "Celery workers + Redis + ClickHouse", api_endpoints: ["POST /api/v1/sources", "GET /api/v1/sources/:id/status", "POST /api/v1/sources/:id/sync"] },
                { name: "Analytics Engine", responsibility: "Query execution, aggregations, dashboard data serving", technology: "ClickHouse + Redis cache", api_endpoints: ["POST /api/v1/query", "GET /api/v1/dashboards/:id/data"] },
                { name: "AI Service", responsibility: "Insight generation, forecasting, anomaly detection", technology: "Prophet + XGBoost + LangChain", api_endpoints: ["GET /api/v1/insights", "POST /api/v1/forecast"] }
              ],
              database_design: [
                { database: "PostgreSQL 16", type: "PostgreSQL", purpose: "Application state: users, orgs, settings, integrations", key_tables: ["users", "organizations", "data_sources", "dashboards"] },
                { database: "ClickHouse", type: "ClickHouse", purpose: "Analytics data: time-series metrics, aggregations", key_tables: ["events", "metrics_hourly", "metrics_daily"] },
                { database: "Redis", type: "Redis", purpose: "Cache, job queue, real-time session data", key_tables: ["cache:*", "queue:*", "ws:*"] }
              ],
              api_design: { style: "REST with WebSocket for real-time", auth: "JWT + API keys for integrations, Clerk for user auth", rate_limiting: "Token bucket per org, 100 req/min standard, 1000/min enterprise", versioning: "URL-based /api/v1/ with sunset headers" },
              infrastructure: { hosting: "Docker containers on Hetzner Cloud (CX31), Vercel for frontend", ci_cd: "GitHub Actions: lint > test > build > deploy on merge to main", monitoring: "Prometheus + Grafana for infra, Sentry for errors, PostHog for product analytics", estimated_monthly_cost: "$120/mo for 500 users, scaling to $800/mo at 10K users" },
              security: ["Row-level security (RLS) in PostgreSQL for tenant isolation", "AES-256 encryption for stored credentials", "OWASP Top 10 protections, rate limiting, input validation", "SOC 2 Type I readiness within 12 months"],
              scalability_plan: "Horizontal scaling via Docker Swarm at 1K users. Migration to Kubernetes at 5K users. ClickHouse sharding at 10K users. Potential microservice extraction of AI service at 20K+ users."
            },
            marketing: {
              brand: { positioning: "The AI-powered analytics platform that gives every team enterprise-grade insights without the enterprise price tag", voice: "Confident, clear, and slightly playful. We demystify data without dumbing it down.", key_messages: ["See what your data is trying to tell you", "Enterprise insights, startup simplicity", "From raw data to smart decisions in 60 seconds"] },
              channels: [
                { channel: "Content Marketing / SEO", strategy: "Long-tail blog content targeting problem-aware keywords, comparison pages, how-to guides", budget_pct: "30%", expected_cac: "$120", timeline: "Month 1, compound over 6-12 months" },
                { channel: "Product-Led Growth", strategy: "Free tier with usage limits, in-app upgrade prompts, shareable dashboards as viral loops", budget_pct: "20%", expected_cac: "$40", timeline: "From launch" },
                { channel: "LinkedIn Outbound", strategy: "Targeted outreach to ops managers and founders in ICP verticals", budget_pct: "25%", expected_cac: "$200", timeline: "Month 2" },
                { channel: "Partnerships", strategy: "Integration marketplace listings, co-marketing with complementary tools", budget_pct: "15%", expected_cac: "$80", timeline: "Month 4" },
                { channel: "Paid Search / Social", strategy: "Google Ads on high-intent keywords, LinkedIn Ads for enterprise leads", budget_pct: "10%", expected_cac: "$250", timeline: "Month 3, scale with revenue" }
              ],
              content_strategy: { blog_topics: ["How to build a data-driven culture without a data team", "5 metrics every [industry] business should track daily", "Why spreadsheets are killing your growth"], seo_keywords: ["business analytics software", "AI analytics platform", "automated reporting tool", "small business dashboard", "real-time KPI tracking"], social_strategy: "LinkedIn-first: weekly thought leadership posts, customer spotlights, data storytelling. Twitter/X for product updates and developer community." },
              launch_plan: { pre_launch: ["Build waitlist landing page (Month -2)", "Run beta program with 30 users (Month -1)", "Create 10 launch blog posts and case studies"], launch_week: ["Product Hunt launch (Tuesday)", "Email sequence to full waitlist", "LinkedIn + Twitter announcement campaign", "Founder AMAs in relevant communities"], post_launch: ["Weekly customer success check-ins", "Monthly product update emails", "Quarterly business review webinars"] },
              metrics: { target_cac: "$150", target_ltv: "$4,200", ltv_cac_ratio: "28:1", payback_months: 3, month_6_target: "200 customers", month_12_target: "800 customers" },
              growth_loops: ["Shareable dashboard links drive organic discovery from stakeholders who receive reports", "Integration marketplace listings create inbound from partner ecosystems"],
              referral_program: "Give $50 credit, get $50 credit. Tiered rewards: 3 referrals = free month, 10 referrals = lifetime 20% discount. Tracked via unique referral links in-app."
            },
            investor_pitch: {
              elevator_pitch: `We're building the analytics layer that lets any business make AI-powered decisions without a data team. Our platform connects to existing tools, automatically generates insights, and has already validated demand with 340 waitlist signups and 28 LOIs from our target market.`,
              slides: [
                { title: "The Problem", key_point: "Businesses are drowning in data but starving for insights", talking_points: ["87% of SMBs make decisions on gut instinct", "Average business uses 12+ tools generating data silos"] },
                { title: "The Solution", key_point: "AI-native analytics that works out of the box", talking_points: ["One-click integrations", "AI insights without prompt engineering", "Predictions, not just reports"] },
                { title: "Market Opportunity", key_point: "$8.5B TAM growing at 16.4% CAGR", talking_points: ["Analytics sub-segment fastest growing in category", "Only 13% of businesses satisfied with current tools"] },
                { title: "Product Demo", key_point: "Live dashboard showing real customer value", talking_points: ["60-second time to first insight", "AI surfaces what humans miss"] },
                { title: "Business Model", key_point: "SaaS subscription with strong unit economics", talking_points: ["$49-$799/mo tiered pricing", "82% gross margin", "LTV:CAC of 28:1"] },
                { title: "Traction", key_point: "Early signals of product-market fit", talking_points: ["340 waitlist signups", "28 signed LOIs", "NPS 72 from beta users"] },
                { title: "Go-To-Market", key_point: "Product-led growth with enterprise expansion", talking_points: ["Free tier drives adoption", "Content + SEO for compounding growth"] },
                { title: "Team", key_point: "Operators who've done this before", talking_points: ["Prior exits in SaaS", "Deep domain expertise"] },
                { title: "The Ask", key_point: "$1.5M seed to reach Series A milestones", talking_points: ["18-month runway", "Path to $4M ARR"] }
              ],
              financials: { seed_amount: "$1.5M", pre_money_valuation: "$10M-$15M range", use_of_funds: [{ category: "Engineering & Product", percentage: "45%", amount: "$675K" }, { category: "Sales & Marketing", percentage: "25%", amount: "$375K" }, { category: "AI/ML Development", percentage: "20%", amount: "$300K" }, { category: "Operations", percentage: "10%", amount: "$150K" }], runway_months: 18, arr_projections: { year1: "$850K", year2: "$4.2M", year3: "$12.8M" }, break_even: "Month 28" },
              unit_economics: { arpu: "$210/mo", gross_margin: "82%", cac: "$150", ltv: "$4,200", ltv_cac_ratio: "28:1", payback_months: 3 },
              team_requirements: [
                { role: "Senior Full-Stack Engineer", why: "Build core product and integrations at speed", hire_timeline: "Month 1-2" },
                { role: "ML Engineer", why: "Build and maintain AI insight and forecasting models", hire_timeline: "Month 2-3" },
                { role: "Head of Growth", why: "Own GTM execution, content, and paid acquisition", hire_timeline: "Month 3-4" },
                { role: "Customer Success Lead", why: "Drive onboarding, retention, and expansion revenue", hire_timeline: "Month 5-6" }
              ],
              milestones_18_months: ["Month 3: Public launch with 5 integrations and AI insights", "Month 6: 200 paying customers, $15K MRR", "Month 12: 800 customers, $170K MRR, Series A ready", "Month 18: $350K MRR, positive unit economics, international expansion"],
              investor_faqs: [
                { question: "Why now?", answer: "AI costs dropped 90% in 2 years, making AI-native analytics feasible at SMB price points for the first time. The window to build the category-defining platform is 18-24 months." },
                { question: "What's your moat?", answer: "Data flywheel: every customer's data improves our models for all customers. Plus deep integration ecosystem creates high switching costs." },
                { question: "How do you handle competition from incumbents?", answer: "Incumbents are adding AI as a feature. We're building AI as the foundation. Different architecture, different speed, different economics." }
              ]
            }
          };

          const output = demoOutputs[agent.id];
          if (output) {
            outputs[agent.id] = output;
            d({ type: "AGENT_OK", id: agent.id, output, tokens: 0 });
            log(agent.short, `${agent.name} completed [OK] (demo)`, T.ok, agent.color);
          } else {
            throw new Error("No demo data for this agent");
          }
          continue;

        // ─── LIVE API: Claude Account (built-in artifact API) ───────
        } else if (st.mode === "api" && st.provider === "claude_account") {
          log(agent.short, "Calling Claude via account connection...", T.sub, agent.color);

          const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 4000,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (!resp.ok) { const e = await resp.text(); throw new Error(`API ${resp.status}: ${e.slice(0, 200)}`); }
          const data = await resp.json();
          text = data.content?.map(c => c.text || "").join("") || "";
          inTok = data.usage?.input_tokens || 0;
          outTok = data.usage?.output_tokens || 0;

        // ─── LIVE API: Anthropic Key ────────────────────────────────
        } else if (st.mode === "api" && st.provider === "claude") {
          log(agent.short, "Calling Anthropic API (your key)...", T.sub, agent.color);

          const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": window.__ANTH_KEY,
              "anthropic-version": "2023-06-01",
              "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
              model: st.config.model,
              max_tokens: 4000,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (!resp.ok) { const e = await resp.text(); throw new Error(`API ${resp.status}: ${e.slice(0, 200)}`); }
          const data = await resp.json();
          text = data.content?.map(c => c.text || "").join("") || "";
          inTok = data.usage?.input_tokens || 0;
          outTok = data.usage?.output_tokens || 0;

        // ─── API MODE: OpenAI ───────────────────────────────────────
        } else if (st.mode === "api" && st.provider === "openai") {
          log(agent.short, "Calling OpenAI API...", T.sub, agent.color);

          const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${window.__OPENAI_KEY}`,
            },
            body: JSON.stringify({
              model: st.config.model || "gpt-4o",
              max_tokens: 4000,
              messages: [
                { role: "system", content: "You are a precise JSON generator. Always respond with valid JSON only, no markdown fences, no preamble." },
                { role: "user", content: prompt },
              ],
            }),
          });

          if (!resp.ok) { const e = await resp.text(); throw new Error(`API ${resp.status}: ${e.slice(0, 200)}`); }
          const data = await resp.json();
          text = data.choices?.[0]?.message?.content || "";
          inTok = data.usage?.prompt_tokens || 0;
          outTok = data.usage?.completion_tokens || 0;

        // ─── LOCAL MODE: Ollama ─────────────────────────────────────
        } else if (st.mode === "local") {
          log(agent.short, `Calling Ollama (${st.ollamaModel})...`, T.sub, agent.color);

          const resp = await fetch(st.ollamaUrl + "/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: st.ollamaModel,
              messages: [
                { role: "system", content: "You are a precise JSON generator. Always respond with valid JSON only, no markdown, no explanation, no backticks." },
                { role: "user", content: prompt },
              ],
              stream: false,
              options: { temperature: 0.3, num_predict: 4000 },
            }),
          });

          if (!resp.ok) { const e = await resp.text(); throw new Error(`Ollama ${resp.status}: ${e.slice(0, 200)}`); }
          const data = await resp.json();
          text = data.message?.content || "";
          inTok = data.prompt_eval_count || 0;
          outTok = data.eval_count || 0;

        } else {
          throw new Error("Unknown mode/provider configuration");
        }

        log(agent.short, `Response: ${text.length} chars | ${inTok}+${outTok} tokens`, T.sub, agent.color);

        const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        let parsed;
        try {
          parsed = JSON.parse(clean);
        } catch {
          const m = clean.match(/\{[\s\S]*\}/);
          if (m) parsed = JSON.parse(m[0]);
          else throw new Error("Could not parse JSON from response");
        }

        outputs[agent.id] = parsed;
        d({ type: "AGENT_OK", id: agent.id, output: parsed, tokens: inTok + outTok });
        log(agent.short, `${agent.name} completed [OK]`, T.ok, agent.color);
      } catch (err) {
        d({ type: "AGENT_ERR", id: agent.id, error: err.message });
        log(agent.short, `ERROR: ${err.message}`, T.red, agent.color);
        log("ORCH", `${agent.name} failed, continuing...`, T.warn, T.accent);
      }
    }

    const okCount = Object.keys(outputs).length;
    if (okCount > 0) {
      d({ type: "DONE" });
      log("ORCH", `Pipeline complete. ${okCount}/${enabled.length} agents succeeded.`, T.ok, T.accent);
    } else {
      d({ type: "FAIL" });
      log("ORCH", "Pipeline failed -- no agents completed.", T.red, T.accent);
    }
  }, [st.idea, st.context, st.config, st.mode, st.provider, st.ollamaUrl, st.ollamaModel]);

  return (
    <div style={{ minHeight:"100vh",background:T.bg,color:T.text,fontFamily:T.sans }}>
      <style>{css}</style>
      {st.phase === "input" && <InputPhase st={st} d={d} onGo={runPipeline} />}
      {st.phase !== "input" && <ExecPhase st={st} d={d} />}
    </div>
  );
}
