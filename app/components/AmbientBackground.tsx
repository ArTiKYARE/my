"use client";

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Soft gradient orbs */}
      <div className="absolute -top-[20%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-primary/8 blur-[120px] animate-pulse-slow" />
      <div className="absolute top-[40%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-white/[0.03] blur-[100px] animate-pulse-slow delay-1000" />
      <div className="absolute -bottom-[10%] left-[20%] h-[45vh] w-[45vh] rounded-full bg-primary/6 blur-[90px] animate-pulse-slow delay-2000" />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
