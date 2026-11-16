(() => {
  const root = document.documentElement;
  const canvas = document.getElementById("net");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (min, max) => min + Math.random() * (max - min);

  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let running = true;
    const small = window.innerWidth < 720;
    const count = Math.round(Math.min(78, Math.max(42, (window.innerWidth * window.innerHeight) / 18000)));
    const nodes = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00016,
      vy: (Math.random() - 0.5) * 0.00012,
    }));

    const coinPalettes = [
      ["#fff3cf", "#e2c78a", "#9c7a36", "rgba(110, 80, 25, 0.9)"],
      ["#f3eeff", "#a78bfa", "#5b21b6", "rgba(60, 20, 120, 0.9)"],
    ];

    function makeCoin(fromBottom) {
      return {
        x: Math.random(),
        y: fromBottom ? 1.08 : Math.random(),
        r: rand(small ? 6 : 7, small ? 11 : 15),
        vy: rand(0.00025, 0.0006),
        sway: rand(0.4, 1.2),
        phase: rand(0, Math.PI * 2),
        spin: rand(0.02, 0.05),
        tilt: rand(-0.4, 0.4),
        alpha: rand(0.35, 0.75),
        pal: coinPalettes[Math.random() < 0.55 ? 0 : 1],
      };
    }

    const coins = Array.from({ length: small ? 9 : 16 }, () => makeCoin(false));
    const sparkles = Array.from({ length: small ? 14 : 26 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: rand(3, 7),
      t: rand(0, Math.PI * 2),
      speed: rand(0.02, 0.05),
      violet: Math.random() < 0.45,
    }));

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawCoin(c, time) {
      const face = Math.cos(c.phase);
      const x = c.x * w + Math.sin(time * 0.0006 * c.sway + c.phase) * 18;
      const y = c.y * h;
      const [hi, mid, lo, rim] = c.pal;

      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.translate(x, y);
      ctx.rotate(c.tilt);
      ctx.scale(Math.max(0.14, Math.abs(face)), 1);

      const grad = ctx.createLinearGradient(-c.r, -c.r, c.r, c.r);
      grad.addColorStop(0, hi);
      grad.addColorStop(0.5, mid);
      grad.addColorStop(1, lo);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rim;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, c.r * 0.66, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 245, 220, 0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function drawSparkle(s) {
      const a = Math.max(0, Math.sin(s.t));
      if (a < 0.02) return;
      const x = s.x * w;
      const y = s.y * h;
      const r = s.size * a;
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = s.violet ? "#d9ccff" : "#fff1c9";
      ctx.shadowColor = s.violet ? "#8b5cf6" : "#e2c78a";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
      ctx.restore();
    }

    function frame(time) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      });

      const reach = Math.min(168, Math.max(110, Math.min(w, h) * 0.18));

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const ax = a.x * w;
        const ay = a.y * h;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const bx = b.x * w;
          const by = b.y * h;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.hypot(dx, dy);
          if (dist > reach) continue;

          const fade = 1 - dist / reach;
          const mix = (a.x + b.x) * 0.5;
          const r = 226 + (167 - 226) * mix;
          const g = 199 + (139 - 199) * mix;
          const bl = 138 + (250 - 138) * mix;
          ctx.strokeStyle = `rgba(${r | 0}, ${g | 0}, ${bl | 0}, ${(0.28 * fade).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        ctx.fillStyle = a.x < 0.5 ? "rgba(246, 231, 196, 0.85)" : "rgba(196, 181, 253, 0.9)";
        ctx.beginPath();
        ctx.arc(ax, ay, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }

      sparkles.forEach((s) => {
        s.t += s.speed;
        if (s.t > Math.PI * 2) {
          s.t = 0;
          s.x = Math.random();
          s.y = Math.random();
        }
        drawSparkle(s);
      });

      coins.forEach((c, i) => {
        c.y -= c.vy;
        c.phase += c.spin;
        if (c.y < -0.08) coins[i] = makeCoin(true);
        drawCoin(c, time);
      });

      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      const hidden = document.hidden;
      if (hidden) running = false;
      else if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    });
    requestAnimationFrame(frame);
  }

  const fx = document.getElementById("confetti");
  const fxCtx = fx?.getContext("2d");
  const confettiColors = ["#f6e1b0", "#e2c78a", "#c6a15a", "#c4b5fd", "#8b5cf6", "#ffffff"];
  let pieces = [];
  let fxRunning = false;

  function fxFrame() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    fxCtx.clearRect(0, 0, w, h);

    pieces = pieces.filter((p) => p.life < p.max && p.y < h + 40);
    pieces.forEach((p) => {
      p.life++;
      p.vx *= 0.985;
      p.vy += 0.22;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      fxCtx.save();
      fxCtx.globalAlpha = Math.min(1, (p.max - p.life) / 25);
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate(p.rot);
      fxCtx.scale(1, Math.cos(p.life * 0.18));
      fxCtx.fillStyle = p.color;
      fxCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      fxCtx.restore();
    });

    if (pieces.length) requestAnimationFrame(fxFrame);
    else fxRunning = false;
  }

  function burst(x, y) {
    if (!fxCtx || reduce) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.floor(window.innerWidth * dpr);
    const ch = Math.floor(window.innerHeight * dpr);
    if (fx.width !== cw || fx.height !== ch) {
      fx.width = cw;
      fx.height = ch;
    }
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (let i = 0; i < 70; i++) {
      const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      const speed = rand(4, 11);
      pieces.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: rand(4, 8),
        h: rand(7, 13),
        rot: rand(0, Math.PI),
        vr: rand(-0.25, 0.25),
        color: confettiColors[(Math.random() * confettiColors.length) | 0],
        life: 0,
        max: rand(80, 120),
      });
    }

    if (!fxRunning) {
      fxRunning = true;
      requestAnimationFrame(fxFrame);
    }
  }

  function burstFrom(el) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
  }

  const counted = new WeakSet();
  const pending = [];

  function countUp(el) {
    if (counted.has(el)) return;
    counted.add(el);
    const target = Number(el.dataset.count);
    const format = (v) => Math.round(v).toLocaleString("pl-PL");
    if (reduce) {
      el.textContent = format(target);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    el.textContent = format(0);

    function step(now) {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      el.textContent = format(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function runCounts(scope) {
    const targets = scope.matches?.("[data-count]") ? [scope] : scope.querySelectorAll("[data-count]");
    targets.forEach((el) => {
      if (root.classList.contains("age-ok")) countUp(el);
      else pending.push(el);
    });
  }

  const gate = document.querySelector(".gate");

  document.querySelector("[data-gate='enter']")?.addEventListener("click", () => {
    try {
      sessionStorage.setItem("age18", "1");
    } catch (e) {}
    root.classList.add("age-ok");
    pending.splice(0).forEach(countUp);
  });

  document.querySelector("[data-gate='leave']")?.addEventListener("click", () => {
    gate?.classList.add("is-denied");
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          runCounts(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  const pair = document.querySelector(".pair");
  if (pair) {
    let ticking = false;
    const updateDock = () => {
      ticking = false;
      root.classList.toggle("dock-on", pair.getBoundingClientRect().bottom < window.innerHeight * 0.35);
    };
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateDock);
      },
      { passive: true }
    );
    updateDock();
  }

  if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".card").forEach((card) => {
      const glare = document.createElement("span");
      glare.className = "glare";
      card.appendChild(glare);

      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.classList.add("is-tilt");
        card.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 8).toFixed(2)}deg) rotateY(${((px - 0.5) * 10).toFixed(2)}deg) translateY(-6px)`;
        card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      });

      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilt");
        card.style.transform = "";
      });
    });
  }

  document.querySelectorAll(".btn-cta, .dock-btn").forEach((link) => {
    link.addEventListener("click", () => burstFrom(link));
  });

  const toast = document.querySelector(".toast");
  let toastTimer = 0;

  function showToast() {
    if (!toast) return;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 1800);
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy") || "";
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
      button.classList.add("is-copied");
      showToast();
      burstFrom(button);
      window.setTimeout(() => button.classList.remove("is-copied"), 1400);
    });
  });
})();
