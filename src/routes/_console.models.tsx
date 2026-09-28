import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { rollbackModel, triggerRetrain, useEnergy } from "@/lib/energy/store";
import { Chip, GlassButton, PageHeader, Stat } from "@/components/nexora/primitives";

export const Route = createFileRoute("/_console/models")({
  head: () => seo("Model Center", "Active AI model, version history, accuracy, retraining activity and rollback."),
  component: Models,
});

function Models() {
  const m = useEnergy((s) => s.model);
  return (
    <div>
      <PageHeader eyebrow="Machine learning" title="Model Center" action={<GlassButton tone="ai" disabled={m.state === "RETRAINING"} onClick={triggerRetrain}>{m.state === "RETRAINING" ? "Retraining…" : "Retrain now"}</GlassButton>} />
      <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        <Stat label="Active version">{m.active}</Stat>
        <Stat label="State">{m.state}</Stat>
        <Stat label="Inference">{m.inferenceMs} ms</Stat>
        <Stat label="New feedback">{m.feedbackSinceTrain}</Stat>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ul className="space-y-3">
          {m.versions.map((v) => (
            <li key={v.version} className="glass-2 flex flex-wrap items-center gap-4 rounded-3xl p-5">
              <div className="flex-1"><p className="font-semibold">{v.version} {v.active && <Chip tone="healthy" className="ml-2">Active</Chip>}</p><p className="mt-1 text-sm text-muted-foreground">{v.note} · {v.samples.toLocaleString()} samples</p></div>
              <p className="text-2xl font-semibold num">{v.accuracy}%</p>
              {!v.active && <GlassButton onClick={() => rollbackModel(v.version)}>Roll back</GlassButton>}
            </li>
          ))}
        </ul>
        <section className="glass-1 rounded-3xl p-5">
          <h2 className="mb-3 text-sm font-semibold">Retraining activity</h2>
          <ul className="space-y-2 text-sm">{m.retrainLog.map((r, i) => <li key={i} className="border-l-2 border-ai/40 pl-3">{r.msg}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}
