(function () {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles(theme) {
    particles = [];
    const count = theme === 'mystic-void' ? 25 :
                  theme === 'neon-entropy' ? 0 :
                  0;

    if (theme === 'mystic-void') {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.06 + 0.02,
          gold: Math.random() > 0.3,
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const theme = document.documentElement.getAttribute('data-theme') || 'mystic-void';

    if (theme === 'mystic-void') {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(196,163,90,${p.opacity})`
          : `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      }

      // Radial glow at center
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(canvas.width, canvas.height) * 0.6);
      gradient.addColorStop(0, 'rgba(196,163,90,0.03)');
      gradient.addColorStop(0.5, 'rgba(196,163,90,0.01)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function loop() {
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Observe theme changes to recreate particles
  const observer = new MutationObserver(function (mutations) {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') {
        createParticles(document.documentElement.getAttribute('data-theme'));
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true });

  window.addEventListener('resize', resize);
  resize();
  createParticles(document.documentElement.getAttribute('data-theme'));
  loop();
})();
