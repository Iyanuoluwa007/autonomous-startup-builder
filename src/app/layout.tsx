import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autonomous Startup Builder | Multi-Agent AI Platform",
  description:
    "6 autonomous AI agents research the market, design the product, architect the backend, plan marketing, and build your investor pitch. Powered by Claude, OpenAI, or local Ollama.",
  keywords: [
    "autonomous agents",
    "startup builder",
    "AI orchestration",
    "multi-agent system",
    "Claude API",
    "OpenAI",
    "Ollama",
    "SaaS generator",
  ],
  authors: [{ name: "Oke Iyanuoluwa Enoch" }],
  openGraph: {
    title: "Autonomous Startup Builder",
    description:
      "Describe a startup idea. 6 AI agents build it — market research, product design, backend architecture, marketing strategy, and investor pitch.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
