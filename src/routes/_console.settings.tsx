import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { setDemoMode, useEnergy } from "@/lib/energy/store";
import { setPrefs, usePrefs } from "@/lib/energy/prefs";
import { backendUrl } from "@/lib/energy/api";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/nexora/primitives";

export const Route = createFileRoute("/_console/settings")({
  head: () => seo("Settings", "Theme, motion, demo mode and backend connection settings."),
  component: SettingsPage,
});

function Row({ title, sub, checked, onChange }: { title: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 border-b px-5 py-4 last:border-0">
      <span><span className="block text-sm font-medium">{title}</span><span className="text-xs text-muted-foreground">{sub}</span></span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function SettingsPage() {
  const p = usePrefs();
  const demo = useEnergy((s) => s.demo);
  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Preferences" title="Settings" />
      <div className="glass-2 rounded-3xl">
        <Row title="Dark appearance" sub="Light Liquid Glass is the default." checked={p.theme === "dark"} onChange={(v) => setPrefs({ theme: v ? "dark" : "light" })} />
        <Row title="Reduce motion" sub="Stops flowing lines and ambient animation." checked={p.reducedMotion} onChange={(v) => setPrefs({ reducedMotion: v })} />
        <Row title="Command center mode" sub="Hides navigation for wall displays and demos." checked={p.commandMode} onChange={(v) => setPrefs({ commandMode: v })} />
        <Row title="Demo mode" sub={backendUrl() ? "Use simulated data instead of your system." : "No backend configured — simulated data is shown."} checked={demo} onChange={setDemoMode} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Backend: {backendUrl() ?? "not configured"}</p>
    </div>
  );
}
