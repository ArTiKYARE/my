"use client";

import { useEffect, useState } from "react";

const terminalLines = [
  { text: "$ kos-ko init your-project", type: "command" },
  { text: "→ analyzing requirements...", type: "output" },
  { text: "→ designing interface...", type: "output" },
  { text: "→ writing clean code...", type: "output" },
  { text: "$ deploying", type: "command" },
];

export default function HeroBackground() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex >= terminalLines.length) return;

    const line = terminalLines[lineIndex];
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex <= line.text.length) {
        setCurrentLine(line.text.slice(0, charIndex));
        charIndex++;
        setTimeout(typeChar, line.type === "command" ? 45 : 18);
      } else {
        setVisibleLines((prev) => [...prev, line.text]);
        setCurrentLine("");
        setTimeout(() => setLineIndex((i) => i + 1), line.type === "command" ? 600 : 250);
      }
    };

    typeChar();
  }, [lineIndex]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft gradient glows */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[100px]" />

      {/* Floating particles */}
      <div className="particle particle-1 absolute w-1.5 h-1.5 rounded-full bg-primary/40 blur-[1px]" />
      <div className="particle particle-2 absolute w-1 h-1 rounded-full bg-white/30 blur-[1px]" />
      <div className="particle particle-3 absolute w-2 h-2 rounded-full bg-primary/30 blur-[2px]" />
      <div className="particle particle-4 absolute w-1 h-1 rounded-full bg-white/20 blur-[1px]" />

      {/* Floating code snippets */}
      <div className="absolute top-20 right-[10%] hidden md:block">
        <div className="code-float code-float-1 font-mono text-xs text-muted/30 whitespace-pre leading-relaxed">
          {`const project = {
  idea: "yours",
  stack: "modern",
  result: "business"
};`}
        </div>
      </div>

      <div className="absolute bottom-32 right-[15%] hidden lg:block">
        <div className="code-float code-float-2 font-mono text-xs text-muted/25 whitespace-pre leading-relaxed">
          {`<Hero>
  <Title />
  <CTA />
</Hero>`}
        </div>
      </div>

      <div className="absolute top-40 left-[8%] hidden lg:block">
        <div className="code-float code-float-3 font-mono text-[10px] text-muted/20 whitespace-pre leading-relaxed">
          {`npm run build
✓ 312 modules
✓ optimized
✓ ready in 1.2s`}
        </div>
      </div>

      {/* Terminal window */}
      <div className="absolute bottom-24 left-[5%] hidden xl:block">
        <div className="terminal-window w-80 border border-border bg-surface/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-auto text-[10px] text-muted/50 font-mono">bash</span>
          </div>
          <div className="p-4 font-mono text-xs text-muted/60 leading-relaxed min-h-[140px]">
            {visibleLines.map((line, i) => (
              <p key={i} className={line.startsWith("→") ? "text-muted/40" : ""}>
                {line}
              </p>
            ))}
            {lineIndex < terminalLines.length && (
              <p className="mt-0.5">
                {currentLine}
                <span className="terminal-cursor inline-block w-2 h-4 bg-primary/80 align-middle ml-0.5" />
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
