export type LoadKind = "fan" | "led" | "decor" | "pump" | "socket" | "fridge" | "router";
export type Learning = "COLD START" | "ML MODEL" | "PERSONALIZED";
export type Origin = "ML" | "USER" | "ENERGY SHEDDING" | "ESP32 SAFETY";
export type Preference = "NEUTRAL" | "PREFER ON" | "PREFER OFF";
export type Source = "SOLAR" | "BATTERY" | "GRID" | "HYBRID";
export type Connection = "LIVE" | "SYNCING" | "CONNECTION LOST" | "DEMO";
export type Severity = "info" | "warning" | "critical";

export interface Load {
  id: string;
  name: string;
  kind: LoadKind;
  on: boolean;
  powerW: number;
  ratedW: number;
  priority: number;
  confidence: number;
  learning: Learning;
  decision: string;
  reason: string;
  origin: Origin;
  preference: Preference;
  deviceId: string;
  energyTodayWh: number;
  history: { t: number; power: number; priority: number; confidence: number; on: number }[];
}

export interface Telemetry {
  t: number;
  solarW: number;
  solarV: number;
  solarA: number;
  solarTodayKWh: number;
  batteryV: number;
  batterySoc: number;
  batteryW: number; // + charging, - discharging
  batteryTempC: number;
  gridAvailable: boolean;
  gridW: number;
  gridV: number;
  loadW: number;
  source: Source;
}

export interface HistoryPoint {
  t: number;
  solar: number;
  load: number;
  soc: number;
  grid: number;
  battery: number;
}

export interface Alert {
  id: string;
  t: number;
  severity: Severity;
  category: "Battery" | "Solar" | "Grid" | "Device" | "Model" | "Load";
  title: string;
  detail: string;
  dismissed: boolean;
  acknowledged: boolean;
}

export interface Feedback {
  id: string;
  t: number;
  loadId: string;
  loadName: string;
  action: "Keep ON" | "Allow OFF" | "Turn ON (temp)" | "Turn OFF (temp)" | "Wrong decision";
  durationMin?: number;
  status: "PENDING" | "ACKNOWLEDGED" | "APPLIED" | "REJECTED BY ESP32";
  result?: string;
}

export interface Device {
  id: string;
  name: string;
  firmware: string;
  online: boolean;
  rssi: number;
  uptimeH: number;
  lastSeen: number;
  loads: string[];
  telemetryHz: number;
}

export interface ModelVersion {
  version: string;
  trainedAt: number;
  accuracy: number;
  samples: number;
  active: boolean;
  note: string;
}

export interface ModelStatus {
  active: string;
  state: "IDLE" | "INFERRING" | "RETRAINING";
  lastInference: number;
  inferenceMs: number;
  feedbackSinceTrain: number;
  nextRetrainAt: number;
  versions: ModelVersion[];
  retrainLog: { t: number; msg: string }[];
}

export interface EnergyState {
  connection: Connection;
  demo: boolean;
  telemetry: Telemetry;
  loads: Load[];
  history: HistoryPoint[];
  alerts: Alert[];
  feedback: Feedback[];
  devices: Device[];
  model: ModelStatus;
  lastUpdate: number;
}
