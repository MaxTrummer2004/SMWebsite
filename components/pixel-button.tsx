import type { ReactNode } from "react";

type PixelButtonVariant = "solid" | "outline" | "inverse";
type PixelButtonSize = "md" | "lg";

export const CLIP =
  "polygon(8px 0, calc(100% - 8px) 0, calc(100% - 8px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 4px) calc(100% - 8px), calc(100% - 4px) calc(100% - 4px), calc(100% - 8px) calc(100% - 4px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 8px), 0 calc(100% - 8px), 0 8px, 4px 8px, 4px 4px, 8px 4px)";

const SIZES: Record<PixelButtonSize, string> = {
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

type PixelButtonProps = {
  children: ReactNode;
  variant?: PixelButtonVariant;
  size?: PixelButtonSize;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  ariaLabel?: string;
  className?: string;
  id?: string;
};

export function PixelButton({
  children,
  variant = "solid",
  size = "md",
  href,
  onClick,
  type = "button",
  ariaLabel,
  className = "",
  id,
}: PixelButtonProps): ReactNode {
  const base = [
    "group focus-ring relative inline-flex select-none items-center justify-center whitespace-nowrap transition-colors",
    SIZES[size],
    variant === "solid"
      ? "text-background font-semibold"
      : variant === "inverse"
        ? "text-foreground font-semibold"
        : "text-foreground font-medium",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const layers =
    variant === "solid" ? (
      <span
        aria-hidden="true"
        className="bg-foreground group-hover:bg-foreground/90 absolute inset-0 transition-colors"
        style={{ clipPath: CLIP, WebkitClipPath: CLIP }}
      />
    ) : variant === "inverse" ? (
      <span
        aria-hidden="true"
        className="bg-background group-hover:bg-muted absolute inset-0 transition-colors"
        style={{ clipPath: CLIP, WebkitClipPath: CLIP }}
      />
    ) : (
      <>
        <span
          aria-hidden="true"
          className="bg-border absolute inset-0"
          style={{ clipPath: CLIP, WebkitClipPath: CLIP }}
        />
        <span
          aria-hidden="true"
          className="bg-background group-hover:bg-muted absolute inset-[1px] transition-colors"
          style={{ clipPath: CLIP, WebkitClipPath: CLIP }}
        />
      </>
    );

  const content = (
    <>
      {layers}
      <span className="relative">{children}</span>
    </>
  );

  if (href !== undefined) {
    return (
      <a href={href} onClick={onClick} aria-label={ariaLabel} id={id} className={base}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      id={id}
      className={base}
    >
      {content}
    </button>
  );
}
