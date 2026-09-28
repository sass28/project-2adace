import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";

const tick = { fill: "var(--muted-foreground)", fontSize: 11 };
const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function GlassTooltip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-4 rounded-xl px-3 py-2 text-xs">
      <p className="mb-1 text-muted-foreground">{typeof label === "number" ? fmtTime(label) : label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 font-medium">
          <span className="size-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="num">{Math.round(p.value)}{unit}</span>
        </p>
      ))}
    </div>
  );
}

export interface Series { key: string; name: string; color: string }

export function AreaSeries({ data, series, height = 240, unit = " W", xKey = "t" }: { data: any[]; series: Series[]; height?: number; unit?: string; xKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={false} tickFormatter={(v) => (typeof v === "number" ? fmtTime(v) : v)} minTickGap={40} />
        <YAxis tick={tick} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<GlassTooltip unit={unit} />} cursor={{ stroke: "var(--border)" }} />
        {series.map((s) => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#g-${s.key})`} animationDuration={700} isAnimationActive />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineSeries({ data, series, height = 200, unit = "", domain }: { data: any[]; series: Series[]; height?: number; unit?: string; domain?: [number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="t" tick={tick} tickLine={false} axisLine={false} tickFormatter={fmtTime} minTickGap={40} />
        <YAxis tick={tick} tickLine={false} axisLine={false} width={48} {...(domain ? { domain } : {})} />
        <Tooltip content={<GlassTooltip unit={unit} />} />
        {series.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} animationDuration={700} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({ data, series, height = 220, unit = "", xKey = "name" }: { data: any[]; series: Series[]; height?: number; unit?: string; xKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={false} />
        <YAxis tick={tick} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<GlassTooltip unit={unit} />} cursor={{ fill: "var(--border)" }} />
        {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[8, 8, 2, 2]} maxBarSize={36} animationDuration={700} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChartPanel({ title, meta, children, className }: { title: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass-2 rounded-3xl p-5 md:p-6 ${className ?? ""}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
      </div>
      {children}
    </section>
  );
}
