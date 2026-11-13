import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function stripManifestKey(): Plugin {
  return {
    name: "strip-manifest-key",
    apply: "build",
    writeBundle({ dir }) {
      const file = join(dir!, "manifest.json");
      const manifest = JSON.parse(readFileSync(file, "utf8"));
      delete manifest.key;
      writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
    },
  };
}

export default defineConfig(({ mode }) => {
  const store = mode === "store";
  return {
    plugins: [react(), tailwindcss(), store && stripManifestKey()],
    envDir: store ? false : undefined,
    resolve: {
      alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
    },
    build: {
      outDir: store ? "release/widget-box" : "dist",
      emptyOutDir: store,
      rollupOptions: { input: "newtab.html" },
    },
  };
});
