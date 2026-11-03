import "@fontsource-variable/inter";
import "./globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Backdrop from "./components/Backdrop";
import { applyAppearance, readAppearance } from "./components/ui/appearance";
import NewTab from "./NewTab";
import { registerSystemWidgets } from "@/lib/widgets/system";

registerSystemWidgets();

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (readAppearance() === "system") applyAppearance("system");
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Backdrop />
    <NewTab />
  </StrictMode>
);
