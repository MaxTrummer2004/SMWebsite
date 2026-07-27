import type { ReactNode } from "react";

// Pixel "S" mark drawn on an 8x8 grid.
export function PixelMark({ className }: { className?: string }): ReactNode {
  const rows = [
    ".######.",
    "##......",
    "##......",
    ".#####..",
    "......##",
    "......##",
    "######..",
    "........",
  ];
  return (
    <svg
      viewBox="0 0 8 8"
      className={className}
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rows.map((row, y) =>
        row
          .split("")
          .map((c, x) =>
            c === "#" ? (
              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
            ) : null
          )
      )}
    </svg>
  );
}

export function Logo(): ReactNode {
  return (
    <a
      href="#top"
      className="focus-ring group inline-flex items-center gap-2.5"
      aria-label="SMKnowers home"
    >
      <span className="pixel-clip flex h-8 w-8 items-center justify-center bg-accent text-white transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-3">
        <PixelMark className="h-4 w-4" />
      </span>
      <span className="font-pixel text-[13px] tracking-tight">SMKnowers</span>
    </a>
  );
}
