import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { listWidgets } from "@/lib/widgets/registry";
import { registerSystemWidgets } from "@/lib/widgets/system";
import WidgetTile from "./components/WidgetTile";

registerSystemWidgets();

export default async function Home() {
  const session = await getServerAuthSession();
  const widgets = listWidgets();
  const user = session?.user;

  // Fetch data for each widget (simple defaults)
  const widgetsWithData = await Promise.all(
    widgets.map(async (w) => {
      const data = await w.fetchData({} as any, { now: new Date() });
      const display = w.toDisplay ? w.toDisplay(data as any) : (data as any);
      return { def: w, display } as const;
    })
  );

  return (
    <div className="min-h-screen p-6 md:p-10">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">widget-box</h1>
        <nav className="flex gap-3 text-sm">
          {user ? (
            <span className="text-white/90">{user.email}</span>
          ) : (
            <Link href="/login" className="underline">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      <main className="widget-grid grid grid-flow-dense content-start items-start">
        {widgetsWithData.map(({ def, display }) => (
          <WidgetTile
            key={def.meta.id}
            id={def.meta.id}
            title={def.meta.name}
            subtitle={def.meta.provider}
            size={def.meta.size as any}
            initial={display}
          />
        ))}
      </main>
    </div>
  );
}

function Preview({ meta }: { meta: { name: string; desc?: string } }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-3xl font-semibold tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,.4)]">
        {meta.name}
      </div>
      {meta.desc && (
        <div className="text-xs mt-1 opacity-80 max-w-[18ch]">{meta.desc}</div>
      )}
    </div>
  );
}
