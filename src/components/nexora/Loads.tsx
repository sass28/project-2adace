import { useState } from "react";
import { Brain, ShieldCheck, Timer, ThumbsUp, ThumbsDown, AlertOctagon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEnergy, submitFeedback } from "@/lib/energy/store";
import type { Load, Learning } from "@/lib/energy/types";
import { Chip, GlassButton, LoadIcon, Power, Ring, StatusDot, timeAgo, Bar } from "./primitives";
import { AreaSeries, LineSeries } from "./Charts";
import { cn } from "@/lib/utils";

const learnTone: Record<Learning, "offline" | "ai" | "battery"> = { "COLD START": "offline", "ML MODEL": "ai", PERSONALIZED: "battery" };

export function priorityColor(p: number) {
  return p >= 70 ? "var(--battery)" : p >= 40 ? "var(--solar)" : "var(--offline)";
}

export function LoadCard({ load, onOpen, index = 0 }: { load: Load; onOpen: () => void; index?: number }) {
  return (
    <button
      onClick={onOpen}
      className={cn("glass-2 lift sheen rise-in group flex w-full flex-col rounded-3xl p-5 text-left", !load.on && "opacity-80")}
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`${load.name}, ${load.on ? "on" : "off"}, priority ${load.priority}. Open details`}
    >
      <div className="flex items-start justify-between">
        <span className={cn("grid size-10 place-items-center rounded-2xl transition-colors", load.on ? "bg-foreground text-background" : "glass-1 text-muted-foreground")}>
          <LoadIcon kind={load.kind} className="size-5" />
        </span>
        <Ring value={load.priority} size={50} stroke={4} color={priorityColor(load.priority)} label={`Priority ${load.priority}`}>
          <span className="text-sm font-semibold num">{load.priority}</span>
        </Ring>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{load.name}</p>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-semibold tracking-tight">{load.on ? "ON" : "OFF"}</span>
        <Power w={load.powerW} className="text-lg font-medium" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Chip tone={learnTone[load.learning]}>{load.learning}</Chip>
        <span className="text-[11px] text-muted-foreground num">{load.confidence}% conf.</span>
      </div>
      <p className="mt-4 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{load.decision}</span> · {load.origin} — {load.reason}
      </p>
    </button>
  );
}

export function LoadMatrix({ loads, onOpen }: { loads: Load[]; onOpen: (id: string) => void }) {
  return (
    <div className="glass-2 overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {["Load", "State", "Power", "Priority", "Confidence", "Learning", "Decision", "Origin"].map((h) => (
                <th key={h} className="px-5 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loads.map((l) => (
              <tr key={l.id} onClick={() => onOpen(l.id)} onKeyDown={(e) => e.key === "Enter" && onOpen(l.id)} tabIndex={0} className="cursor-pointer border-t transition-colors hover:bg-[var(--glass-3)]">
                <td className="px-5 py-3.5"><span className="flex items-center gap-2.5 font-medium"><LoadIcon kind={l.kind} className="size-4 text-muted-foreground" />{l.name}</span></td>
                <td className="px-5"><span className="flex items-center gap-2 font-semibold"><StatusDot tone={l.on ? "healthy" : "offline"} pulse={l.on} />{l.on ? "ON" : "OFF"}</span></td>
                <td className="px-5"><Power w={l.powerW} className="font-medium" /></td>
                <td className="px-5"><div className="flex w-28 items-center gap-2"><span className="w-6 num font-semibold">{l.priority}</span><Bar value={l.priority} color={priorityColor(l.priority)} /></div></td>
                <td className="px-5 num text-muted-foreground">{l.confidence}%</td>
                <td className="px-5"><Chip tone={learnTone[l.learning]}>{l.learning}</Chip></td>
                <td className="px-5 font-medium">{l.decision}</td>
                <td className="px-5 text-xs text-muted-foreground">{l.origin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LoadDrawer({ loadId, onClose }: { loadId: string | null; onClose: () => void }) {
  const load = useEnergy((s) => s.loads.find((l) => l.id === loadId));
  const feedback = useEnergy((s) => s.feedback);
  const [duration, setDuration] = useState(30);
  const fb = feedback.filter((f) => f.loadId === loadId);

  return (
    <Sheet open={!!loadId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="glass-4 w-full overflow-y-auto border-l-0 bg-[var(--glass-4)] p-0 sm:max-w-lg">
        {load && (
          <div className="p-6">
            <SheetHeader className="p-0 text-left">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-foreground text-background"><LoadIcon kind={load.kind} className="size-5" /></span>
                <div>
                  <SheetTitle className="text-xl tracking-tight">{load.name}</SheetTitle>
                  <SheetDescription>{load.deviceId} · rated {load.ratedW} W</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="glass-2 rounded-2xl p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">State</p><p className="text-2xl font-semibold">{load.on ? "ON" : "OFF"}</p></div>
              <div className="glass-2 rounded-2xl p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Priority</p><p className="text-2xl font-semibold num">{load.priority}</p></div>
              <div className="glass-2 rounded-2xl p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Today</p><p className="text-2xl font-semibold num">{load.energyTodayWh.toFixed(0)}<span className="text-xs text-muted-foreground"> Wh</span></p></div>
            </div>

            <div className="glass-2 mt-4 rounded-2xl p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-ai"><Brain className="size-3.5" /> Why the AI decided “{load.decision}”</p>
              <p className="mt-2 text-sm leading-relaxed">{load.reason}</p>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>Confidence <b className="text-foreground num">{load.confidence}%</b></span>
                <span>Learning <b className="text-foreground">{load.learning}</b></span>
                <span>Origin <b className="text-foreground">{load.origin}</b></span>
              </div>
            </div>

            <h3 className="mt-6 text-sm font-semibold">Power</h3>
            <AreaSeries data={load.history} series={[{ key: "power", name: "Power", color: "var(--load)" }]} height={140} />
            <h3 className="mt-4 text-sm font-semibold">Priority & confidence</h3>
            <LineSeries data={load.history} series={[{ key: "priority", name: "Priority", color: "var(--ai)" }, { key: "confidence", name: "Confidence", color: "var(--battery)" }]} height={140} domain={[0, 100]} />
            <h3 className="mt-4 text-sm font-semibold">State history</h3>
            <div className="mt-2 flex h-6 gap-px overflow-hidden rounded-lg" aria-label="On/off history">
              {load.history.slice(-48).map((h, i) => <span key={i} className="flex-1" style={{ background: h.on ? "var(--battery)" : "var(--border)" }} />)}
            </div>

            <h3 className="mt-6 text-sm font-semibold">Teach the AI</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <GlassButton onClick={() => submitFeedback(load, "Keep ON")}><ThumbsUp className="size-4" /> Keep ON</GlassButton>
              <GlassButton onClick={() => submitFeedback(load, "Allow OFF")}><ThumbsDown className="size-4" /> Allow OFF</GlassButton>
              <GlassButton className="col-span-2" tone="critical" onClick={() => submitFeedback(load, "Wrong decision")}><AlertOctagon className="size-4" /> This decision was wrong</GlassButton>
            </div>

            <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold"><Timer className="size-4" /> Temporary control</h3>
            <div className="mt-2 flex items-center gap-2">
              <label className="sr-only" htmlFor="dur">Duration</label>
              <select id="dur" value={duration} onChange={(e) => setDuration(+e.target.value)} className="glass-btn rounded-full px-3 py-2 text-sm">
                {[15, 30, 60, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
              <GlassButton tone="primary" onClick={() => submitFeedback(load, "Turn ON (temp)", duration)}>Turn ON</GlassButton>
              <GlassButton onClick={() => submitFeedback(load, "Turn OFF (temp)", duration)}>Turn OFF</GlassButton>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-battery" /> Requests go to the ESP32, which stays the final safety authority and may reject them.</p>

            <h3 className="mt-6 text-sm font-semibold">Feedback history</h3>
            <ul className="mt-2 space-y-2">
              {fb.length === 0 && <li className="text-xs text-muted-foreground">No feedback yet for this load.</li>}
              {fb.map((f) => (
                <li key={f.id} className="glass-1 rounded-xl px-3 py-2 text-xs">
                  <div className="flex justify-between"><b>{f.action}{f.durationMin ? ` · ${f.durationMin}m` : ""}</b><span className="text-muted-foreground">{timeAgo(f.t)}</span></div>
                  <p className="mt-0.5 text-muted-foreground">{f.status}{f.result ? ` — ${f.result}` : ""}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
