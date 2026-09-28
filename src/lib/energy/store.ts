import { useSyncExternalStore } from "react";
import { createSeed } from "./seed";
import type { EnergyState, Feedback, Load } from "./types";
import { api, backendUrl } from "./api";

let state: EnergyState | null = null;
const listeners = new Set<() => void>();
let serverSnapshot: EnergyState | null = null;

function get(): EnergyState {
  if (!state) state = createSeed();
  return state;
}
function set(fn: (s: EnergyState) => EnergyState) {
  state = fn(get());
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useEnergy<T>(selector: (s: EnergyState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(get()),
    () => selector((serverSnapshot ??= createSeed())),
  );
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const jitter = (v: number, pct: number) => v * (1 + (Math.random() - 0.5) * pct);
let uid = 0;
const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${(uid++).toString(36)}`;

/* ---------------- Demo simulation ---------------- */
function demoTick() {
  set((s) => {
    const now = Date.now();
    const t = s.telemetry;
    const solarW = clamp(jitter(t.solarW + (Math.random() - 0.48) * 120, 0.04), 200, 3400);
    const loads: Load[] = s.loads.map((l) => {
      const priority = Math.round(clamp(l.priority + (Math.random() - 0.5) * 3, 3, 99));
      const powerW = l.on ? +clamp(jitter(l.ratedW, 0.1), 0, l.ratedW * 1.3).toFixed(1) : 0;
      return {
        ...l,
        priority,
        powerW,
        confidence: +clamp(l.confidence + (Math.random() - 0.45) * 0.6, 50, 99).toFixed(0),
        energyTodayWh: +(l.energyTodayWh + powerW / 3600 * 2).toFixed(2),
        history: [...l.history.slice(-59), { t: now, power: powerW, priority, confidence: l.confidence, on: l.on ? 1 : 0 }],
      };
    });
    const loadW = clamp(jitter(t.loadW + (Math.random() - 0.5) * 90, 0.03), 600, 2600);
    const net = solarW - loadW;
    let batteryW = t.batterySoc >= 99 && net > 0 ? 0 : net;
    let gridW = 0;
    if (t.batterySoc < 25 && net < 0 && t.gridAvailable) { gridW = -net; batteryW = 0; }
    const batterySoc = clamp(t.batterySoc + batteryW / 40000, 5, 100);
    const source = gridW > 0 ? (solarW > 400 ? "HYBRID" : "GRID") : net >= 0 ? "SOLAR" : "BATTERY";
    const point = { t: now, solar: Math.round(solarW), load: Math.round(loadW), soc: Math.round(batterySoc), grid: Math.round(gridW), battery: Math.round(batteryW) };
    return {
      ...s,
      loads,
      telemetry: {
        ...t, t: now, solarW, loadW, batteryW, gridW, batterySoc, source,
        solarV: +jitter(17.5, 0.02).toFixed(1),
        solarA: +(solarW / 17.5 / 150).toFixed(2),
        solarTodayKWh: t.solarTodayKWh + solarW / 3600 / 1000 * 2,
        batteryV: +(11.6 + batterySoc / 100 * 1.1).toFixed(2),
        batteryTempC: +clamp(jitter(t.batteryTempC, 0.01), 24, 38).toFixed(1),
      },
      history: [...s.history.slice(-71), point],
      model: { ...s.model, lastInference: now, inferenceMs: Math.round(jitter(14, 0.3)), state: Math.random() < 0.15 ? "INFERRING" : "IDLE" },
      lastUpdate: now,
    };
  });
}

let timer: ReturnType<typeof setInterval> | null = null;
let ws: WebSocket | null = null;
let started = false;

export function startEnergyEngine() {
  if (started) return;
  started = true;
  if (backendUrl()) connectBackend();
  else startDemo();
}

function startDemo() {
  set((s) => ({ ...s, demo: true, connection: "DEMO" }));
  if (timer) clearInterval(timer);
  timer = setInterval(demoTick, 2000);
}

export function setDemoMode(on: boolean) {
  if (timer) clearInterval(timer);
  ws?.close();
  if (on || !backendUrl()) startDemo();
  else connectBackend();
}

async function pull() {
  try {
    const [summary, priorities, alerts, model] = await Promise.all([
      api.get<Partial<EnergyState>>("/api/v1/dashboard/summary"),
      api.get<{ loads?: Load[] }>("/api/v1/priorities/latest"),
      api.get<EnergyState["alerts"]>("/api/v1/alerts"),
      api.get<Partial<EnergyState["model"]>>("/api/v1/models/active"),
    ]);
    set((s) => ({
      ...s,
      ...summary,
      loads: priorities.loads ?? summary.loads ?? s.loads,
      alerts: Array.isArray(alerts) ? alerts : s.alerts,
      model: { ...s.model, ...model },
      demo: false,
      connection: ws?.readyState === 1 ? "LIVE" : "SYNCING",
      lastUpdate: Date.now(),
    }));
    return true;
  } catch {
    set((s) => ({ ...s, connection: "CONNECTION LOST" }));
    return false;
  }
}

function connectBackend() {
  set((s) => ({ ...s, demo: false, connection: "SYNCING" }));
  void pull();
  // Realtime via WebSocket; REST polling fallback.
  try {
    const url = backendUrl()!.replace(/^http/, "ws") + "/api/v1/ws";
    ws = new WebSocket(url);
    ws.onopen = () => set((s) => ({ ...s, connection: "LIVE" }));
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as { type: string; data: unknown };
        set((s) => applyEvent(s, msg.type, msg.data));
      } catch { /* ignore malformed */ }
    };
    ws.onclose = () => set((s) => (s.demo ? s : { ...s, connection: "SYNCING" }));
  } catch { /* polling only */ }
  timer = setInterval(() => { if (ws?.readyState !== 1) void pull(); }, 3000);
}

function applyEvent(s: EnergyState, type: string, data: any): EnergyState {
  const now = Date.now();
  switch (type) {
    case "telemetry_update": return { ...s, telemetry: { ...s.telemetry, ...data }, lastUpdate: now };
    case "priority_update":
    case "load_state_change":
      return { ...s, loads: s.loads.map((l) => (l.id === data.id ? { ...l, ...data } : l)), lastUpdate: now };
    case "alert": return { ...s, alerts: [data, ...s.alerts] };
    case "feedback_event":
    case "control_result":
      return { ...s, feedback: s.feedback.map((f) => (f.id === data.id ? { ...f, ...data } : f)) };
    case "model_update": return { ...s, model: { ...s.model, ...data } };
    case "device_status": return { ...s, devices: s.devices.map((d) => (d.id === data.id ? { ...d, ...data } : d)) };
    default: return s;
  }
}

/* ---------------- Actions ---------------- */
export function submitFeedback(load: Load, action: Feedback["action"], durationMin?: number) {
  const fb: Feedback = { id: nextId("fb"), t: Date.now(), loadId: load.id, loadName: load.name, action, durationMin, status: "PENDING" };
  set((s) => ({ ...s, feedback: [fb, ...s.feedback], model: { ...s.model, feedbackSinceTrain: s.model.feedbackSinceTrain + 1 } }));

  if (!get().demo) {
    const isControl = action.includes("temp");
    const req = isControl
      ? api.post("/api/v1/controls/override", { load_id: load.id, state: action.startsWith("Turn ON"), duration_min: durationMin })
      : api.post("/api/v1/feedback", { load_id: load.id, action });
    req
      .then(() => updateFeedback(fb.id, { status: "ACKNOWLEDGED" }))
      .catch(() => updateFeedback(fb.id, { status: "REJECTED BY ESP32", result: "Backend did not accept the request." }));
    return;
  }
  // Demo: simulate backend ack -> ESP32 result
  setTimeout(() => updateFeedback(fb.id, { status: "ACKNOWLEDGED" }), 900);
  setTimeout(() => {
    const soc = get().telemetry.batterySoc;
    const wantsOn = action === "Keep ON" || action === "Turn ON (temp)";
    if (wantsOn && soc < 20) {
      updateFeedback(fb.id, { status: "REJECTED BY ESP32", result: "ESP32 kept load OFF: battery below safe reserve." });
      return;
    }
    const delta = action === "Keep ON" ? 6 : action === "Allow OFF" ? -8 : action === "Wrong decision" ? 0 : 0;
    set((s) => ({
      ...s,
      loads: s.loads.map((l) =>
        l.id !== load.id ? l : {
          ...l,
          priority: clamp(l.priority + delta, 1, 99),
          on: action === "Turn ON (temp)" ? true : action === "Turn OFF (temp)" ? false : action === "Keep ON" ? true : action === "Allow OFF" ? false : !l.on,
          origin: action.includes("temp") ? "USER" : l.origin,
          preference: action === "Keep ON" ? "PREFER ON" : action === "Allow OFF" ? "PREFER OFF" : l.preference,
          learning: "PERSONALIZED",
          decision: action === "Allow OFF" || action === "Turn OFF (temp)" ? "Allow OFF" : "Keep ON",
          reason: action.includes("temp") ? `Temporary user override for ${durationMin ?? 30} min.` : "Updated from your feedback.",
        },
      ),
    }));
    updateFeedback(fb.id, { status: "APPLIED", result: delta ? `Priority ${delta > 0 ? "raised" : "lowered"} by ${Math.abs(delta)}.` : "Applied by ESP32." });
  }, 2200);
}

function updateFeedback(id: string, patch: Partial<Feedback>) {
  set((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
}

export function dismissAlert(id: string) {
  set((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)) }));
}
export function ackAlert(id: string) {
  set((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) }));
}

export function rollbackModel(version: string) {
  if (!get().demo) void api.post(`/api/v1/models/rollback/${version}`, {}).catch(() => {});
  set((s) => ({
    ...s,
    model: {
      ...s.model,
      active: version,
      versions: s.model.versions.map((v) => ({ ...v, active: v.version === version })),
      retrainLog: [{ t: Date.now(), msg: `Rolled back to ${version}` }, ...s.model.retrainLog],
    },
  }));
}

export function triggerRetrain() {
  set((s) => ({ ...s, model: { ...s.model, state: "RETRAINING", retrainLog: [{ t: Date.now(), msg: `Retraining started · ${s.model.feedbackSinceTrain} new samples` }, ...s.model.retrainLog] } }));
  setTimeout(() => {
    set((s) => {
      const [maj = 1, min = 0, patch = 0] = s.model.active.replace("v", "").split(".").map(Number);
      const version = `v${maj}.${min}.${patch + 1}`;
      const acc = +((s.model.versions[0]?.accuracy ?? 90) + Math.random() * 0.8).toFixed(1);
      return {
        ...s,
        model: {
          ...s.model,
          state: "IDLE",
          active: version,
          feedbackSinceTrain: 0,
          versions: [{ version, trainedAt: Date.now(), accuracy: acc, samples: (s.model.versions[0]?.samples ?? 0) + s.model.feedbackSinceTrain, active: true, note: "Incremental retrain from feedback" }, ...s.model.versions.map((v) => ({ ...v, active: false }))],
          retrainLog: [{ t: Date.now(), msg: `${version} promoted · accuracy ${acc}%` }, ...s.model.retrainLog],
        },
      };
    });
  }, 4000);
}
