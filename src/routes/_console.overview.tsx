import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Brain, ShieldCheck, Thermometer } from "lucide-react";
import { seo } from "@/lib/seo";
import { useEnergy } from "@/lib/energy/store";
import { EnergyFlow } from "@/components/nexora/EnergyFlow";
import { AnimatedNumber, Power, Ring, Stat, StatusDot, Bar, timeAgo } from "@/components/nexora/primitives";
import { AreaSeries, ChartPanel } from "@/components/nexora/Charts";
import { LoadCard, LoadDrawer } from "@/components/nexora/Loads";

export const Route = createFileRoute("/_console/overview")({
  head: () => seo("Overview", "Real-time solar, battery, grid and load overview with AI energy decisions."),
  component: Overview,
});

function Overview() {
  const t = useEnergy((s) => s.telemetry);
  const loads = useEnergy((s) => s.loads);
  const history = useEnergy((s) => s.history);
  const model = useEnergy((s) => s.model);
  const alerts = useEnergy((s) => s.alerts.filter((a) => !a.dismissed).slice(0, 3));
  const [open, setOpen] = useState<string | null>(null);
  const net = t.solarW - t.loadW;
  const top = [...loads].sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
        <div className="rise-in flex flex-col justify-between py-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Home system · now</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-[52px]">
              {net >= 0 ? "Running on sunlight." : t.gridW > 0 ? "Grid is supporting." : "Battery is carrying the home."}
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {net >= 0
                ? `Solar covers every load with ${(net / 1000).toFixed(2)} kW to spare — surplus is charging the battery.`
                : `Demand exceeds solar by ${(Math.abs(net) / 1000).toFixed(2)} kW. Low-priority loads are shed first.`}
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 xl:grid-cols-2">
            <Stat label="Solar"><Power w={t.solarW} className="text-4xl md:text-5xl" /></Stat>
            <Stat label="Consumption"><Power w={t.loadW} className="text-4xl md:text-5xl" /></Stat>
            <Stat label="Battery" sub={`${t.batteryV} V · ${t.batteryW > 0 ? "charging" : "discharging"}`}><span className="text-4xl md:text-5xl"><AnimatedNumber value={t.batterySoc} /><span className="text-lg text-muted-foreground">%</span></span></Stat>
            <Stat label="Generated today"><span className="text-4xl md:text-5xl"><AnimatedNumber value={t.solarTodayKWh} decimals={2} /><span className="ml-1 text-lg text-muted-foreground">kWh</span></span></Stat>
          </div>
        </div>
        <div className="glass-2 rise-in relative rounded-[32px] p-3 md:p-6" style={{ animationDelay: "80ms" }}>
          <EnergyFlow />
        </div>
      </section>

      {/* Modules */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-2 lift rounded-3xl p-5" style={{ boxShadow: "0 20px 50px -30px var(--battery), inset 0 1px 0 var(--glass-edge)" }}>
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">Battery</p><span className="flex items-center gap-1 text-xs text-muted-foreground"><Thermometer className="size-3.5" />{t.batteryTempC}°C</span></div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-24 w-12 overflow-hidden rounded-xl border-2 border-foreground/15 p-1" aria-label={`Battery ${Math.round(t.batterySoc)}%`}>
              <div className="absolute inset-x-1 bottom-1 rounded-md bg-battery transition-all duration-1000" style={{ height: `calc(${t.batterySoc}% - 8px)`, boxShadow: "0 0 20px var(--battery)" }} />
            </div>
            <div><p className="text-3xl font-semibold num"><AnimatedNumber value={t.batterySoc} />%</p><p className="text-xs text-muted-foreground"><Power w={Math.abs(t.batteryW)} /> {t.batteryW >= 0 ? "in" : "out"}</p><p className="text-xs text-muted-foreground">{t.batteryV} V</p></div>
          </div>
        </div>
        <div className="glass-2 lift rounded-3xl p-5" style={{ boxShadow: "0 20px 50px -30px var(--solar), inset 0 1px 0 var(--glass-edge)" }}>
          <p className="text-sm font-semibold">Solar array</p>
          <p className="mt-4 text-3xl font-semibold"><Power w={t.solarW} /></p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Voltage <b className="text-foreground num">{t.solarV} V</b></span><span>Current <b className="text-foreground num">{t.solarA} A</b></span></div>
          <Bar className="mt-3" value={(t.solarW / 3400) * 100} color="var(--solar)" />
          <p className="mt-1.5 text-[11px] text-muted-foreground">{Math.round((t.solarW / 3400) * 100)}% of array peak</p>
        </div>
        <div className="glass-2 lift rounded-3xl p-5" style={{ boxShadow: "0 20px 50px -30px var(--grid), inset 0 1px 0 var(--glass-edge)" }}>
          <p className="flex items-center justify-between text-sm font-semibold">Grid <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground"><StatusDot tone={t.gridAvailable ? "grid" : "offline"} />{t.gridAvailable ? "Available" : "Offline"}</span></p>
          <p className="mt-4 text-3xl font-semibold"><Power w={t.gridW} /></p>
          <p className="mt-2 text-xs text-muted-foreground">{t.gridW > 0 ? "Supplementing demand" : "Standby — not importing"} · {t.gridV} V</p>
        </div>
        <Link to="/models" className="glass-2 lift sheen rounded-3xl p-5" style={{ boxShadow: "0 20px 50px -30px var(--ai), inset 0 1px 0 var(--glass-edge)" }}>
          <p className="flex items-center justify-between text-sm font-semibold"><span className="flex items-center gap-2"><Brain className="size-4 text-ai" />AI engine</span><ArrowUpRight className="size-4 text-muted-foreground" /></p>
          <p className="mt-4 text-3xl font-semibold">{model.active}</p>
          <p className="mt-2 text-xs text-muted-foreground">{model.state === "IDLE" ? "Ready" : model.state.toLowerCase()} · {model.inferenceMs} ms · {model.feedbackSinceTrain} new feedback</p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5 text-battery" />ESP32 enforces hardware safety</p>
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartPanel title="Solar vs demand" meta="Last 24 h">
          <AreaSeries data={history} series={[{ key: "solar", name: "Solar", color: "var(--solar)" }, { key: "load", name: "Load", color: "var(--load)" }, { key: "grid", name: "Grid", color: "var(--grid)" }]} height={260} />
        </ChartPanel>
        <section className="glass-2 rounded-3xl p-5 md:p-6">
          <div className="mb-3 flex items-baseline justify-between"><h2 className="text-sm font-semibold">Priority ranking</h2><Link to="/priorities" className="text-xs text-muted-foreground hover:text-foreground">Explain →</Link></div>
          <ul className="space-y-3">
            {top.map((l) => (
              <li key={l.id} className="flex items-center gap-3">
                <Ring value={l.priority} size={34} stroke={3} color={l.priority >= 70 ? "var(--battery)" : l.priority >= 40 ? "var(--solar)" : "var(--offline)"}><span className="text-[10px] font-semibold num">{l.priority}</span></Ring>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{l.name}</p><p className="text-[11px] text-muted-foreground">{l.decision} · {l.confidence}%</p></div>
                <span className={`text-xs font-semibold ${l.on ? "" : "text-muted-foreground"}`}>{l.on ? "ON" : "OFF"}</span>
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between"><h2 className="text-xl font-semibold tracking-tight">Live loads</h2><Link to="/loads" className="text-sm text-muted-foreground hover:text-foreground">All {loads.length} loads →</Link></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loads.slice(0, 6).map((l, i) => <LoadCard key={l.id} load={l} index={i} onOpen={() => setOpen(l.id)} />)}
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="glass-1 rounded-3xl p-5">
          <div className="mb-3 flex justify-between"><h2 className="text-sm font-semibold">Recent alerts</h2><Link to="/alerts" className="text-xs text-muted-foreground">View all →</Link></div>
          <ul className="divide-y">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                <StatusDot tone={a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "ai"} pulse={a.severity === "critical"} />
                <span className="flex-1">{a.title}</span><span className="text-xs text-muted-foreground">{a.category}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <LoadDrawer loadId={open} onClose={() => setOpen(null)} />
      <span className="sr-only">{timeAgo(t.t)}</span>
    </div>
  );
}
