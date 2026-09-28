import type { EnergyState, HistoryPoint, Load } from "./types";

// Deterministic seed (no randomness) so server and client render identically.
const BASE = Date.UTC(2026, 8, 28, 12, 0, 0);

function wave(i: number, p: number, a: number) {
  return Math.sin((i / p) * Math.PI * 2) * a;
}

function makeLoad(
  id: string,
  name: string,
  kind: Load["kind"],
  on: boolean,
  ratedW: number,
  priority: number,
  confidence: number,
  learning: Load["learning"],
  decision: string,
  origin: Load["origin"],
  reason: string,
  i: number,
): Load {
  const history = Array.from({ length: 48 }, (_, k) => ({
    t: BASE - (47 - k) * 30 * 60 * 1000,
    power: on ? Math.max(0, ratedW + wave(k + i, 9, ratedW * 0.12)) : k > 40 ? 0 : ratedW * (k % 7 < 4 ? 1 : 0),
    priority: Math.round(Math.min(100, Math.max(0, priority + wave(k + i * 3, 14, 8)))),
    confidence: Math.min(99, Math.max(40, confidence - 12 + k * 0.25)),
    on: on ? 1 : k > 40 ? 0 : k % 7 < 4 ? 1 : 0,
  }));
  return {
    id, name, kind, on, ratedW, priority, confidence, learning, decision, origin, reason,
    powerW: on ? ratedW : 0,
    preference: "NEUTRAL",
    deviceId: "esp32-a1",
    energyTodayWh: Math.round(ratedW * (on ? 7.4 : 3.1) * 10) / 10,
    history,
  };
}

export function createSeed(): EnergyState {
  const loads: Load[] = [
    makeLoad("fan-1", "DC Fan", "fan", true, 5.2, 82, 91, "PERSONALIZED", "Keep ON", "ML", "You usually keep the fan on in the afternoon; solar is sufficient.", 1),
    makeLoad("led-1", "Normal LED", "led", true, 2.4, 76, 88, "ML MODEL", "Keep ON", "ML", "Essential lighting with low draw; high historical usage.", 2),
    makeLoad("led-2", "Decorative LED", "decor", false, 1.8, 21, 94, "COLD START", "Allow OFF", "ENERGY SHEDDING", "Non-essential. Shed to preserve battery for evening demand.", 3),
    makeLoad("pump-1", "Water Pump", "pump", true, 18, 64, 79, "ML MODEL", "Keep ON", "ML", "Scheduled fill cycle aligned with peak solar.", 4),
    makeLoad("router-1", "Wi-Fi Router", "router", true, 6.5, 95, 97, "PERSONALIZED", "Keep ON", "USER", "Marked always-on by you. Never shed unless critical.", 5),
    makeLoad("sock-1", "Utility Socket", "socket", false, 12, 38, 72, "ML MODEL", "Allow OFF", "ML", "Low recent usage; deferred until surplus solar.", 6),
  ];
  const history: HistoryPoint[] = Array.from({ length: 48 }, (_, k) => {
    const hour = (k / 2 + 0) % 24;
    const sun = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const solar = Math.round(sun * 3100 + wave(k, 5, 120) * sun);
    const load = Math.round(1100 + wave(k, 12, 350) + (hour > 18 ? 500 : 0));
    const soc = Math.round(Math.min(98, Math.max(22, 40 + sun * 45 + wave(k, 20, 6))));
    const net = solar - load;
    return {
      t: BASE - (47 - k) * 30 * 60 * 1000,
      solar, load, soc,
      battery: Math.round(Math.max(-900, Math.min(900, net * 0.7))),
      grid: net < -300 ? Math.round(-net * 0.3) : 0,
    };
  });
  return {
    connection: "DEMO",
    demo: true,
    telemetry: {
      t: BASE,
      solarW: 2840, solarV: 17.5, solarA: 1.1, solarTodayKWh: 8.72,
      batteryV: 12.4, batterySoc: 78, batteryW: 1420, batteryTempC: 29,
      gridAvailable: true, gridW: 0, gridV: 230,
      loadW: 1420, source: "SOLAR",
    },
    loads,
    history,
    alerts: [
      { id: "a1", t: BASE - 12 * 60000, severity: "warning", category: "Battery", title: "Battery temperature rising", detail: "Pack at 29°C and climbing. Charge rate is being tapered by the ESP32.", dismissed: false, acknowledged: false },
      { id: "a2", t: BASE - 55 * 60000, severity: "info", category: "Model", title: "Model v2.4.1 promoted", detail: "Accuracy improved 2.1% after 146 new feedback samples.", dismissed: false, acknowledged: true },
      { id: "a3", t: BASE - 3 * 3600000, severity: "critical", category: "Device", title: "ESP32-B2 lost heartbeat", detail: "No telemetry received for 90s. Loads on this node held in last safe state.", dismissed: false, acknowledged: false },
      { id: "a4", t: BASE - 5 * 3600000, severity: "info", category: "Load", title: "Decorative LED shed", detail: "Energy shedding engaged to protect evening reserve.", dismissed: false, acknowledged: true },
    ],
    feedback: [
      { id: "f1", t: BASE - 40 * 60000, loadId: "fan-1", loadName: "DC Fan", action: "Keep ON", status: "APPLIED", result: "Priority raised 74 → 82. Model personalized." },
      { id: "f2", t: BASE - 2 * 3600000, loadId: "led-2", loadName: "Decorative LED", action: "Allow OFF", status: "APPLIED", result: "Confirmed shedding decision." },
      { id: "f3", t: BASE - 6 * 3600000, loadId: "sock-1", loadName: "Utility Socket", action: "Turn ON (temp)", durationMin: 30, status: "REJECTED BY ESP32", result: "Rejected: battery below safe reserve at the time." },
    ],
    devices: [
      { id: "esp32-a1", name: "ESP32-A1 · Main Panel", firmware: "1.8.3", online: true, rssi: -54, uptimeH: 212, lastSeen: BASE, loads: ["fan-1", "led-1", "led-2", "router-1"], telemetryHz: 1 },
      { id: "esp32-b2", name: "ESP32-B2 · Utility Room", firmware: "1.8.1", online: false, rssi: -81, uptimeH: 0, lastSeen: BASE - 3 * 3600000, loads: ["pump-1", "sock-1"], telemetryHz: 1 },
    ],
    model: {
      active: "v2.4.1",
      state: "IDLE",
      lastInference: BASE,
      inferenceMs: 14,
      feedbackSinceTrain: 23,
      nextRetrainAt: BASE + 5 * 3600000,
      versions: [
        { version: "v2.4.1", trainedAt: BASE - 60 * 60000, accuracy: 93.4, samples: 18420, active: true, note: "Personalization weights for fan + router" },
        { version: "v2.4.0", trainedAt: BASE - 26 * 3600000, accuracy: 91.3, samples: 18274, active: false, note: "Added solar forecast feature" },
        { version: "v2.3.2", trainedAt: BASE - 4 * 86400000, accuracy: 89.8, samples: 16102, active: false, note: "Cold-start prior tuning" },
      ],
      retrainLog: [
        { t: BASE - 62 * 60000, msg: "Retraining started · 146 new samples" },
        { t: BASE - 61 * 60000, msg: "Validation accuracy 93.4% (+2.1%)" },
        { t: BASE - 60 * 60000, msg: "v2.4.1 promoted to active" },
      ],
    },
    lastUpdate: BASE,
  };
}
