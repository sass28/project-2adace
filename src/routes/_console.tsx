import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutGrid, Activity, ToggleRight, Brain, LineChart, Cpu, MessageSquareHeart, Bell, Boxes, Settings, Maximize2, Menu, X } from "lucide-react";
import { AmbientBackground } from "@/components/nexora/Background";
import { Logo } from "@/components/nexora/Logo";
import { StatusDot, AnimatedNumber } from "@/components/nexora/primitives";
import { startEnergyEngine, useEnergy } from "@/lib/energy/store";
import { loadPrefs, setPrefs, usePrefs } from "@/lib/energy/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console")({ component: ConsoleLayout });

const NAV = [
  { to: "/overview", label: "Overview", icon: LayoutGrid },
  { to: "/live", label: "Live Energy", icon: Activity },
  { to: "/loads", label: "Loads", icon: ToggleRight },
  { to: "/priorities", label: "AI Priorities", icon: Brain },
  { to: "/analytics", label: "Energy Analytics", icon: LineChart },
  { to: "/devices", label: "Devices", icon: Cpu },
  { to: "/feedback", label: "Feedback", icon: MessageSquareHeart },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/models", label: "Model Center", icon: Boxes },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
const MOBILE = ["/overview", "/loads", "/priorities", "/alerts"] as const;

function ConsoleLayout() {
  useEffect(() => { loadPrefs(); startEnergyEngine(); }, []);
  const prefs = usePrefs();
  const [menu, setMenu] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setMenu(false), [path]);

  return (
    <div className="min-h-screen">
      <AmbientBackground />
      {!prefs.commandMode && (
        <aside className="glass-2 fixed inset-y-3 left-3 z-30 hidden w-60 flex-col rounded-[28px] p-4 lg:flex">
          <Link to="/" className="px-2 py-2"><Logo /></Link>
          <nav className="mt-6 flex flex-1 flex-col gap-0.5" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-[var(--glass-3)] hover:text-foreground" activeProps={{ className: "glass-3 !text-foreground font-medium" }}>
                <n.icon className="size-[18px]" strokeWidth={1.6} />
                {n.label}
              </Link>
            ))}
          </nav>
          <SidebarModel />
        </aside>
      )}

      <div className={cn("transition-[padding]", !prefs.commandMode && "lg:pl-[264px]")}>
        <TopBar onMenu={() => setMenu(true)} />
        <main key={path} className="rise-in mx-auto max-w-[1440px] px-4 pb-28 pt-4 md:px-8 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="glass-3 fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-[26px] px-2 py-2 lg:hidden" aria-label="Quick">
        {NAV.filter((n) => (MOBILE as readonly string[]).includes(n.to)).map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] text-muted-foreground" activeProps={{ className: "!text-foreground bg-[var(--glass-4)]" }}>
            <n.icon className="size-5" strokeWidth={1.6} />
            {n.label.split(" ")[0]}
          </Link>
        ))}
        <button onClick={() => setMenu(true)} className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] text-muted-foreground"><Menu className="size-5" strokeWidth={1.6} />More</button>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm lg:hidden" onClick={() => setMenu(false)}>
          <div className="glass-4 animate-scale-in absolute inset-x-3 bottom-3 rounded-[28px] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><Logo /><button onClick={() => setMenu(false)} aria-label="Close menu" className="glass-btn rounded-full p-2"><X className="size-4" /></button></div>
            <div className="grid grid-cols-3 gap-2">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="glass-2 flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center text-[11px]" activeProps={{ className: "!glass-3 font-semibold" }}>
                  <n.icon className="size-5" strokeWidth={1.6} />{n.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarModel() {
  const m = useEnergy((s) => s.model);
  return (
    <div className="glass-1 rounded-2xl p-3">
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground"><StatusDot tone="ai" pulse={m.state !== "IDLE"} /> AI Engine</p>
      <p className="mt-1.5 text-sm font-semibold">{m.active} · {m.state === "IDLE" ? "Ready" : m.state === "INFERRING" ? "Inferring" : "Retraining"}</p>
      <p className="text-xs text-muted-foreground num">{m.inferenceMs} ms inference</p>
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const conn = useEnergy((s) => s.connection);
  const t = useEnergy((s) => s.telemetry);
  const alerts = useEnergy((s) => s.alerts.filter((a) => !a.dismissed && !a.acknowledged).length);
  const prefs = usePrefs();
  const tone = conn === "LIVE" ? "healthy" : conn === "SYNCING" ? "warning" : conn === "DEMO" ? "ai" : "critical";
  return (
    <div className="sticky top-0 z-20 px-4 pt-3 md:px-8">
      <div className="glass-2 mx-auto flex max-w-[1440px] items-center gap-3 rounded-full px-3 py-2 md:px-4">
        <button onClick={onMenu} className="rounded-full p-1.5 lg:hidden" aria-label="Open menu"><Menu className="size-5" /></button>
        <span className="lg:hidden"><Logo compact /></span>
        {prefs.commandMode && <span className="hidden lg:block"><Logo /></span>}
        <div className="flex items-center gap-2 rounded-full px-2 text-xs font-semibold tracking-wider" role="status" aria-live="polite">
          <StatusDot tone={tone} />
          {conn === "DEMO" ? "DEMO MODE" : conn}
        </div>
        <div className="ml-auto hidden items-center gap-5 text-xs text-muted-foreground md:flex">
          <span>Source <b className="text-foreground">{t.source}</b></span>
          <span className="flex items-center gap-1.5"><StatusDot tone="solar" pulse={false} /><b className="text-foreground num"><AnimatedNumber value={t.solarW / 1000} decimals={2} /> kW</b></span>
          <span className="flex items-center gap-1.5"><StatusDot tone="battery" pulse={false} /><b className="text-foreground num"><AnimatedNumber value={t.batterySoc} />%</b></span>
          <span className="flex items-center gap-1.5"><StatusDot tone={t.gridAvailable ? "grid" : "offline"} pulse={false} /><b className="text-foreground">{t.gridAvailable ? "Grid OK" : "No grid"}</b></span>
        </div>
        <Link to="/alerts" className="glass-btn relative ml-auto rounded-full p-2 md:ml-0" aria-label={`${alerts} unread alerts`}>
          <Bell className="size-4" />
          {alerts > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-critical text-[9px] font-bold text-primary-foreground">{alerts}</span>}
        </Link>
        <button onClick={() => setPrefs({ commandMode: !prefs.commandMode })} className="glass-btn hidden rounded-full p-2 lg:inline-flex" aria-label="Toggle command center mode" title="Command center mode">
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
