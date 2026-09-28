const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 1.7) % 14,
  dur: 16 + ((i * 5) % 12),
  size: 2 + (i % 3),
}));

export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="ambient-blob absolute -left-[10%] -top-[15%] h-[60vh] w-[60vw] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, var(--ambient-a), transparent)" }} />
      <div className="ambient-blob absolute -right-[10%] top-[10%] h-[55vh] w-[50vw] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, var(--ambient-c), transparent)", animationDelay: "-7s" }} />
      <div className="ambient-blob absolute bottom-[-20%] left-[20%] h-[60vh] w-[55vw] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, var(--ambient-b), transparent)", animationDelay: "-13s" }} />
      <div className="ambient-blob absolute bottom-[5%] right-[5%] h-[40vh] w-[35vw] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, var(--ambient-d), transparent)", animationDelay: "-3s" }} />
      <svg className="absolute inset-x-0 bottom-0 h-[40vh] w-full opacity-40" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M0 200 C 300 140, 500 260, 800 190 S 1100 150, 1200 180" fill="none" stroke="var(--glass-edge)" strokeWidth="1.2" className="flow-line" style={{ animationDuration: "12s" }} />
        <path d="M0 240 C 250 200, 600 290, 900 230 S 1150 210, 1200 230" fill="none" stroke="var(--glass-edge)" strokeWidth="1" className="flow-line reverse" style={{ animationDuration: "16s" }} />
      </svg>
      {PARTICLES.map((p, i) => (
        <span key={i} className="particle absolute bottom-0 rounded-full bg-foreground/15" style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
      ))}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-multiply" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    </div>
  );
}
