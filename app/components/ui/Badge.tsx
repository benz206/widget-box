type Tone = "neutral" | "positive" | "warning" | "negative" | "accent";

export default function Badge({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="badge" data-tone={tone}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
