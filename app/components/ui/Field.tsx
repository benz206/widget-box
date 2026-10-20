export default function Field({
  label,
  hint,
  group,
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  group?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={`field ${className ?? ""}`} role={group ? "group" : undefined}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </Tag>
  );
}
