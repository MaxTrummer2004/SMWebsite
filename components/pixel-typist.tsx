"use client";

import { useEffect, useRef, type ReactNode } from "react";

const PALETTE: Record<number, string | null> = {
  0: null,
  1: "#0d0b12",
  2: "#ea580c",
  3: "#f5f3ff",
  4: "#7c2d12",
  5: "#fb923c",
  6: "#6b7280",
  7: "#374151",
  8: "#f9fafb",
  9: "#3d2c1a",
  10: "#6b4423",
};

// 16×20 scene: character seated at typewriter
const HEAD_ROWS: number[][] = [
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,4,4,4,4,4,4,4,1,0,0,0,0],
  [0,0,1,4,2,2,2,2,2,2,2,4,1,0,0,0],
  [0,0,1,2,3,1,2,2,2,1,3,2,1,0,0,0],
  [0,0,1,2,3,1,2,2,2,1,3,2,1,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,0,1,2,2,1,2,2,2,1,2,2,1,0,0,0],
  [0,0,1,2,2,2,1,1,1,2,2,2,1,0,0,0],
];

const BODY_SHARED: number[][] = [
  [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],  // neck
  [0,1,5,2,2,2,2,2,2,2,2,2,5,1,0,0],  // shoulders
  [1,5,2,2,2,2,2,2,2,2,2,2,2,5,1,0],  // upper arms
];

const ARMS_UP:   number[] = [1,5,5,2,2,2,2,2,2,2,2,2,5,5,1,0];
const ARMS_DOWN: number[] = [0,5,5,5,2,2,2,2,2,2,2,5,5,5,0,0];

const DESK_TOP:     number[] = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
const TW_PAPER_0:   number[] = [10,10,10,10,6,8,8,8,8,8,6,10,10,10,10,10];
const TW_PAPER_1:   number[] = [10,10,10,10,6,8,8,1,8,8,6,10,10,10,10,10];
const TW_BODY:      number[] = [10,10,10,10,6,6,6,6,6,6,6,10,10,10,10,10];
const TW_KEYS_0:    number[] = [10,10,10,10,7,8,7,8,7,8,7,10,10,10,10,10];
const TW_KEYS_1:    number[] = [10,10,10,10,7,7,7,8,7,8,7,10,10,10,10,10];
const TW_BASE:      number[] = [10,10,10,10,7,7,7,7,7,7,7,10,10,10,10,10];
const DESK_SURF:    number[] = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];
const DESK_LEG:     number[] = [9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9];

function makeFrame(armsRow: number[], paperRow: number[], keysRow: number[]): number[][] {
  return [
    ...HEAD_ROWS,
    ...BODY_SHARED,
    armsRow,
    DESK_TOP,
    paperRow,
    TW_BODY,
    keysRow,
    TW_BASE,
    DESK_SURF,
    DESK_LEG,
    DESK_LEG,
  ];
}

const FRAMES = [
  makeFrame(ARMS_UP,   TW_PAPER_0, TW_KEYS_0),
  makeFrame(ARMS_UP,   TW_PAPER_0, TW_KEYS_0),
  makeFrame(ARMS_DOWN, TW_PAPER_1, TW_KEYS_1),
  makeFrame(ARMS_UP,   TW_PAPER_0, TW_KEYS_0),
  makeFrame(ARMS_UP,   TW_PAPER_0, TW_KEYS_0),
  makeFrame(ARMS_DOWN, TW_PAPER_0, TW_KEYS_1),
  makeFrame(ARMS_UP,   TW_PAPER_1, TW_KEYS_0),
  makeFrame(ARMS_UP,   TW_PAPER_0, TW_KEYS_0),
];

type Props = { scale?: number; className?: string };

export function PixelTypist({ scale = 6, className = "" }: Props): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 16;
  const H = 20;
  const sw = W * scale;
  const sh = H * scale;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = sw * dpr;
    canvas.height = sh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    let fi = 0;

    const draw = (frame: number[][]) => {
      ctx.clearRect(0, 0, sw, sh);
      for (let row = 0; row < frame.length; row++) {
        const r = frame[row];
        if (!r) continue;
        for (let col = 0; col < r.length; col++) {
          const color = PALETTE[r[col] ?? 0];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
    };

    draw(FRAMES[fi]!);
    const id = setInterval(() => {
      fi = (fi + 1) % FRAMES.length;
      draw(FRAMES[fi]!);
    }, 380);

    return () => clearInterval(id);
  }, [scale, sw, sh]);

  return (
    <canvas
      ref={canvasRef}
      width={sw}
      height={sh}
      style={{ width: sw, height: sh, imageRendering: "pixelated" }}
      className={className}
      aria-hidden="true"
    />
  );
}
