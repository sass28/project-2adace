import { useEffect, useRef, useState, type ReactNode, type HTMLAttributes } from "react";
import { Fan, Lightbulb, Sparkles, Droplets, Plug, Refrigerator, Router } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoadKind } from "@/lib/energy/types";

export function Glass({ level = 2, className, children, ...rest }: { level?: 1 | 2 | 3 | 4 } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`glass-${level}`, "rounded-3xl", className)} {...rest}>
      {children}
    </div>
  );
}

export function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const dur = 700;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(a + (value - a) * e);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value]);
  return <span className={cn("num", className)}>{display.toFixed(decimals)}</span>;
}

export function Power({ w, className, unitClass }: { w: number; className?: string; unitClass?: string }) {
  const kw = Math.abs(w) >= 1000;
  return (
    <span className={className}>
      <AnimatedNumber value={kw ? w / 1000 : w} decimals={kw ? 2 : 1} />
      <span className={cn("ml-1 text-[0.45em] font-medium text-muted-foreground", unitClass)}>{kw ? "kW" : "W"}</span>
    </span>
  );
}

const toneMap = {
  solar: "bg-solar", battery: "bg-battery", grid: "bg-grid", ai: "bg-ai", load: "bg-load",
  healthy: "bg-healthy", warning: "bg-warning", critical: "bg-critical", offline: "bg-offline",
} as const;
export type Tone = keyof typeof toneMap;

export function StatusDot({ tone, pulse = true, className }: { tone: Tone; pulse?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2", className)} aria-hidden>
      {pulse && <span className={cn("absolute inset-0 rounded-full opacity-60 pulse-dot", toneMap[tone])} />}
      <span className={cn("relative size-2 rounded-full", toneMap[tone])} />
    </span>
  );
}

export function Chip({ children, tone, className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("glass-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground", className)}>
      {tone && <StatusDot tone={tone} pulse={false} />}
      {children}
    </span>
  );
}

export function Ring({ value, size = 56, stroke = 5, color = "var(--ai)", children, label }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(value)} of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, Math.max(0, value)) / 100)}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.2,0.8,0.2,1)", filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color = "var(--ai)", className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, transition: "width 0.9s cubic-bezier(0.2,0.8,0.2,1)" }} />
    </div>
  );
}

const icons: Record<LoadKind, typeof Fan> = { fan: Fan, led: Lightbulb, decor: Sparkles, pump: Droplets, socket: Plug, fridge: Refrigerator, router: Router };
export function LoadIcon({ kind, className }: { kind: LoadKind; className?: string }) {
  const I = icons[kind] ?? Plug;
  return <I className={className} strokeWidth={1.6} />;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="rise-in mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-[40px]">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function GlassButton({ className, tone, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ai" | "critical" | "primary" }) {
  return (
    <button
      className={cn(
        "glass-btn inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50",
        tone === "ai" && "text-ai",
        tone === "critical" && "text-critical",
        tone === "primary" && "!bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function timeAgo(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function Stat({ label, children, sub, className }: { label: string; children: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-2xl font-semibold num">{children}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
