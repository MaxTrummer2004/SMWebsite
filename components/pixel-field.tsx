"use client";

import { useReducedMotion } from "@/lib/motion";
import { observeVisibility } from "@/lib/visibility";
import { useEffect, useRef, type ReactNode } from "react";

type RGB = [number, number, number];

const SHADES_RGB: RGB[] = [
  [0x7c, 0x2d, 0x12],
  [0x9a, 0x34, 0x12],
  [0xc2, 0x41, 0x0c],
  [0xea, 0x58, 0x0c],
  [0xf9, 0x73, 0x16],
  [0xfb, 0x92, 0x3c],
  [0xfd, 0xba, 0x74],
];
const FALLBACK_RGB: RGB = [0xf9, 0x73, 0x16];

const CELL = 44;
const EASE = 0.07;
const FREQ = 0.18;
const CONTRAST = 1.2;
const DRIFT = 0.00035;

type Cell = { a: number; t: number };

function paletteColor(t: number): RGB {
  const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
  const pos = clamped * (SHADES_RGB.length - 1);
  const i0 = Math.floor(pos);
  const i1 = Math.min(i0 + 1, SHADES_RGB.length - 1);
  const f = pos - i0;
  const a = SHADES_RGB[i0] ?? FALLBACK_RGB;
  const b = SHADES_RGB[i1] ?? FALLBACK_RGB;
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

function turbulence(x: number, y: number, time: number): number {
  let cx = x;
  let cy = y;
  for (let n = 1; n < 6; n++) {
    cx += (1 / n) * Math.sin(n * cy + time);
    cy += (1 / n) * Math.cos(n * cx + time);
  }
  const v = 0.5 + 0.5 * Math.sin(cx + cy);
  return (v - 0.5) * CONTRAST + 0.5;
}

export function PixelField({ className, fill, direction }: { className?: string; fill?: number; direction?: "left" | "right" }): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const seed = Math.random() * 1000;
    let raf = 0;
    let time = seed;
    let last = 0;
    let running = false;
    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let offsetX = 0;
    let cells: Cell[] = [];
    let rerollPerFrame = 1;

    const density = (col: number, row: number): number => {
      if (fill !== undefined) return fill;
      const rx = cols <= 1 ? 1 : col / (cols - 1);
      if (direction === "left")  return Math.pow(1 - rx, 1.2);
      if (direction === "right") return Math.pow(rx, 1.2);
      const ry = rows <= 1 ? 1 : 1 - row / (rows - 1);
      return Math.pow(rx, 1.7) * Math.pow(ry, 1.1);
    };

    const reroll = (idx: number): void => {
      const cell = cells[idx];
      if (!cell) return;
      const d = density(idx % cols, Math.floor(idx / cols));
      cell.t = Math.random() < d ? 0.45 + Math.random() * 0.55 : 0;
    };

    const draw = (time: number): void => {
      ctx.clearRect(0, 0, width, height);
      cells.forEach((cell, i) => {
        if (cell.a < 0.01) return;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const shade = turbulence(col * FREQ + seed, row * FREQ, time);
        const [r, g, b] = paletteColor(shade);
        const x0 = Math.round(offsetX + col * CELL);
        const x1 = Math.round(offsetX + (col + 1) * CELL);
        const y0 = Math.round(row * CELL);
        const y1 = Math.round((row + 1) * CELL);
        ctx.globalAlpha = Math.min(1, cell.a);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      });
      ctx.globalAlpha = 1;
    };

    const step = (now: number): void => {
      if (last === 0) last = now;
      time += (now - last) * DRIFT;
      last = now;
      for (let n = 0; n < rerollPerFrame; n++) {
        reroll(Math.floor(Math.random() * cells.length));
      }
      cells.forEach((cell) => {
        cell.a += (cell.t - cell.a) * EASE;
      });
      draw(time);
      if (running) raf = requestAnimationFrame(step);
    };

    const startLoop = (): void => {
      if (running || prefersReducedMotion) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(step);
    };

    const stopLoop = (): void => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const setup = (): void => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      offsetX = width - cols * CELL;
      rerollPerFrame = Math.max(1, Math.round(cols * rows * 0.006));

      cells = Array.from({ length: cols * rows }, (_, i) => {
        const d = density(i % cols, Math.floor(i / cols));
        const on = Math.random() < d;
        const t = on ? 0.45 + Math.random() * 0.55 : 0;
        return { a: t, t };
      });
      draw(seed);
    };

    setup();

    const ro = new ResizeObserver(() => {
      setup();
    });
    ro.observe(canvas);

    if (prefersReducedMotion) {
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
      };
    }

    const unobserve = observeVisibility(canvas, (active) => {
      if (active) startLoop();
      else stopLoop();
    });

    return () => {
      stopLoop();
      ro.disconnect();
      unobserve();
    };
  }, [prefersReducedMotion]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
