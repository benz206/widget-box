import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
type Styling = { variant?: Variant; size?: Size; iconOnly?: boolean };

export function buttonClass({ variant = "secondary", size = "md", iconOnly }: Styling, className?: string) {
  return ["btn", `btn-${variant}`, size !== "md" && `btn-${size}`, iconOnly && "btn-icon", "focus-ring", className]
    .filter(Boolean)
    .join(" ");
}

export default function Button({
  variant,
  size,
  iconOnly,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & Styling) {
  return <button type={type} className={buttonClass({ variant, size, iconOnly }, className)} {...props} />;
}

export function ButtonLink({ variant, size, iconOnly, className, ...props }: ComponentProps<typeof Link> & Styling) {
  return <Link className={buttonClass({ variant, size, iconOnly }, className)} {...props} />;
}
