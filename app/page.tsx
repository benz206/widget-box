import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { listWidgets } from "@/lib/widgets/registry";
import { registerSystemWidgets } from "@/lib/widgets/system";
import WidgetShell from "./components/WidgetShell";

registerSystemWidgets();

export default async function Home() {
  const session = await getServerAuthSession();
  const widgets = listWidgets();
  const user = session?.user;

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
      <main
        className="grid auto-rows-[64px] grid-cols-2 sm:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6"
      >
        {widgets.map((w) => (
          <WidgetShell
            key={w.meta.id}
            title={w.meta.name}
            subtitle={w.meta.provider}
            size={w.meta.size as any}
          >
            <Preview meta={{ name: w.meta.name, desc: w.meta.description }} />
          </WidgetShell>
        ))}
      </main>
    </div>
  );
}

function Preview({
  meta,
}: {
  meta: { name: string; desc?: string };
}) {
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
