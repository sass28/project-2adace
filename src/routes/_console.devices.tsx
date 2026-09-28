import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Wifi } from "lucide-react";
import { seo } from "@/lib/seo";
import { useEnergy } from "@/lib/energy/store";
import { Chip, PageHeader, Stat, StatusDot } from "@/components/nexora/primitives";

export const Route = createFileRoute("/_console/devices")({
  head: () => seo("Devices", "ESP32 controller health, connectivity, firmware and attached loads."),
  component: Devices,
});

function Devices() {
  const devices = useEnergy((s) => s.devices);
  const loads = useEnergy((s) => s.loads);
  return (
    <div>
      <PageHeader eyebrow="Hardware" title="Devices" description="ESP32 controllers are the final safety authority. If one goes silent, its loads stay in their last safe state." />
      <div className="grid gap-4 lg:grid-cols-2">
        {devices.map((d) => (
          <section key={d.id} className="glass-2 lift rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-3 font-semibold"><Cpu className="size-5 text-muted-foreground" />{d.name}</p>
              <Chip tone={d.online ? "healthy" : "critical"}>{d.online ? "Online" : "Offline"}</Chip>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat label="Firmware">{d.firmware}</Stat>
              <Stat label="Signal"><span className="flex items-center gap-1"><Wifi className="size-4" />{d.rssi}</span></Stat>
              <Stat label="Uptime">{d.uptimeH} h</Stat>
              <Stat label="Telemetry">{d.telemetryHz} Hz</Stat>
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {d.loads.map((id) => { const l = loads.find((x) => x.id === id); return l && <li key={id} className="glass-1 flex items-center gap-2 rounded-full px-3 py-1 text-xs"><StatusDot tone={l.on ? "healthy" : "offline"} pulse={false} />{l.name}</li>; })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
