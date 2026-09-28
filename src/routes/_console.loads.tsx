import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, Rows3, Search } from "lucide-react";
import { seo } from "@/lib/seo";
import { useEnergy } from "@/lib/energy/store";
import { PageHeader } from "@/components/nexora/primitives";
import { LoadCard, LoadDrawer, LoadMatrix } from "@/components/nexora/Loads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/loads")({
  head: () => seo("Loads", "Every connected load with state, power, AI priority, confidence and decision reason."),
  component: LoadsPage,
});

function LoadsPage() {
  const loads = useEnergy((s) => s.loads);
  const [view, setView] = useState<"cards" | "matrix">("cards");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "on" | "off">("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(
    () => loads.filter((l) => l.name.toLowerCase().includes(q.toLowerCase()) && (filter === "all" || (filter === "on") === l.on)),
    [loads, q, filter],
  );
  const onCount = loads.filter((l) => l.on).length;

  return (
    <div>
      <PageHeader eyebrow={`${onCount} of ${loads.length} running`} title="Loads" description="Tap any load to see its history, why the AI ranked it, and to teach the system your preference." />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <label className="glass-2 flex flex-1 items-center gap-2 rounded-full px-4 py-2 md:max-w-xs">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search loads" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Search loads" />
        </label>
        <div className="glass-2 flex rounded-full p-1" role="tablist" aria-label="Filter">
          {(["all", "on", "off"] as const).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-all", filter === f ? "glass-4" : "text-muted-foreground")}>{f}</button>
          ))}
        </div>
        <div className="glass-2 ml-auto flex rounded-full p-1">
          <button aria-label="Card view" onClick={() => setView("cards")} className={cn("rounded-full p-2", view === "cards" && "glass-4")}><LayoutGrid className="size-4" /></button>
          <button aria-label="Matrix view" onClick={() => setView("matrix")} className={cn("rounded-full p-2", view === "matrix" && "glass-4")}><Rows3 className="size-4" /></button>
        </div>
      </div>
      {list.length === 0 ? (
        <div className="glass-1 rounded-3xl p-12 text-center text-sm text-muted-foreground">No loads match. Try a different search or filter.</div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((l, i) => <LoadCard key={l.id} load={l} index={i} onOpen={() => setOpen(l.id)} />)}
        </div>
      ) : (
        <LoadMatrix loads={list} onOpen={setOpen} />
      )}
      <LoadDrawer loadId={open} onClose={() => setOpen(null)} />
    </div>
  );
}
