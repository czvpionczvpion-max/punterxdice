(() => {
  const root = document.documentElement;
  const gate = document.querySelector(".gate");
  const status = document.getElementById("copyStatus");
  let statusTimer = 0;

  const enter = document.querySelector("[data-gate='enter']");
  enter?.addEventListener("click", () => {
    try {
      sessionStorage.setItem("age18", "1");
    } catch (e) {}
    root.classList.add("age-ok");
  });

  document.querySelector("[data-gate='leave']")?.addEventListener("click", () => {
    gate?.classList.add("is-denied");
  });

  if (gate && !root.classList.contains("age-ok")) {
    enter?.focus();
    gate.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || root.classList.contains("age-ok")) return;
      const items = [...gate.querySelectorAll("button")].filter((node) => node.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  async function copyCode(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (e) {
      try {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        return ok;
      } catch (err) {
        return false;
      }
    }
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy") || "CIOS";
      const ok = await copyCode(value);
      if (!ok) {
        const code = document.getElementById("promo-code");
        if (code) {
          const range = document.createRange();
          range.selectNodeContents(code);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      if (status) {
        status.textContent = ok
          ? "Kod CIOS skopiowany."
          : "Nie udało się skopiować. Kod CIOS jest zaznaczony — skopiuj go ręcznie.";
        window.clearTimeout(statusTimer);
        statusTimer = window.setTimeout(() => {
          status.textContent = "";
        }, 2400);
      }
      if (!ok) return;
      button.classList.add("is-copied");
      window.setTimeout(() => button.classList.remove("is-copied"), 1600);
    });
  });
})();

(() => {
  const canvas = document.getElementById("bg-anim");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const brass = { core: "228, 194, 122", deep: "154, 116, 58", light: "#f8edd4" };
  const violet = { core: "186, 164, 255", deep: "124, 96, 214", light: "#f4efff" };

  let w = 0;
  let h = 0;
  let dpr = 1;
  let t = 0;
  let raf = 0;
  let running = true;

  const blobs = [
    { x: 0.14, y: 0.2, r: 0.34, a: 0.16, s: 0.22, p: 0.4, pal: brass },
    { x: 0.84, y: 0.16, r: 0.32, a: 0.14, s: 0.18, p: 1.3, pal: violet },
    { x: 0.7, y: 0.78, r: 0.26, a: 0.08, s: 0.2, p: 2.2, pal: brass },
  ];

  const embers = Array.from({ length: 42 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.35 + Math.random() * 0.65,
    tw: Math.random() * Math.PI * 2,
    sp: 0.08 + Math.random() * 0.16,
    pal: i % 3 === 0 ? violet : brass,
  }));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function blob(x, y, r, alpha, pal) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(" + pal.core + ", " + alpha + ")");
    g.addColorStop(0.5, "rgba(" + pal.deep + ", " + alpha * 0.4 + ")");
    g.addColorStop(1, "rgba(" + pal.core + ", 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function paint(still) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    blobs.forEach((b, i) => {
      const nx = (b.x + (still ? 0 : Math.sin(t * b.s + b.p) * 0.05)) * w;
      const ny = (b.y + (still ? 0 : Math.cos(t * b.s * 0.8 + b.p) * 0.04)) * h;
      const nr = Math.min(w, h) * b.r;
      blob(nx, ny, nr, b.a, b.pal);
    });
    embers.forEach((s) => {
      if (!still) {
        s.y -= s.sp * 0.0011;
        s.tw += 0.02;
        if (s.y < -0.04) {
          s.y = 1.04;
          s.x = Math.random();
        }
      }
      const x = s.x * w + Math.sin(s.tw) * 10;
      const y = s.y * h;
      const pulse = 0.25 + (Math.sin(s.tw * 1.4) + 1) * 0.22;
      ctx.globalAlpha = pulse * s.z;
      ctx.fillStyle = s.z > 0.75 ? s.pal.light : "rgb(" + s.pal.core + ")";
      ctx.beginPath();
      ctx.arc(x, y, 0.8 + s.z * 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function frame() {
    if (!running) return;
    paint(false);
    t += 0.01;
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !reduce) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
  });

  resize();
  if (reduce) {
    paint(true);
  } else {
    raf = requestAnimationFrame(frame);
  }
})();
