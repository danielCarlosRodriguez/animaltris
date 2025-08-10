// src/components/ant-colony/useAntEngine.js
import { useMemo, useRef } from "react";

export default function useAntEngine(config) {
  const {
    width,
    height,
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

  // Estado contenido en refs (no trigger de re-render)
  const antsRef = useRef([]);
  const foodsRef = useRef([]);
  const nestRef = useRef({ x: width / 2, y: height / 2 });
  const gridRef = useRef(makeGrid(width, height, cellSize));
  const tmpGridRef = useRef(makeGrid(width, height, cellSize));
  const showRef = useRef({
    showPheromones: config.showPheromones,
    showAnts: config.showAnts,
  });

  // Mantener flags actualizados sin recrear motor
  showRef.current.showPheromones = config.showPheromones;
  showRef.current.showAnts = config.showAnts;

  // Inicializar hormigas 1 sola vez
  useMemo(() => {
    antsRef.current = spawnAnts(
      initialAnts,
      nestRef.current.x,
      nestRef.current.y
    );
    foodsRef.current = [
      // Semillas de comida iniciales
      { x: width * 0.18, y: height * 0.2, amount: 220 },
      { x: width * 0.85, y: height * 0.3, amount: 200 },
      { x: width * 0.25, y: height * 0.78, amount: 240 },
    ];
  }, []); // eslint-disable-line

  function resize(w, h) {
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

  function step() {
    const ants = antsRef.current;
    const foods = foodsRef.current;
    const nest = nestRef.current;
    const grid = gridRef.current;

    // Evaporación + difusión (simple: promedio con vecinos)
    evaporate(grid, evaporation);
    diffuse(grid, tmpGridRef.current, diffusion);

    for (let i = 0; i < ants.length; i++) {
      const a = ants[i];

      // sense pheromones (tres sensores)
      const dir = { x: Math.cos(a.angle), y: Math.sin(a.angle) };
      const leftAngle = a.angle - sensorAngle;
      const rightAngle = a.angle + sensorAngle;

      const fwd = sample(
        grid,
        a.x + dir.x * sensorOffset,
        a.y + dir.y * sensorOffset,
        cellSize
      );
      const left = sample(
        grid,
        a.x + Math.cos(leftAngle) * sensorOffset,
        a.y + Math.sin(leftAngle) * sensorOffset,
        cellSize
      );
      const right = sample(
        grid,
        a.x + Math.cos(rightAngle) * sensorOffset,
        a.y + Math.sin(rightAngle) * sensorOffset,
        cellSize
      );

      // comportamiento
      if (!a.carrying) {
        // buscando comida → seguir feromonas (si existen) + ruido
        const turn = chooseTurn(left, fwd, right);
        a.angle +=
          clamp(turn, -turnAngle, turnAngle) + (Math.random() - 0.5) * 0.2;
        // depósito ligero para ayudar a la exploración
        deposit(grid, a.x, a.y, depositSearch, cellSize);

        // Si encuentra comida, la toma
        const f = nearestFood(foods, a.x, a.y, foodRadius);
        if (f) {
          if (f.amount > 0) {
            f.amount -= 1;
            a.carrying = true;
          }
        }
      } else {
        // volviendo al nido → orientar hacia el nido + algo de ruido
        const angleToNest = Math.atan2(nest.y - a.y, nest.x - a.x);
        const angleDiff = wrapAngle(angleToNest - a.angle);
        a.angle +=
          clamp(angleDiff, -turnAngle, turnAngle) +
          (Math.random() - 0.5) * 0.05;

        // dejar feromonas fuertes
        deposit(grid, a.x, a.y, depositCarry, cellSize);

        // si llega al nido suelta la comida
        if (dist(a.x, a.y, nest.x, nest.y) <= nestRadius + 2) {
          a.carrying = false;
        }
      }

      // mover
      a.x += Math.cos(a.angle) * antSpeed;
      a.y += Math.sin(a.angle) * antSpeed;

      // envolver bordes (toro)
      if (a.x < 0) a.x = width;
      if (a.x > width) a.x = 0;
      if (a.y < 0) a.y = height;
      if (a.y > height) a.y = 0;
    }
  }

  function draw(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

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
      // “carga” restante
      ctx.beginPath();
      ctx.rect(
        f.x - foodRadius,
        f.y + foodRadius + 3,
        (f.amount / 220) * (foodRadius * 2),
        3
      );
      ctx.fillStyle = "#39d353";
      ctx.fill();
    }

    // hormigas
    if (showRef.current.showAnts) {
      const ants = antsRef.current;
      ctx.fillStyle = "#f0f3f9";
      for (const a of ants) {
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

    function clearFood() {
      foodsRef.current = [];
    }


  return {
    step,
    draw,
    resize,
    resetAnts,
    addFoodAt,
    removeFoodAt,
    clearFood,
  };
}

/* ====================== helpers / motor ====================== */

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
  for (let i = 0; i < d.length; i++) {
    d[i] *= 1 - rate;
  }
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
      const sumNeighbors = t[i - 1] + t[i + 1] + t[i - cols] + t[i + cols];
      // mezclar algo del promedio de vecinos
      g[i] = (1 - alpha) * t[i] + alpha * (sumNeighbors / 4);
    }
  }
}

function drawPheromones(ctx, grid, config) {
  const { cell: _cell, cols, rows, data } = grid;
  const img = ctx.createImageData(cols, rows);
  let max = 0;
  for (let i = 0; i < data.length; i++) max = Math.max(max, data[i]);
  // normalizar
  const inv = max > 0 ? 1 / max : 0;

  for (let i = 0; i < data.length; i++) {
    const v = data[i] * inv;
    // mapa de color monocromo azul
    const b = Math.floor(v * 255);
    const a = Math.floor(v * 255);
    const o = i * 4;
    img.data[o] = 20; // R
    img.data[o + 1] = 120; // G
    img.data[o + 2] = b; // B
    img.data[o + 3] = a; // A
  }

  // Escalar la imagen del grid al canvas
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
    ctx.canvas.width,
    ctx.canvas.height
  );
}

function createOffscreen(imageData) {
  // compat: usar canvas temporal
  const c = document.createElement("canvas");
  c.width = imageData.width;
  c.height = imageData.height;
  const cctx = c.getContext("2d");
  cctx.putImageData(imageData, 0, 0);
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
  let best = null;
  let bestD = Infinity;
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
  // Probabilístico: más feromona → más probabilidad
  const eps = 1e-6;
  const L = left + eps,
    F = fwd + eps,
    R = right + eps;
  const sum = L + F + R;
  const r = Math.random() * sum;
  if (r < L) return -0.25; // girar izq
  if (r < L + F) return 0; // seguir
  return 0.25; // girar der
}

function wrapAngle(a) {
  // -PI..PI
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function dist(ax, ay, bx, by) {
  const dx = ax - bx,
    dy = ay - by;
  return Math.hypot(dx, dy);
}

