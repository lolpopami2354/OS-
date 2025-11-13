(() => {
  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('snakeScore');
  const startBtn = document.getElementById('snakeStart');
  const resetBtn = document.getElementById('snakeReset');

  const W = canvas.width, H = canvas.height;
  const grid = 20;
  const cols = W / grid;
  const rows = H / grid;

  let snake, dir, food, score, running, tickId;

  function randCell() {
    return {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  }

  function reset() {
    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = { x: 1, y: 0 };
    food = randCell();
    score = 0;
    running = false;
    scoreEl.textContent = score;
    draw();
  }

  function start() {
    if (running) return;
    running = true;
    tickId = setInterval(tick, 90);
  }

  function stop() {
    running = false;
    clearInterval(tickId);
  }

  function setDir(nx, ny) {
    // Prevent reversing into self
    if (snake.length > 1) {
      const head = snake[0];
      const neck = snake[1];
      if (head.x + nx === neck.x && head.y + ny === neck.y) return;
    }
    dir = { x: nx, y: ny };
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') setDir(0, -1);
    else if (e.key === 'ArrowDown') setDir(0, 1);
    else if (e.key === 'ArrowLeft') setDir(-1, 0);
    else if (e.key === 'ArrowRight') setDir(1, 0);
  });

  startBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', () => { stop(); reset(); });

  function tick() {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wrap around
    head.x = (head.x + cols) % cols;
    head.y = (head.y + rows) % rows;

    // Check self-collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      stop();
      return;
    }

    snake.unshift(head);

    // Eat
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      food = randCell();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#071018');
    grad.addColorStop(1, '#091520');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Food
    ctx.fillStyle = '#ffcf5c';
    ctx.fillRect(food.x * grid, food.y * grid, grid, grid);

    // Snake
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#9f6cff' : '#6cf';
      ctx.fillRect(s.x * grid, s.y * grid, grid, grid);
    });

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x <= W; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // Boot
  reset();
})();
