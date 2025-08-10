// src/components/ant-colony-mobile/useAntEngineMobile.js
import { useMemo, useRef } from "react";

export default function useAntEngineMobile(config) {
  const {
    ants: initialAnts,
    antSpeed,
    turnAngle,
    sensorOffset,
    sensorAngle,
    evaporation,
    diffusion,
    depositCarry,
    depositSearch,
    cellSize,
    nestRadius,
    foodRadius,
  } = config;

  // Dimensiones dinámicas (las setea CanvasViewMobile via resize)
  const widthRef = useRef(360);
  const heightRef = useRef(420);

  const antsRef = useRef([]);
  const foodsRef = useRef([]);
  const nestRef = useRef({ x: widthRef.current / 2, y: heightRef.current / 2 });
  const gridRef = useRef(
    makeGrid(widthRef.current, heightRef.current, cellSize)
  );
  const tmpGridRef = useRef(
    makeGrid(widthRef.current, heightRef.current, cellSize)
  );
  const showRef = useRef({
    showPheromones: config.showPheromones,
    showAnts: config.showAnts,
  });

  showRef.current.showPheromones = config.showPheromones;
  showRef.current.showAnts = config.showAnts;

  useMemo(() => {
    antsRef.current = spawnAnts(
      initialAnts,
      nestRef.current.x,
      nestRef.current.y
    );
    seedDefaultFood(); // comida inicial
  }, []); // eslint-disable-line

  function resize(w, h) {
    widthRef.current = w;
    heightRef.current = h;
    gridRef.current = makeGrid(w, h, cellSize);
    tmpGridRef.current = makeGrid(w, h, cellSize);
    nestRef.current = { x: w / 2, y: h / 2 };
  }

  function resetAnts(n) {
    antsRef.current = spawnAnts(n, nestRef.current.x, nestRef.current.y);
  }

  function addFoodAt(x, y) {
    foodsRef.current.push({ x, y, amount: 200 });
  }
  function removeFoodAt(x, y) {
    const idx = foodsRef.current.findIndex(
      (f) => dist(f.x, f.y, x, y) <= foodRadius + 4
    );
    if (idx >= 0) foodsRef.current.splice(idx, 1);
  }
  function clearFood() {
    foodsRef.current = [];
  }
  function seedDefaultFood() {
    const w = widthRef.current,
      h = heightRef.current;
    foodsRef.current = [
      { x: w * 0.2, y: h * 0.22, amount: 220 },
      { x: w * 0.82, y: h * 0.28, amount: 200 },
      { x: w * 0.28, y: h * 0.76, amount: 240 },
    ];
  }

  function step() {
    const ants = antsRef.current;
    const foods = foodsRef.current;
    const nest = nestRef.current;
    const grid = gridRef.current;
    const width = widthRef.current;
    const height = heightRef.current;

    evaporate(grid, evaporation);
    diffuse(grid, tmpGridRef.current, diffusion);

    for (let i = 0; i < ants.length; i++) {
      const a = ants[i];

      const leftA = a.angle - sensorAngle;
      const rightA = a.angle + sensorAngle;

      const fwd = sample(
        grid,
        a.x + Math.cos(a.angle) * sensorOffset,
        a.y + Math.sin(a.angle) * sensorOffset,
        cellSize
      );
      const left = sample(
        grid,
        a.x + Math.cos(leftA) * sensorOffset,
        a.y + Math.sin(leftA) * sensorOffset,
        cellSize
      );
      const right = sample(
        grid,
        a.x + Math.cos(rightA) * sensorOffset,
        a.y + Math.sin(rightA) * sensorOffset,
        cellSize
      );

      if (!a.carrying) {
        const turn = chooseTurn(left, fwd, right);
        a.angle +=
          clamp(turn, -turnAngle, turnAngle) + (Math.random() - 0.5) * 0.2;
        deposit(grid, a.x, a.y, depositSearch, cellSize);

        const f = nearestFood(foods, a.x, a.y, foodRadius);
        if (f && f.amount > 0) {
          f.amount -= 1;
          a.carrying = true;
        }
      } else {
        const angleToNest = Math.atan2(nest.y - a.y, nest.x - a.x);
        const diff = wrapAngle(angleToNest - a.angle);
        a.angle +=
          clamp(diff, -turnAngle, turnAngle) + (Math.random() - 0.5) * 0.05;

        deposit(grid, a.x, a.y, depositCarry, cellSize);

        if (dist(a.x, a.y, nest.x, nest.y) <= nestRadius + 2)
          a.carrying = false;
      }

      a.x += Math.cos(a.angle) * antSpeed;
      a.y += Math.sin(a.angle) * antSpeed;

      if (a.x < 0) a.x = width;
      if (a.x > width) a.x = 0;
      if (a.y < 0) a.y = height;
      if (a.y > height) a.y = 0;
    }
  }

  function draw(ctx) {
    const w = ctx.canvas.clientWidth;
    const h = ctx.canvas.clientHeight;

    // fondo
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, w, h);

    // feromonas
    if (showRef.current.showPheromones) {
      drawPheromones(ctx, gridRef.current, config);
    }

    // nido
    const nest = nestRef.current;
    ctx.beginPath();
    ctx.arc(nest.x, nest.y, nestRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#4ca1ff";
    ctx.fill();

    // comida
    for (const f of foodsRef.current) {
      if (f.amount <= 0) continue;
      ctx.beginPath();
      ctx.arc(f.x, f.y, foodRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#39d353";
      ctx.fill();
      ctx.beginPath();
      ctx.rect(
        f.x - foodRadius,
        f.y + foodRadius + 2,
        (f.amount / 220) * (foodRadius * 2),
        3
      );
      ctx.fillStyle = "#39d353";
      ctx.fill();
    }

    // hormigas
    if (showRef.current.showAnts) {
      ctx.fillStyle = "#f0f3f9";
      for (const a of antsRef.current) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.beginPath();
        ctx.moveTo(3, 0);
        ctx.lineTo(-2, 2);
        ctx.lineTo(-2, -2);
        ctx.closePath();
        ctx.fill();
        if (a.carrying) {
          ctx.fillStyle = "#ffd166";
          ctx.beginPath();
          ctx.arc(-3, 0, 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f0f3f9";
        }
        ctx.restore();
      }
    }
  }

  return {
    step,
    draw,
    resize,
    resetAnts,
    addFoodAt,
    removeFoodAt,
    clearFood,
    seedDefaultFood,
  };
}

/* ===== helpers ===== */
function makeGrid(width, height, cell) {
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const data = new Float32Array(cols * rows);
  return { data, cols, rows, cell };
}
function idx(grid, x, y) {
  return y * grid.cols + x;
}
function sample(grid, px, py, cell) {
  const gx = Math.floor(px / cell);
  const gy = Math.floor(py / cell);
  if (gx < 0 || gy < 0 || gx >= grid.cols || gy >= grid.rows) return 0;
  return grid.data[idx(grid, gx, gy)];
}
function deposit(grid, px, py, amount, cell) {
  const gx = Math.floor(px / cell);
  const gy = Math.floor(py / cell);
  if (gx < 0 || gy < 0 || gx >= grid.cols || gy >= grid.rows) return;
  grid.data[idx(grid, gx, gy)] += amount;
}
function evaporate(grid, rate) {
  const d = grid.data;
  for (let i = 0; i < d.length; i++) d[i] *= 1 - rate;
}
function diffuse(grid, tmp, alpha) {
  if (alpha <= 0) return;
  const { cols, rows } = grid;
  const g = grid.data;
  const t = tmp.data;
  t.set(g);
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const i = y * cols + x;
      const sum = t[i - 1] + t[i + 1] + t[i - cols] + t[i + cols];
      g[i] = (1 - alpha) * t[i] + alpha * (sum / 4);
    }
  }
}
function drawPheromones(ctx, grid, config) {
  const { cols, rows, data } = grid;
  const img = ctx.createImageData(cols, rows);
  let max = 0;
  for (let i = 0; i < data.length; i++) max = Math.max(max, data[i]);
  const inv = max > 0 ? 1 / max : 0;

  for (let i = 0; i < data.length; i++) {
    const v = data[i] * inv;
    const b = Math.floor(v * 255);
    const a = Math.floor(v * 255);
    const o = i * 4;
    img.data[o] = 20;
    img.data[o + 1] = 120;
    img.data[o + 2] = b;
    img.data[o + 3] = a;
  }

  const bmp = createOffscreen(img);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = config.trailBlur ? "high" : "low";
  ctx.drawImage(
    bmp,
    0,
    0,
    cols,
    rows,
    0,
    0,
    ctx.canvas.clientWidth,
    ctx.canvas.clientHeight
  );
}
function createOffscreen(imageData) {
  const c = document.createElement("canvas");
  c.width = imageData.width;
  c.height = imageData.height;
  c.getContext("2d").putImageData(imageData, 0, 0);
  return c;
}
function spawnAnts(n, x, y) {
  const ants = [];
  for (let i = 0; i < n; i++) {
    ants.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      angle: Math.random() * Math.PI * 2,
      carrying: false,
    });
  }
  return ants;
}
function nearestFood(foods, x, y, r) {
  let best = null,
    bestD = Infinity;
  for (const f of foods) {
    if (f.amount <= 0) continue;
    const d = dist(x, y, f.x, f.y);
    if (d < r && d < bestD) {
      best = f;
      bestD = d;
    }
  }
  return best;
}
function chooseTurn(left, fwd, right) {
  const eps = 1e-6;
  const L = left + eps,
    F = fwd + eps,
    R = right + eps;
  const sum = L + F + R;
  const r = Math.random() * sum;
  if (r < L) return -0.25;
  if (r < L + F) return 0;
  return 0.25;
}
function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}
