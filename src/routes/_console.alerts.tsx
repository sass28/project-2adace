import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { ackAlert, dismissAlert, useEnergy } from "@/lib/energy/store";
import { Chip, GlassButton, PageHeader, StatusDot } from "@/components/nexora/primitives";

export const Route = createFileRoute("/_console/alerts")({
  head: () => seo("Alerts", "Categorized system alerts for battery, solar, grid, devices, loads and the AI model."),
  component: Alerts,
});

function Alerts() {
  const alerts = useEnergy((s) => s.alerts.filter((a) => !a.dismissed));
  return (
    <div>
      <PageHeader eyebrow={`${alerts.length} active`} title="Alerts" />
      {alerts.length === 0 ? <div className="glass-1 rounded-3xl p-12 text-center text-sm text-muted-foreground">All clear. No active alerts.</div> : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className="glass-2 rise-in flex flex-wrap items-start gap-4 rounded-3xl p-5">
              <StatusDot className="mt-2" tone={a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "ai"} pulse={a.severity === "critical" && !a.acknowledged} />
              <div className="flex-1">
                <p className="font-semibold">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                <div className="mt-2 flex gap-1.5"><Chip>{a.category}</Chip><Chip>{a.severity}</Chip>{a.acknowledged && <Chip tone="healthy">Acknowledged</Chip>}</div>
              </div>
              <div className="flex gap-2">
                {!a.acknowledged && <GlassButton onClick={() => ackAlert(a.id)}>Acknowledge</GlassButton>}
                <GlassButton onClick={() => dismissAlert(a.id)}>Dismiss</GlassButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
