(() => {
  const root = document.documentElement;
  const gate = document.querySelector(".gate");
  const note = document.getElementById("copyNote");
  let noteTimer = 0;

  document.querySelector("[data-gate='enter']")?.addEventListener("click", () => {
    try {
      sessionStorage.setItem("age18", "1");
    } catch (e) {}
    root.classList.add("age-ok");
  });

  document.querySelector("[data-gate='leave']")?.addEventListener("click", () => {
    gate?.classList.add("is-denied");
  });

  async function copyCode(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy") || "CIOS";
      await copyCode(value);
      button.classList.add("is-copied");
      if (note) {
        note.textContent = "Kod CIOS skopiowany";
        window.clearTimeout(noteTimer);
        noteTimer = window.setTimeout(() => {
          note.textContent = "";
        }, 2200);
      }
      window.setTimeout(() => button.classList.remove("is-copied"), 1400);
    });
  });
})();
