import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AmbientBackground } from "@/components/nexora/Background";
import { Logo } from "@/components/nexora/Logo";
import { EnergyFlow } from "@/components/nexora/EnergyFlow";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("AI-Powered Intelligent Solar Energy Management", "Nexora Energy monitors solar, battery, grid and every load, and lets AI decide what stays on."),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <AmbientBackground />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"><Logo /><Link to="/overview" className="glass-btn rounded-full px-4 py-2 text-sm font-medium">Sign in</Link></header>
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-8 text-center">
        <p className="rise-in text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">AI-Powered Intelligent Solar Energy Management</p>
        <h1 className="rise-in mx-auto mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">Every watt, decided intelligently.</h1>
        <p className="rise-in mx-auto mt-5 max-w-xl text-muted-foreground">Real-time telemetry from your solar, battery and grid, with a learning model that ranks every load — while the ESP32 keeps hardware safety in charge.</p>
        <Link to="/overview" className="glass-btn rise-in mt-8 inline-flex rounded-full !bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Open the console</Link>
        <div className="glass-2 rise-in mt-14 rounded-[36px] p-4 md:p-8"><EnergyFlow /></div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-battery" />No device secrets in the browser. Hardware safety stays on the ESP32.</p>
      </main>
    </div>
  );
}
