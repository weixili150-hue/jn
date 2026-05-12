(function () {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animId;
  let currentTheme = 'mystic-void';
  let mode = 'normal'; // 'normal' | 'converge' | 'breath'
  let lastTime = 0;

  // Ink ripple state
  let ripples = []; // { x, y, radius, maxRadius, opacity }

  // Data rain state
  let rainDrops = [];
  let rainActive = false;
  let rainSpeed = 1;

  // Breath state
  let breathIntensity = 0.5;

  // Converge state
  let convergeStartTime = 0;

  // Scanline state
  let scanlineY = 0;
  let scanlineTimer = 0;

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

  function initMystic() {
    particles = [];
    var count = 20 + Math.floor(Math.random() * 11); // 20-30
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: rand(0.5, 1.5),
        vx: rand(-0.1, 0.1),
        vy: rand(-0.1, 0.1),
        opacity: rand(0.02, 0.06),
        gold: Math.random() < 0.7,
        homeX: 0,
        homeY: 0,
      });
    }
  }

  function drawMysticNormal() {
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;

    // Brownian particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
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

    // Radial glow at screen center
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(canvas.width, canvas.height) * 0.6);
    grad.addColorStop(0, 'rgba(196,163,90,0.03)');
    grad.addColorStop(0.5, 'rgba(196,163,90,0.005)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawMysticConverge(time) {
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var maxDist = Math.max(canvas.width, canvas.height);
    var elapsed = (time - convergeStartTime) * 0.001;

    // Glow intensifies: 0.03 -> 0.08 over ~5 seconds
    var glow = 0.03 + Math.min(elapsed / 5, 1) * 0.05;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var dx = cx - p.x;
      var dy = cy - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3) {
        // Particle reached center: shrink and fade
        p.r *= 0.95;
        p.opacity *= 0.95;

        if (p.r < 0.1 || p.opacity < 0.001) {
          // Respawn at edge
          var spawnAngle = Math.random() * Math.PI * 2;
          p.x = cx + Math.cos(spawnAngle) * maxDist * 0.9;
          p.y = cy + Math.sin(spawnAngle) * maxDist * 0.9;
          p.r = rand(0.5, 1.5);
          p.opacity = rand(0.02, 0.06);
        }
      } else {
        // Spiral inward toward center
        var angle = Math.atan2(dy, dx);
        angle += 0.03; // spiral rotation per frame
        var speed = 0.3 + elapsed * 0.08; // gradually increases
        if (speed > 2.5) speed = 2.5;
        p.x += Math.cos(angle) * speed;
        p.y += Math.sin(angle) * speed;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? 'rgba(196,163,90,' + p.opacity + ')'
        : 'rgba(255,255,255,' + p.opacity + ')';
      ctx.fill();
    }

    // Intensified radial glow
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(canvas.width, canvas.height) * 0.6);
    grad.addColorStop(0, 'rgba(196,163,90,' + glow + ')');
    grad.addColorStop(0.5, 'rgba(196,163,90,' + (glow * 0.15) + ')');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ------------------------------------------------------------------ */
  /*  Engine 2: Neon Entropy                                             */
  /* ------------------------------------------------------------------ */

  function initRainDrops(count) {
    rainDrops = [];
    for (var i = 0; i < count; i++) {
      rainDrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: rand(1, 3) * rainSpeed,
        char: hexChar(),
        color: Math.random() < 0.5 ? '#B44DFF' : '#00E5FF',
        opacity: rand(0.3, 0.8),
      });
    }
    scanlineY = 0;
    scanlineTimer = 0;
  }

  function drawNeon(dt) {
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.textBaseline = 'top';

    // Adjust drop count based on rainSpeed: 40 normal, 80+ when speed > 1
    var target = rainSpeed > 1 ? Math.floor(80 * rainSpeed) : 40;
    while (rainDrops.length < target) {
      rainDrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: rand(1, 3) * rainSpeed,
        char: hexChar(),
        color: Math.random() < 0.5 ? '#B44DFF' : '#00E5FF',
        opacity: rand(0.3, 0.8),
      });
    }
    while (rainDrops.length > target) {
      rainDrops.pop();
    }

    // Update speeds each frame so setRainSpeed takes effect immediately
    for (var i = 0; i < rainDrops.length; i++) {
      var d = rainDrops[i];
      d.speed = rand(1, 3) * rainSpeed;
    }

    // Falling hex characters
    for (var i = 0; i < rainDrops.length; i++) {
      var d = rainDrops[i];
      d.y += d.speed;
      if (d.y > canvas.height) {
        d.y = -20;
        d.x = Math.random() * canvas.width;
        d.char = hexChar();
      }

      var alpha = d.color === '#B44DFF'
        ? 'rgba(180,77,255,' + d.opacity + ')'
        : 'rgba(0,229,255,' + d.opacity + ')';
      ctx.fillStyle = alpha;
      ctx.fillText(d.char, d.x, d.y);
    }

    // Scanline: thin horizontal line sweeping every 3.5s
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

  /* ------------------------------------------------------------------ */
  /*  Engine 3: Silent Signal                                            */
  /* ------------------------------------------------------------------ */

  function initSilent() {
    particles = [];
    ripples = [];
    var count = 3 + Math.floor(Math.random() * 3); // 3-5
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

  function drawPaperGrain() {
    var grainCount = Math.floor(canvas.width * canvas.height * 0.003); // 0.3% coverage
    for (var g = 0; g < grainCount; g++) {
      var gx = Math.random() * canvas.width;
      var gy = Math.random() * canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,0.01)';
      ctx.fillRect(gx, gy, 1, 1);
    }
  }

  function drawSilentNormal(time) {
    var seconds = time * 0.001;

    // Breathing ink dots
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var t = (seconds % p.cycle) / p.cycle;
      var breathe = Math.sin(t * Math.PI * 2 + p.phase);
      p.r = p.baseR + breathe * p.baseR * 0.2;
      p.opacity = p.baseOpacity * (0.7 + (breathe + 1) / 2 * 0.6);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,' + p.opacity + ')';
      ctx.fill();
    }

    drawPaperGrain();
  }

  function drawSilentBreath(time) {
    var seconds = time * 0.001;
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;

    // Single prominent center dot
    // r oscillates between 4 and 12 * breathIntensity
    // opacity oscillates between 0.08 and 0.2 * breathIntensity
    var cycle = 4;
    var t = (seconds % cycle) / cycle;
    var breathe = Math.sin(t * Math.PI * 2);
    var cr = 4 + (breathe + 1) / 2 * (12 * breathIntensity - 4);
    var copacity = 0.08 + (breathe + 1) / 2 * (0.2 * breathIntensity - 0.08);

    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,' + copacity + ')';
    ctx.fill();

    // Peripheral dots faded to near-invisible
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var pt = (seconds % p.cycle) / p.cycle;
      var pbreathe = Math.sin(pt * Math.PI * 2 + p.phase);
      p.r = p.baseR + pbreathe * p.baseR * 0.2;
      p.opacity = p.baseOpacity * 0.15;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,' + p.opacity + ')';
      ctx.fill();
    }

    drawPaperGrain();
  }

  function drawRipples() {
    for (var i = ripples.length - 1; i >= 0; i--) {
      var rip = ripples[i];

      // Expand radius over ~2 seconds (at 60fps: ~0.67-1.0 px/frame for 80-120 maxRadius)
      rip.radius += 1.5;

      var progress = rip.radius / rip.maxRadius;
      rip.opacity = 0.25 * (1 - progress);

      // Remove when fully faded or max radius reached
      if (rip.opacity <= 0 || rip.radius >= rip.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,' + rip.opacity + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawSilent(time) {
    if (mode === 'breath') {
      drawSilentBreath(time);
    } else {
      drawSilentNormal(time);
    }
    // Ripples layer on top of all silent modes
    drawRipples();
  }

  /* ------------------------------------------------------------------ */
  /*  Engine initialisation                                              */
  /* ------------------------------------------------------------------ */

  function initEngine() {
    mode = 'normal';
    rainActive = false;
    rainDrops = [];
    rainSpeed = 1;
    ripples = [];
    breathIntensity = 0.5;
    lastTime = 0;

    switch (currentTheme) {
      case 'neon-entropy':
        particles = [];
        break;
      case 'silent-signal':
        initSilent();
        break;
      default:
        initMystic();
        break;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Draw dispatcher                                                    */
  /* ------------------------------------------------------------------ */

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var dt = lastTime ? time - lastTime : 16.667;
    lastTime = time;

    if (currentTheme === 'mystic-void') {
      if (mode === 'converge') {
        drawMysticConverge(time);
      } else {
        drawMysticNormal();
      }
    } else if (currentTheme === 'neon-entropy' && rainActive) {
      drawNeon(dt);
    } else if (currentTheme === 'silent-signal') {
      drawSilent(time);
    }
  }

  function loop(time) {
    draw(time);
    animId = requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ */
  /*  Theme observer                                                     */
  /* ------------------------------------------------------------------ */

  var themeObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === 'data-theme') {
        currentTheme = document.documentElement.getAttribute('data-theme') || 'mystic-void';
        initEngine();
      }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  /* ------------------------------------------------------------------ */
  /*  Bootstrap                                                          */
  /* ------------------------------------------------------------------ */

  window.addEventListener('resize', resize);
  resize();
  initEngine();
  requestAnimationFrame(loop);

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  window.Particles = {

    // Trigger an expanding ink ring at (x, y) -- for Silent Signal answer feedback
    inkRipple: function (x, y) {
      if (currentTheme !== 'silent-signal') return;
      ripples.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: 80 + Math.random() * 40,
        opacity: 0.25,
      });
    },

    // Spiral all particles toward center -- for Mystic Void loading
    convergeParticles: function () {
      if (currentTheme !== 'mystic-void') return;
      // Store original positions for potential restoration
      for (var i = 0; i < particles.length; i++) {
        particles[i].homeX = particles[i].x;
        particles[i].homeY = particles[i].y;
      }
      convergeStartTime = performance.now();
      mode = 'converge';
    },

    // Reset convergence mode back to normal Brownian motion
    normalMode: function () {
      mode = 'normal';
      // Restore particle state for Brownian motion
      if (currentTheme === 'mystic-void') {
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          p.vx = rand(-0.1, 0.1);
          p.vy = rand(-0.1, 0.1);
          // Restore any particles shrunken during convergence
          if (p.r < 0.5) p.r = rand(0.5, 1.5);
          if (p.opacity < 0.02) p.opacity = rand(0.02, 0.06);
        }
      }
    },

    // Control terminal data rain
    startDataRain: function () {
      if (currentTheme !== 'neon-entropy') return;
      rainActive = true;
      initRainDrops(40);
    },

    stopDataRain: function () {
      rainActive = false;
      rainDrops = [];
    },

    setRainSpeed: function (speed) {
      rainSpeed = speed;
    },

    // Control ink dot breathing intensity -- for Silent Signal loading
    breathMode: function (intensity) {
      if (currentTheme !== 'silent-signal') return;
      mode = 'breath';
      breathIntensity = intensity;
    },
  };
})();
