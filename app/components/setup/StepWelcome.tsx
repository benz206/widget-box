"use client";

export default function StepWelcome() {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
        <span className="text-white font-bold text-2xl">W</span>
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
        Welcome to widget-box
      </h1>
      <p className="text-white/60 text-lg max-w-md leading-relaxed mb-10">
        A personal dashboard of beautiful, glanceable widgets.
        Let's set up yours in under a minute.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {[
          { icon: "◈", label: "Pick from 12+ widgets" },
          { icon: "✦", label: "Customize each one" },
          { icon: "⤢", label: "Drag, resize, rearrange" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10"
          >
            <span className="text-blue-400 text-sm w-5 text-center shrink-0">{icon}</span>
            <span className="text-white/80 text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
