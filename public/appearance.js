(function () {
  try {
    var p = localStorage.getItem("widget-box:appearance") || "system";
    var d = p === "dark" || (p !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.appearance = d ? "dark" : "light";
  } catch (e) {
    document.documentElement.dataset.appearance = "light";
  }
})();
