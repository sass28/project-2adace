import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { useEnergy } from "@/lib/energy/store";
import { EnergyFlow } from "@/components/nexora/EnergyFlow";
import { AnimatedNumber, PageHeader, Power, Stat } from "@/components/nexora/primitives";
import { AreaSeries, ChartPanel, LineSeries } from "@/components/nexora/Charts";

export const Route = createFileRoute("/_console/live")({
  head: () => seo("Live Energy", "Live energy flow between solar, battery, grid and loads, updated in real time."),
  component: Live,
});

function Live() {
  const t = useEnergy((s) => s.telemetry);
  const history = useEnergy((s) => s.history);
  const recent = history.slice(-30);
  return (
    <div>
      <PageHeader eyebrow="Real-time telemetry" title="Live Energy" description="Every path lights up only when power is actually flowing. Direction and speed follow the measured values." />
      <div className="glass-2 rounded-[32px] p-4 md:p-8"><EnergyFlow /></div>
      <div className="mt-8 grid grid-cols-2 gap-6 px-1 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Solar power"><Power w={t.solarW} /></Stat>
        <Stat label="PV voltage">{t.solarV} V</Stat>
        <Stat label="PV current">{t.solarA} A</Stat>
        <Stat label="Battery SOC"><AnimatedNumber value={t.batterySoc} decimals={1} />%</Stat>
        <Stat label="Battery V">{t.batteryV} V</Stat>
        <Stat label="Battery flow"><Power w={t.batteryW} /></Stat>
        <Stat label="Grid import"><Power w={t.gridW} /></Stat>
        <Stat label="Total load"><Power w={t.loadW} /></Stat>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Power streams" meta="Live window"><AreaSeries data={recent} series={[{ key: "solar", name: "Solar", color: "var(--solar)" }, { key: "load", name: "Load", color: "var(--load)" }]} /></ChartPanel>
        <ChartPanel title="Battery flow & SOC" meta="+ charging / − discharging">
          <LineSeries data={recent} series={[{ key: "battery", name: "Battery W", color: "var(--battery)" }, { key: "grid", name: "Grid W", color: "var(--grid)" }]} height={240} />
        </ChartPanel>
      </div>
    </div>
  );
}
