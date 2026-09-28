import { Sun, BatteryCharging, BatteryMedium, UtilityPole, Home, Cpu } from "lucide-react";
import { useEnergy } from "@/lib/energy/store";
import { Power, AnimatedNumber } from "./primitives";
import { cn } from "@/lib/utils";

const W = 800, H = 440;
const N = { solar: [130, 90], grid: [130, 350], hub: [400, 220], battery: [670, 90], loads: [670, 350] } as const;

function path(a: readonly number[], b: readonly number[]) {
  const mx = (a[0] + b[0]) / 2;
  return `M${a[0]} ${a[1]} C ${mx} ${a[1]}, ${mx} ${b[1]}, ${b[0]} ${b[1]}`;
}

function Flow({ d, color, active, reverse, intensity }: { d: string; color: string; active: boolean; reverse?: boolean; intensity: number }) {
  const speed = Math.max(0.5, 2.4 - intensity * 1.8);
  return (
    <g>
      <path d={d} fill="none" stroke="var(--glass-edge)" strokeWidth={14} strokeLinecap="round" />
      <path d={d} fill="none" stroke="var(--border)" strokeWidth={14} strokeLinecap="round" opacity={0.5} />
      {active && (
        <>
          <path d={d} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" opacity={0.14} style={{ filter: "blur(6px)" }} />
          <path d={d} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" className={cn("flow-line", reverse && "reverse")} style={{ animationDuration: `${speed}s` }} />
        </>
      )}
    </g>
  );
}

function Node({ at, icon: Icon, label, color, children, dim }: { at: readonly number[]; icon: typeof Sun; label: string; color: string; children: React.ReactNode; dim?: boolean }) {
  return (
    <div
      className={cn("glass-3 absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl px-3 py-2.5 transition-opacity md:px-4 md:py-3", dim && "opacity-55")}
      style={{ left: `${(at[0] / W) * 100}%`, top: `${(at[1] / H) * 100}%`, boxShadow: `0 10px 40px -12px ${color}, inset 0 1px 0 var(--glass-edge)` }}
    >
      <span className="grid size-9 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}>
        <Icon className="size-[18px]" strokeWidth={1.7} />
      </span>
      <div className="leading-tight">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <div className="text-base font-semibold md:text-lg">{children}</div>
      </div>
    </div>
  );
}

export function EnergyFlow({ className }: { className?: string }) {
  const t = useEnergy((s) => s.telemetry);
  const infer = useEnergy((s) => s.model.state);
  const charging = t.batteryW > 20;
  const discharging = t.batteryW < -20;
  const norm = (w: number) => Math.min(1, Math.abs(w) / 3000);

  return (
    <div className={cn("relative w-full", className)} style={{ aspectRatio: `${W}/${H}` }} role="img" aria-label={`Energy flow: solar ${Math.round(t.solarW)} W, load ${Math.round(t.loadW)} W, battery ${charging ? "charging" : discharging ? "discharging" : "idle"}, grid ${t.gridW > 0 ? "supplying" : "idle"}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full">
        <Flow d={path(N.solar, N.hub)} color="var(--solar)" active={t.solarW > 50} intensity={norm(t.solarW)} />
        <Flow d={path(N.grid, N.hub)} color="var(--grid)" active={t.gridW > 10} intensity={norm(t.gridW)} />
        <Flow d={path(N.hub, N.battery)} color="var(--battery)" active={charging || discharging} reverse={discharging} intensity={norm(t.batteryW)} />
        <Flow d={path(N.hub, N.loads)} color="var(--load)" active={t.loadW > 10} intensity={norm(t.loadW)} />
      </svg>

      {/* Hub orb */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "50%", top: "50%" }}>
        <div className="relative grid size-28 place-items-center md:size-40">
          <div className="orb-breathe absolute inset-0 rounded-full blur-2xl" style={{ background: "conic-gradient(from 0deg, var(--ambient-a), var(--ambient-b), var(--ambient-c), var(--ambient-d), var(--ambient-a))" }} />
          <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0">
            <circle cx="50" cy="50" r="47" fill="none" stroke="var(--solar)" strokeWidth="1" strokeDasharray="30 200" strokeLinecap="round" />
            <circle cx="50" cy="50" r="47" fill="none" stroke="var(--battery)" strokeWidth="1" strokeDasharray="20 200" strokeDashoffset="-100" strokeLinecap="round" />
          </svg>
          <div className="glass-4 relative grid size-[82%] place-items-center rounded-full text-center">
            <div>
              <Cpu className={cn("mx-auto size-4 text-ai", infer === "INFERRING" && "pulse-dot")} strokeWidth={1.7} />
              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground md:text-[10px]">Source</p>
              <p className="text-sm font-semibold tracking-tight md:text-lg">{t.source}</p>
            </div>
          </div>
        </div>
      </div>

      <Node at={N.solar} icon={Sun} label="Solar" color="var(--solar)" dim={t.solarW < 50}><Power w={t.solarW} /></Node>
      <Node at={N.grid} icon={UtilityPole} label={t.gridAvailable ? "Grid" : "Grid · Offline"} color="var(--grid)" dim={t.gridW <= 10}><Power w={t.gridW} /></Node>
      <Node at={N.battery} icon={charging ? BatteryCharging : BatteryMedium} label={charging ? "Charging" : discharging ? "Discharging" : "Battery idle"} color="var(--battery)">
        <AnimatedNumber value={t.batterySoc} /><span className="ml-0.5 text-xs text-muted-foreground">%</span>
      </Node>
      <Node at={N.loads} icon={Home} label="Loads" color="var(--load)"><Power w={t.loadW} /></Node>
    </div>
  );
}
