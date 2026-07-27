"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const CELL = 40;
const COLOR = "#ea580c";
const DURATION = 900; // ms total sweep
const SPREAD = 0.45;  // how wide the dissolve edge is (fraction of width)

type Props = {
  onDone?: () => void;
};

export function PixelTransition({ onDone }: Props): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = Math.ceil(W / CELL);
    const rows = Math.ceil(H / CELL);

    // Random per-cell delay offset within the spread window
    const offsets = Array.from({ length: cols * rows }, () => Math.random());

    let start = 0;
    let raf = 0;

    const draw = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1); // 0 → 1

      ctx.clearRect(0, 0, W, H);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const offset = offsets[r * cols + c] ?? 0;
          // Each cell dissolves when progress reaches its column fraction + random offset
          const cellStart = (c / cols) * (1 - SPREAD) + offset * SPREAD;
          const cellAlpha = 1 - Math.max(0, Math.min(1, (progress - cellStart) / 0.15));

          if (cellAlpha <= 0) continue;
          ctx.globalAlpha = cellAlpha;
          ctx.fillStyle = COLOR;
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        }
      }

      ctx.globalAlpha = 1;

      if (progress < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        setHidden(true);
        onDone?.();
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  if (hidden) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
}
