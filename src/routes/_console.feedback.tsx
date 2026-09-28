import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useEnergy } from "@/lib/energy/store";
import { Chip, PageHeader } from "@/components/nexora/primitives";

export const Route = createFileRoute("/_console/feedback")({
  head: () => seo("Feedback", "Your feedback to the AI and what actually happened on the hardware."),
  component: FeedbackPage,
});

function FeedbackPage() {
  const fb = useEnergy((s) => s.feedback);
  return (
    <div>
      <PageHeader eyebrow="Learning loop" title="Feedback" description="Every request you send, its status, and the actual result reported by the ESP32. Give new feedback from any load." />
      {fb.length === 0 ? <div className="glass-1 rounded-3xl p-12 text-center text-sm text-muted-foreground">No feedback yet.</div> : (
        <ul className="space-y-3">
          {fb.map((f) => (
            <li key={f.id} className="glass-2 rise-in flex flex-wrap items-center gap-4 rounded-3xl p-5">
              <div className="flex-1">
                <p className="font-semibold">{f.loadName} · {f.action}{f.durationMin ? ` (${f.durationMin} min)` : ""}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.result ?? "Waiting for the device…"}</p>
              </div>
              <Chip tone={f.status === "APPLIED" ? "healthy" : f.status === "PENDING" ? "warning" : f.status === "ACKNOWLEDGED" ? "ai" : "critical"}>{f.status}</Chip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
