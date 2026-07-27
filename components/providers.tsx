"use client";

import { AuthModal } from "@/components/auth-modal";
import { ComposerModal } from "@/components/composer-modal";
import { SmoothScroll } from "@/components/smooth-scroll";
import { AppProvider } from "@/lib/app";
import { ReducedMotionProvider } from "@/lib/motion";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }): ReactNode {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ReducedMotionProvider>
        <AppProvider>
          <SmoothScroll>{children}</SmoothScroll>
          <AuthModal />
          <ComposerModal />
        </AppProvider>
      </ReducedMotionProvider>
    </ThemeProvider>
  );
}
