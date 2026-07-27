import { Logo } from "@/components/logo";
import { PixelField } from "@/components/pixel-field";
import { PixelIcon } from "@/components/pixel-icon";
import type { ReactNode } from "react";

export function Footer(): ReactNode {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-panel text-panel-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-40"
      >
        <PixelField className="h-full w-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1100px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs font-mono text-sm text-panel-foreground/60">
              The tiny 8-bit social club for friends. Real-time. Shared.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(["chat", "sparkle", "film", "user"] as const).map((icon) => (
              <span
                key={icon}
                className="pixel-clip flex h-9 w-9 items-center justify-center border border-white/20 text-panel-foreground/80"
              >
                <PixelIcon name={icon} className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono text-xs text-panel-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SMKnowers · made with pixels</p>
          <p>Posts shared live with everyone · powered by Giphy</p>
        </div>
      </div>
    </footer>
  );
}
