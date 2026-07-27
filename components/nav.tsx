"use client";

import { Logo } from "@/components/logo";
import { PixelButton } from "@/components/pixel-button";
import { PixelIcon } from "@/components/pixel-icon";
import { useApp } from "@/lib/app";
import { useState, type ReactNode } from "react";

const LINKS = [
  { label: "Feed", href: "#feed", icon: "list" as const },
  { label: "Trending", href: "#trending", icon: "sparkle" as const },
  { label: "About", href: "#about", icon: "chat" as const },
];

export function Nav(): ReactNode {
  const { signedIn, account, openComposer, openAuth, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="focus-ring group flex items-center gap-2 px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <PixelIcon
                name={link.icon}
                className="h-3.5 w-3.5 text-accent opacity-70 transition-opacity group-hover:opacity-100"
              />
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {signedIn && account ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="focus-ring flex items-center gap-2 border border-border px-2 py-1.5 transition-colors hover:border-accent"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span
                  className="pixel-clip flex h-6 w-6 items-center justify-center font-pixel text-[9px] text-white"
                  style={{ backgroundColor: account.avatarColor }}
                >
                  {account.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden font-mono text-xs sm:inline">
                  {account.handle}
                </span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="pixel-clip absolute right-0 top-full mt-2 w-40 border-2 border-foreground bg-background p-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="focus-ring w-full px-3 py-2 text-left font-mono text-sm hover:bg-muted"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuth}
              className="focus-ring px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </button>
          )}

          <PixelButton onClick={openComposer} size="md">
            <span className="font-mono text-sm">+ New post</span>
          </PixelButton>
        </div>
      </div>
    </header>
  );
}
