import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useEnergy } from "@/lib/energy/store";
import { PageHeader } from "@/components/nexora/primitives";
import { AreaSeries, BarSeries, ChartPanel, LineSeries } from "@/components/nexora/Charts";

export const Route = createFileRoute("/_console/analytics")({
  head: () => seo("Energy Analytics", "Solar generation, consumption, battery history, source mix and per-load energy."),
  component: Analytics,
});

function Analytics() {
  const h = useEnergy((s) => s.history);
  const loads = useEnergy((s) => s.loads);
  const perLoad = loads.map((l) => ({ name: l.name, wh: l.energyTodayWh }));
  const solarWh = h.reduce((a, p) => a + p.solar * 0.5, 0);
  const gridWh = h.reduce((a, p) => a + p.grid * 0.5, 0);
  const loadWh = h.reduce((a, p) => a + p.load * 0.5, 0) || 1;
  const mix = [
    { name: "Solar", share: Math.round(Math.min(100, ((loadWh - gridWh) / loadWh) * 100)) },
    { name: "Grid", share: Math.round((gridWh / loadWh) * 100) },
  ];
  const shedable = loads.filter((l) => l.priority < 40).reduce((a, l) => a + l.ratedW, 0);
  return (
    <div>
      <PageHeader eyebrow="History" title="Energy Analytics" description={`Solar produced ${(solarWh / 1000).toFixed(1)} kWh in this window. Deferring low-priority loads could save about ${((shedable * 6) / 1000).toFixed(2)} kWh per day.`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Solar vs demand"><AreaSeries data={h} series={[{ key: "solar", name: "Solar", color: "var(--solar)" }, { key: "load", name: "Load", color: "var(--load)" }]} /></ChartPanel>
        <ChartPanel title="Battery state of charge"><LineSeries data={h} series={[{ key: "soc", name: "SOC", color: "var(--battery)" }]} unit="%" domain={[0, 100]} height={240} /></ChartPanel>
        <ChartPanel title="Per-load energy today"><BarSeries data={perLoad} series={[{ key: "wh", name: "Energy", color: "var(--ai)" }]} unit=" Wh" /></ChartPanel>
        <ChartPanel title="Source contribution"><BarSeries data={mix} series={[{ key: "share", name: "Share", color: "var(--grid)" }]} unit="%" /></ChartPanel>
      </div>
    </div>
  );
}
