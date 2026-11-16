// Claro por padrão; o botão alterna para o escuro e lembra a escolha neste navegador.
(() => {
  const KEY = "pa-watch-bb-theme";
  const root = document.documentElement;
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* sem storage: só não lembra */ } };

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "theme-toggle";
  const apply = (mode) => {
    root.dataset.theme = mode;
    const dark = mode === "dark";
    btn.textContent = dark ? "☀ Claro" : "☾ Escuro";
    btn.setAttribute("aria-label", dark ? "Mudar para o tema claro" : "Mudar para o tema escuro");
  };
  btn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    save(next);
  });
  apply(read() === "dark" ? "dark" : "light");
  document.querySelector(".top-inner").appendChild(btn);
})();
