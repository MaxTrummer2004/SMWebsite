"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function getOutlineColor(): string {
  return document.documentElement.classList.contains("dark") ? "#0d0b12" : "#ffffff";
}

function buildPalette(outlineColor: string): Record<number, string | null> {
  return {
    0: null,
    1: outlineColor,
    2: "#ea580c",
    3: "#f5f3ff",
    4: "#7c2d12",
    5: "#fb923c",
  };
}

// Angry face row overrides (rows 2-7)
const ANGRY_HEAD_ROWS: Record<number, number[]> = {
  2: [0,0,1,4,2,1,2,2,2,1,2,4,1,0,0,0], // furrowed brows
  3: [0,0,1,2,1,3,2,2,2,3,1,2,1,0,0,0], // eyes shifted inward under brow
  4: [0,0,1,2,1,3,2,2,2,3,1,2,1,0,0,0],
  5: [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  6: [0,0,1,2,2,2,1,1,1,2,2,2,1,0,0,0], // frown (rows 6&7 swapped)
  7: [0,0,1,2,2,1,2,2,2,1,2,2,1,0,0,0],
};

// Frame 0 — idle / legs apart
const FRAME_0 = [
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,4,4,4,4,4,4,4,1,0,0,0,0],
  [0,0,1,4,2,2,2,2,2,2,2,4,1,0,0,0],
  [0,0,1,2,3,1,2,2,2,1,3,2,1,0,0,0],
  [0,0,1,2,3,1,2,2,2,1,3,2,1,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,0,1,2,2,1,2,2,2,1,2,2,1,0,0,0],
  [0,0,1,2,2,2,1,1,1,2,2,2,1,0,0,0],
  [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,1,5,2,2,2,2,2,2,2,2,2,5,1,0,0],
  [0,1,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
  [0,1,4,2,2,2,2,2,2,2,2,2,4,1,0,0],
  [0,0,1,1,2,2,1,0,0,1,2,2,1,0,0,0],
  [0,0,0,1,2,2,1,0,0,1,2,2,1,0,0,0],
  [0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0],
];

// Frame 1 — walk (left leg forward, right leg back)
const FRAME_1 = [
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,4,4,4,4,4,4,4,1,0,0,0,0],
  [0,0,1,4,2,2,2,2,2,2,2,4,1,0,0,0],
  [0,0,1,2,3,1,2,2,2,1,3,2,1,0,0,0],
  [0,0,1,2,3,1,2,2,2,1,3,2,1,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,0,1,2,2,1,2,2,2,1,2,2,1,0,0,0],
  [0,0,1,2,2,2,1,1,1,2,2,2,1,0,0,0],
  [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,1,5,2,2,2,2,2,2,2,2,2,5,1,0,0],
  [0,1,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
  [0,1,4,2,2,2,2,2,2,2,2,2,4,1,0,0],
  [0,0,0,1,2,2,1,0,0,0,1,2,2,1,0,0], // left leg forward
  [0,0,0,0,1,2,2,1,0,0,0,1,2,1,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0],
];

// Frame 2 — walk (right leg forward, left leg back)
const FRAME_2 = [
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,4,4,4,4,4,4,4,1,0,0,0,0],
  [0,0,1,4,2,2,2,2,2,2,2,4,1,0,0,0],
  [0,0,1,2,3,1,2,2,2,1,3,2,1,0,0,0],
  [0,0,1,2,3,1,2,2,2,1,3,2,1,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,0,1,2,2,1,2,2,2,1,2,2,1,0,0,0],
  [0,0,1,2,2,2,1,1,1,2,2,2,1,0,0,0],
  [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,1,5,2,2,2,2,2,2,2,2,2,5,1,0,0],
  [0,1,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
  [0,1,4,2,2,2,2,2,2,2,2,2,4,1,0,0],
  [0,0,1,2,2,1,0,0,0,1,2,2,1,0,0,0], // right leg forward
  [0,0,1,2,1,0,0,0,0,1,2,2,1,0,0,0],
  [0,0,1,1,1,0,0,0,0,1,1,1,1,0,0,0],
];

const FRAMES = [FRAME_0, FRAME_1, FRAME_0, FRAME_2];
const FPS = 6;

type Props = {
  scale?: number;
  className?: string;
};

function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: number[][],
  scale: number,
  size: number,
  palette: Record<number, string | null>,
  angry = false,
) {
  ctx.clearRect(0, 0, size, size);
  for (let row = 0; row < frame.length; row++) {
    const rowData = (angry && ANGRY_HEAD_ROWS[row]) ? ANGRY_HEAD_ROWS[row]! : frame[row];
    if (!rowData) continue;
    for (let col = 0; col < rowData.length; col++) {
      const colorKey = rowData[col];
      if (colorKey === undefined) continue;
      const color = palette[colorKey];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(col * scale, row * scale, scale, scale);
    }
  }
}

type Props = {
  scale?: number;
  className?: string;
  isWalking?: boolean;
  angry?: boolean;
};

export function PixelCharacter({ scale = 6, className = "", isWalking = false, angry = false }: Props): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 16 * scale;
  const [outlineColor, setOutlineColor] = useState("#0d0b12");

  // Sync outline color with theme class changes
  useEffect(() => {
    setOutlineColor(getOutlineColor());
    const observer = new MutationObserver(() => setOutlineColor(getOutlineColor()));
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = buildPalette(outlineColor);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    if (!isWalking) {
      drawFrame(ctx, FRAMES[0]!, scale, size, palette, angry);
      return;
    }

    let frameIndex = 0;
    drawFrame(ctx, FRAMES[frameIndex]!, scale, size, palette, angry);

    const interval = setInterval(() => {
      frameIndex = (frameIndex + 1) % FRAMES.length;
      drawFrame(ctx, FRAMES[frameIndex]!, scale, size, palette, angry);
    }, 1000 / FPS);

    return () => clearInterval(interval);
  }, [scale, size, isWalking, angry, outlineColor]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      className={className}
      aria-hidden="true"
    />
  );
}
