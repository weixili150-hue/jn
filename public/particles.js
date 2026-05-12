(function () {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animId;
  let mode = 'normal';       // 'normal' | 'loading'
  let currentTheme = null;   // 'mystic-void' | 'neon-entropy' | 'silent-signal'
  let lastTime = 0;          // for delta-time calculations
  let scanlineY = 0;         // neon-entropy scanline
  let scanlineTimer = 0;     // neon-entropy scanline accumulator

  /* ------------------------------------------------------------------ */
  /*  Utilities                                                          */
  /* ------------------------------------------------------------------ */

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function hexChar() {
    var h = '0123456789ABCDEF';
    return h[Math.floor(Math.random() * 16)];
  }

  /* ------------------------------------------------------------------ */
  /*  Engine 1: Mystic Void                                              */
  /* ------------------------------------------------------------------ */

  function initMysticVoid() {
    particles = [];
    var count = 20 + Math.floor(Math.random() * 11); // 20–30
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: rand(0.5, 1.5),
        vx: rand(-0.1, 0.1),
        vy: rand(-0.1, 0.1),
        opacity: rand(0.02, 0.06),
        gold: Math.random() < 0.7,
        // loading-mode spiral state
        spiralAngle: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawMysticVoidNormal() {
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;

    // Brownian particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // wrap around edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? 'rgba(196,163,90,' + p.opacity + ')'
        : 'rgba(255,255,255,' + p.opacity + ')';
      ctx.fill();
    }

    // radial glow
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(canvas.width, canvas.height) * 0.6);
    grad.addColorStop(0, 'rgba(196,163,90,0.03)');
    grad.addColorStop(0.5, 'rgba(196,163,90,0.005)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawMysticVoidLoading() {
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var maxDist = Math.max(canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var dx = cx - p.x;
      var dy = cy - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) {
        // respawn at edge
        var angle = Math.random() * Math.PI * 2;
        p.x = cx + Math.cos(angle) * maxDist;
        p.y = cy + Math.sin(angle) * maxDist;
        p.spiralAngle = Math.atan2(p.y - cy, p.x - cx);
      } else {
        // spiral inward
        p.spiralAngle += 0.03;
        var speed = rand(0.25, 0.45);
        p.x += Math.cos(p.spiralAngle) * speed;
        p.y += Math.sin(p.spiralAngle) * speed;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? 'rgba(196,163,90,' + p.opacity + ')'
        : 'rgba(255,255,255,' + p.opacity + ')';
      ctx.fill();
    }

    // intensified glow
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(canvas.width, canvas.height) * 0.6);
    grad.addColorStop(0, 'rgba(196,163,90,0.06)');
    grad.addColorStop(0.5, 'rgba(196,163,90,0.01)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ------------------------------------------------------------------ */
  /*  Engine 2: Neon Entropy                                             */
  /* ------------------------------------------------------------------ */

  function initNeonEntropy() {
    particles = [];
    var count = mode === 'loading' ? 80 : 40;
    for (var i = 0; i < count; i++) {
      var isPurple = Math.random() < 0.5;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: (mode === 'loading' ? 2 : 1) * rand(1, 3),
        text: hexChar(),
        opacity: rand(0.3, 0.8),
        purple: isPurple,
        color: isPurple ? '#B44DFF' : '#00E5FF',
      });
    }
    scanlineY = 0;
    scanlineTimer = 0;
  }

  function drawNeonEntropyNormal(dt) {
    ctx.font = '14px monospace';
    ctx.textBaseline = 'top';

    // falling characters
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y += p.speed;
      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
        p.text = hexChar();
      }

      var alpha = p.color === '#B44DFF'
        ? 'rgba(180,77,255,' + p.opacity + ')'
        : 'rgba(0,229,255,' + p.opacity + ')';
      ctx.fillStyle = alpha;
      ctx.fillText(p.text, p.x, p.y);
    }

    // scanline
    scanlineTimer += dt;
    scanlineY += dt * 0.2;
    if (scanlineTimer > 3500) {
      scanlineTimer = 0;
      scanlineY = 0;
    }
    if (scanlineY < canvas.height) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, scanlineY, canvas.width, 2);
    }
  }

  function drawNeonEntropyLoading(dt) {
    ctx.font = '14px monospace';
    ctx.textBaseline = 'top';
    var now = Date.now();

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y += p.speed;
      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }

      // flicker: change character every frame
      p.text = hexChar();

      // cycle colours faster
      var hue = (now * 0.003 + p.x) % 360;
      p.purple = Math.sin(now * 0.005 + p.x * 0.1) > 0;
      p.color = p.purple ? '#B44DFF' : '#00E5FF';

      var alpha = p.color === '#B44DFF'
        ? 'rgba(180,77,255,' + p.opacity + ')'
        : 'rgba(0,229,255,' + p.opacity + ')';
      ctx.fillStyle = alpha;
      ctx.fillText(p.text, p.x, p.y);
    }

    // faster scanline
    scanlineTimer += dt;
    scanlineY += dt * 0.4;
    if (scanlineTimer > 1500) {
      scanlineTimer = 0;
      scanlineY = 0;
    }
    if (scanlineY < canvas.height) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(0, scanlineY, canvas.width, 2);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Engine 3: Silent Signal                                            */
  /* ------------------------------------------------------------------ */

  function initSilentSignal() {
    particles = [];
    var count = 3 + Math.floor(Math.random() * 3); // 3–5
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseR: rand(2, 4),
        r: 0,
        baseOpacity: rand(0.03, 0.08),
        opacity: 0,
        phase: Math.random() * Math.PI * 2,
        cycle: rand(5, 8), // seconds per full breath cycle
      });
    }
  }

  function drawSilentSignalNormal(time) {
    var seconds = time * 0.001;

    // breathing ink dots
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var t = (seconds % p.cycle) / p.cycle;
      var breathe = Math.sin(t * Math.PI * 2 + p.phase);
      p.r = p.baseR * (1 + breathe * 0.2);
      p.opacity = p.baseOpacity * (0.7 + (breathe + 1) / 2 * 0.6);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,' + p.opacity + ')';
      ctx.fill();
    }

    // paper texture grain (~0.5 % pixel coverage)
    var grainCount = Math.floor(canvas.width * canvas.height * 0.005);
    for (var g = 0; g < grainCount; g++) {
      var gx = Math.random() * canvas.width;
      var gy = Math.random() * canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,' + rand(0.01, 0.02) + ')';
      ctx.fillRect(gx, gy, 1, 1);
    }
  }

  function drawSilentSignalLoading(time) {
    var seconds = time * 0.001;
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;

    // single prominent center dot
    var centerCycle = 3;
    var ct = (seconds % centerCycle) / centerCycle;
    var breathe = Math.sin(ct * Math.PI * 2);
    var cr = 5 + breathe * 3;
    var copacity = 0.08 + (breathe + 1) / 2 * 0.12; // 0.08–0.2

    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,' + copacity + ')';
    ctx.fill();

    // peripheral dots faded
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var t = (seconds % p.cycle) / p.cycle;
      var breathe2 = Math.sin(t * Math.PI * 2 + p.phase);
      p.r = p.baseR * (1 + breathe2 * 0.2);
      p.opacity = p.baseOpacity * 0.15;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,' + p.opacity + ')';
      ctx.fill();
    }

    // paper texture grain
    var grainCount = Math.floor(canvas.width * canvas.height * 0.005);
    for (var g = 0; g < grainCount; g++) {
      var gx = Math.random() * canvas.width;
      var gy = Math.random() * canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,' + rand(0.01, 0.02) + ')';
      ctx.fillRect(gx, gy, 1, 1);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Draw dispatcher                                                    */
  /* ------------------------------------------------------------------ */

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (currentTheme) {
      case 'neon-entropy': {
        var dt = lastTime ? time - lastTime : 16.667;
        if (mode === 'loading') {
          drawNeonEntropyLoading(dt);
        } else {
          drawNeonEntropyNormal(dt);
        }
        break;
      }
      case 'silent-signal':
        if (mode === 'loading') {
          drawSilentSignalLoading(time);
        } else {
          drawSilentSignalNormal(time);
        }
        break;
      default:
        // mystic-void
        if (mode === 'loading') {
          drawMysticVoidLoading();
        } else {
          drawMysticVoidNormal();
        }
        break;
    }

    lastTime = time;
  }

  function loop(time) {
    draw(time);
    animId = requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ */
  /*  Initialise engine for current theme                                */
  /* ------------------------------------------------------------------ */

  function initEngine(theme) {
    currentTheme = theme || 'mystic-void';
    lastTime = 0;
    switch (currentTheme) {
      case 'neon-entropy':
        initNeonEntropy();
        break;
      case 'silent-signal':
        initSilentSignal();
        break;
      default:
        initMysticVoid();
        break;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Mode detection                                                     */
  /* ------------------------------------------------------------------ */

  function detectMode() {
    var prev = mode;
    mode = document.querySelector('.loading-overlay') ? 'loading' : 'normal';
    if (prev !== mode && currentTheme) {
      initEngine(currentTheme);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Observers                                                          */
  /* ------------------------------------------------------------------ */

  // theme changes on <html data-theme="...">
  var themeObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === 'data-theme') {
        initEngine(document.documentElement.getAttribute('data-theme'));
        return;
      }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  // loading overlay appearing / disappearing
  var loadingObserver = new MutationObserver(function () {
    detectMode();
  });
  loadingObserver.observe(document.body, { childList: true, subtree: true });

  /* ------------------------------------------------------------------ */
  /*  Bootstrap                                                          */
  /* ------------------------------------------------------------------ */

  window.addEventListener('resize', resize);
  resize();
  detectMode(); // set initial mode
  initEngine(document.documentElement.getAttribute('data-theme'));
  requestAnimationFrame(loop);
})();
