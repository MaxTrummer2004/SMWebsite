"use client";

import type { LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, type ReactNode } from "react";

export function PixelatedIcon({
  icon: Icon,
  pixels = 28,
  className,
}: {
  icon: LucideIcon;
  pixels?: number;
  className?: string;
}): ReactNode {
  const iconRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const svg = iconRef.current;
    const canvas = canvasRef.current;
    if (!svg || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const color = getComputedStyle(svg).color;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "256");
    clone.setAttribute("height", "256");
    clone.style.color = color;

    const xml = new XMLSerializer().serializeToString(clone);
    const url =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

    const small = document.createElement("canvas");
    small.width = pixels;
    small.height = pixels;
    const sctx = small.getContext("2d");

    const image = new Image();
    let cancelled = false;

    const render = (): void => {
      if (cancelled || !sctx) return;
      const rect = canvas.getBoundingClientRect();
      const size = Math.round(rect.width);
      if (size === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sctx.clearRect(0, 0, pixels, pixels);
      sctx.imageSmoothingEnabled = true;
      sctx.drawImage(image, 0, 0, pixels, pixels);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(small, 0, 0, pixels, pixels, 0, 0, size, size);
    };

    image.onload = render;
    image.src = url;

    const ro = new ResizeObserver(render);
    ro.observe(canvas);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [pixels, resolvedTheme]);

  return (
    <>
      <Icon
        ref={iconRef}
        strokeWidth={2.25}
        aria-hidden="true"
        className="text-accent pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={className}
        style={{ imageRendering: "pixelated", aspectRatio: "1 / 1" }}
      />
    </>
  );
}
