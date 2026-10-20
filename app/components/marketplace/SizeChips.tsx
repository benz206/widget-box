import { SIZE_LABELS, type WidgetSize } from "@/lib/widgets/types";

export default function SizeChips({ sizes }: { sizes: WidgetSize[] }) {
  return (
    <span className="size-chips">
      {sizes.map((size) => (
        <abbr key={size} title={SIZE_LABELS[size]} className="size-chip">
          {SIZE_LABELS[size][0]}
        </abbr>
      ))}
    </span>
  );
}
