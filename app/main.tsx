import "@fontsource-variable/inter";
import "./globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Backdrop from "./components/Backdrop";
import { APPEARANCE_KEY, applyAppearance, readAppearance } from "./components/ui/appearance";
import NewTab from "./NewTab";
import { registerSystemWidgets } from "@/lib/widgets/system";

registerSystemWidgets();

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (readAppearance() === "system") applyAppearance("system");
});

window.addEventListener("storage", (e) => {
  if (e.key === APPEARANCE_KEY) applyAppearance(readAppearance());
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Backdrop />
    <NewTab />
  </StrictMode>
);
