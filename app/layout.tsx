import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APPEARANCE_BOOTSTRAP } from "./components/ui/appearance";

export const metadata: Metadata = {
  title: "Widget Box",
  description: "A personal dashboard of glanceable widgets.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Resolves the appearance before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
