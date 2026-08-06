"use client";

import { WidgetHeader } from "@/app/components/widgets/kit";
import { useWidgetState } from "../state";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#ffd60a";

function NotesView({ instanceId, size, config }: WidgetViewProps) {
  const [text, setText] = useWidgetState(instanceId, "text", "");
  const title = String(config.title || "Notes");

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <WidgetHeader icon="note" label={title} accent={ACCENT} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Type a note…"
        spellCheck={false}
        className="focus-ring w-full flex-1 resize-none bg-transparent leading-snug text-label outline-none placeholder:text-tertiary"
        style={{ fontSize: size === "small" ? 12 : 13.5 }}
      />
    </div>
  );
}

export const notesWidget: WidgetDefinition = {
  meta: {
    id: "system.notes",
    name: "Notes",
    tagline: "A scratchpad that is always there.",
    description: "Free text, saved as you type and kept in this browser.",
    category: "productivity",
    icon: "note",
    accent: ACCENT,
    tags: ["notes", "scratchpad"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  defaultConfig: { title: "Notes" },
  configFields: [
    { kind: "text", key: "title", label: "Title", placeholder: "Notes" },
  ],
  View: NotesView,
};
