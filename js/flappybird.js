(() => {
  const canvas = document.getElementById('flappyCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('flappyScore');
  const startBtn = document.getElementById('flappyStart');
  const resetBtn = document.getElementById('flappyReset');

  const W = canvas.width;
  const H = canvas.height;

  // Game state
  let bird, pipes, score, best, running, lastTime;

  // Config
  const gravity = 0.45;
  const flapVel = -7.8;
  const pipeGapBase = 150;
  const pipeWidth = 58;
  const pipeSpeed = 2.2;
  const pipeSpawnEvery = 1500; // ms

  const colors = {
    bgTop: '#071018',
    bgBottom: '#091520',
    ground: '#0c1520',
    bird: '#6cf',
    wing: '#9f6cff',
    pipe: '#3ddc97',
    pipeDark: '#2fb37b',
    text: '#e7f0ff',
    shadow: 'rgba(0,0,0,0.35)'
  };

  function reset() {
    bird = {
      x: W * 0.28,
      y: H * 0.44,
      vy: 0,
      r: 12
    };
    pipes = [];
    score = 0;
    lastTime = performance.now();
    running = false;
    scoreEl.textContent = score;
    spawnTimer.reset();
    drawIntro();
  }

  function flap() {
    if (!running) running = true;
    bird.vy = flapVel;
  }

  // Pipe spawner
  const spawnTimer = (() => {
    let lastSpawn = 0;
    return {
      reset() { lastSpawn = performance.now(); },
      shouldSpawn(t) { return t - lastSpawn >= pipeSpawnEvery; },
      didSpawn(t) { lastSpawn = t; }
    };
  })();

  // Input
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      flap();
    }
  });
  canvas.addEventListener('pointerdown', flap);
  startBtn.addEventListener('click', flap);
  resetBtn.addEventListener('click', reset);

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, colors.bgTop);
    grad.addColorStop(1, colors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Ground strip
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, H - 40, W, 40);
  }

  function drawBird(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.min(Math.max(b.vy / 16, -0.6), 0.6));

    // Body
    ctx.fillStyle = colors.bird;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -4, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00131c';
    ctx.beginPath();
    ctx.arc(7.5, -4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ffcf5c';
    ctx.beginPath();
    ctx.moveTo(b.r - 2, 0);
    ctx.lineTo(b.r + 10, 3);
    ctx.lineTo(b.r - 2, 6);
    ctx.closePath();
    ctx.fill();

    // Wing
    ctx.fillStyle = colors.wing;
    ctx.beginPath();
    ctx.arc(-4, 6, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawPipe(x, topH, gapH) {
    const bottomY = topH + gapH;
    // Top pipe
    ctx.fillStyle = colors.pipe;
    ctx.fillRect(x, 0, pipeWidth, topH);
    ctx.fillStyle = colors.pipeDark;
    ctx.fillRect(x + pipeWidth - 8, 0, 8, topH);

    // Bottom pipe
    ctx.fillStyle = colors.pipe;
    ctx.fillRect(x, bottomY, pipeWidth, H - bottomY - 40);
    ctx.fillStyle = colors.pipeDark;
    ctx.fillRect(x + pipeWidth - 8, bottomY, 8, H - bottomY - 40);

    // End caps
    ctx.fillStyle = colors.pipeDark;
    ctx.fillRect(x - 2, topH - 12, pipeWidth + 4, 12);
    ctx.fillRect(x - 2, bottomY, pipeWidth + 4, 12);
  }

  function collide(b, p) {
    // Axis-aligned check using bird circle approximated to a box for simplicity
    const bx1 = b.x - b.r, bx2 = b.x + b.r;
    const by1 = b.y - b.r, by2 = b.y + b.r;

    // Top pipe rect
    const tp = { x1: p.x, y1: 0, x2: p.x + pipeWidth, y2: p.topH };
    // Bottom pipe rect
    const bp = { x1: p.x, y1: p.topH + p.gapH, x2: p.x + pipeWidth, y2: H - 40 };

    const intersects = (r) => !(bx2 < r.x1 || bx1 > r.x2 || by2 < r.y1 || by1 > r.y2);
    return intersects(tp) || intersects(bp);
  }

  function drawText() {
    ctx.fillStyle = colors.text;
    ctx.font = '16px system-ui, Segoe UI, Roboto, Arial';
    ctx.fillText(`Score: ${score}`, 12, 24);
    if (best !== undefined) ctx.fillText(`Best: ${best}`, 12, 44);
  }

  function drawIntro() {
    drawBackground();
    drawBird(bird);
    ctx.fillStyle = colors.text;
    ctx.font = '22px system-ui, Segoe UI, Roboto, Arial';
    ctx.fillText('Flappy Bird', 140, 180);
    ctx.font = '16px system-ui, Segoe UI, Roboto, Arial';
    ctx.fillText('Click or press Space to flap', 120, 210);
  }

  function spawnPipe() {
    const gap = pipeGapBase - Math.min(60, Math.floor(score * 2.2));
    const topH = 40 + Math.random() * (H - 40 - gap - 120);
    pipes.push({ x: W + 20, topH, gapH: gap, passed: false });
  }

  function update(dt) {
    if (!running) return;
    // Bird physics
    bird.vy += gravity;
    bird.y += bird.vy;

    // Pipes
    pipes.forEach(p => p.x -= pipeSpeed);
    pipes = pipes.filter(p => p.x + pipeWidth > -20);

    // Score when passing a pipe
    pipes.forEach(p => {
      if (!p.passed && bird.x > p.x + pipeWidth) {
        p.passed = true;
        score++;
        scoreEl.textContent = score;
      }
    });

    // Spawn pipes
    const now = performance.now();
    if (spawnTimer.shouldSpawn(now)) {
      spawnPipe();
      spawnTimer.didSpawn(now);
    }

    // Collisions
    const hitPipe = pipes.some(p => collide(bird, p));
    const hitGround = bird.y + bird.r >= H - 40;
    const hitTop = bird.y - bird.r <= 0;

    if (hitPipe || hitGround || hitTop) {
      running = false;
      best = Math.max(best || 0, score);
    }
  }

  function render() {
    drawBackground();
    pipes.forEach(p => drawPipe(p.x, p.topH, p.gapH));
    drawBird(bird);
    drawText();
  }

  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // Boot
  reset();
  requestAnimationFrame(loop);
})();
