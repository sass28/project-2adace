import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Sun, BatteryMedium, Clock, UserRound, Gauge } from "lucide-react";
import { seo } from "@/lib/seo";
import { useEnergy } from "@/lib/energy/store";
import { Chip, LoadIcon, PageHeader, Ring, Bar } from "@/components/nexora/primitives";
import { priorityColor, LoadDrawer } from "@/components/nexora/Loads";
import { ChartPanel, LineSeries } from "@/components/nexora/Charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/priorities")({
  head: () => seo("AI Priorities", "How the machine-learning model ranks each load, with confidence and plain-language explanations."),
  component: Priorities,
});

function factors(p: number, soc: number, solar: number, pref: string) {
  return [
    { icon: UserRound, label: "Your preference & habits", w: pref === "PREFER ON" ? 34 : pref === "PREFER OFF" ? 8 : Math.round(p * 0.3) },
    { icon: Clock, label: "Time-of-day usage pattern", w: Math.round(p * 0.25) },
    { icon: Sun, label: "Solar availability", w: Math.round(Math.min(25, solar / 140)) },
    { icon: BatteryMedium, label: "Battery reserve", w: Math.round(soc / 6) },
    { icon: Gauge, label: "Power draw (lower is cheaper)", w: Math.round(20 - p * 0.08) },
  ];
}

function Priorities() {
  const loads = useEnergy((s) => [...s.loads].sort((a, b) => b.priority - a.priority));
  const t = useEnergy((s) => s.telemetry);
  const model = useEnergy((s) => s.model);
  const [sel, setSel] = useState(loads[0]?.id);
  const [open, setOpen] = useState<string | null>(null);
  const cur = loads.find((l) => l.id === sel) ?? loads[0];

  return (
    <div>
      <PageHeader
        eyebrow={`Model ${model.active} · ${model.inferenceMs} ms`}
        title="AI Priorities"
        description="Priority is a 0–100 score. When energy is short, the lowest-ranked loads are shed first. The ESP32 always has the final say."
        action={<Chip tone="ai" className={cn(model.state !== "IDLE" && "text-ai")}>{model.state === "INFERRING" ? "Inferring now" : model.state === "RETRAINING" ? "Retraining" : "Model ready"}</Chip>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <ol className="space-y-2">
          {loads.map((l, i) => (
            <li key={l.id}>
              <button onClick={() => setSel(l.id)} className={cn("glass-2 lift flex w-full items-center gap-4 rounded-3xl p-4 text-left", sel === l.id && "glass-3 ring-1 ring-ai/30")}>
                <span className="w-5 text-center text-xs text-muted-foreground num">{i + 1}</span>
                <LoadIcon kind={l.kind} className="size-5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.name}</p>
                  <Bar className="mt-2" value={l.priority} color={priorityColor(l.priority)} />
                </div>
                <div className="text-right"><p className="text-2xl font-semibold num">{l.priority}</p><p className="text-[11px] text-muted-foreground">{l.confidence}% conf.</p></div>
              </button>
            </li>
          ))}
        </ol>
        {cur && (
          <div className="glass-3 sticky top-24 self-start rounded-[32px] p-6 md:p-8" style={{ boxShadow: "0 30px 80px -40px var(--ai), inset 0 1px 0 var(--glass-edge)" }}>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ai"><Brain className="size-4" /> Decision explanation</p>
            <div className="mt-5 flex items-center gap-5">
              <Ring value={cur.priority} size={96} stroke={7} color={priorityColor(cur.priority)}><span className="text-3xl font-semibold num">{cur.priority}</span></Ring>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{cur.name}</h2>
                <p className="mt-1 text-lg">{cur.decision}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><Chip>{cur.learning}</Chip><Chip>{cur.origin}</Chip><Chip>{cur.confidence}% confident</Chip></div>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed">{cur.reason}</p>
            <h3 className="mt-6 text-sm font-semibold">What influenced this score</h3>
            <ul className="mt-3 space-y-3">
              {factors(cur.priority, t.batterySoc, t.solarW, cur.preference).map((f) => (
                <li key={f.label} className="flex items-center gap-3 text-sm">
                  <f.icon className="size-4 text-muted-foreground" />
                  <span className="flex-1">{f.label}</span>
                  <div className="w-28"><Bar value={f.w * 3} color="var(--ai)" /></div>
                  <span className="w-8 text-right text-xs num text-muted-foreground">+{f.w}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] text-muted-foreground">Factor weights are an approximate breakdown of the model output for readability.</p>
            <ChartPanel title="Priority over time" className="mt-6 !bg-transparent !p-0 !shadow-none !border-0">
              <LineSeries data={cur.history} series={[{ key: "priority", name: "Priority", color: "var(--ai)" }]} height={150} domain={[0, 100]} />
            </ChartPanel>
            <button onClick={() => setOpen(cur.id)} className="glass-btn mt-4 w-full rounded-full py-2.5 text-sm font-medium">Give feedback on this decision</button>
          </div>
        )}
      </div>
      <LoadDrawer loadId={open} onClose={() => setOpen(null)} />
    </div>
  );
}
