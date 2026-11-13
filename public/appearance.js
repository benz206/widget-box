(function () {
  var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  try {
    var p = localStorage.getItem("widget-box:appearance") || "system";
    dark = p === "dark" || (p !== "light" && dark);
    document.querySelector('meta[name="color-scheme"]').content = p === "light" || p === "dark" ? p : "light dark";
  } catch (e) {}
  document.documentElement.dataset.appearance = dark ? "dark" : "light";
})();
