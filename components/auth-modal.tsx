"use client";

import { PixelButton } from "@/components/pixel-button";
import { PixelIcon } from "@/components/pixel-icon";
import { useApp } from "@/lib/app";
import { useReducedMotion } from "@/lib/motion";
import { AVATAR_COLORS } from "@/lib/store";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

type Mode = "signup" | "login";

export function AuthModal(): ReactNode {
  const { authOpen, closeAuth, signedIn, signup, login } = useApp();
  const reduced = useReducedMotion();

  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(AVATAR_COLORS[0] ?? "#ea580c");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authOpen) {
      setMode(signedIn ? "login" : "signup");
      setError(null);
      setEmail("");
      setPassword("");
    }
  }, [authOpen, signedIn]);

  if (!authOpen) return null;

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const res =
      mode === "signup"
        ? await signup({ email, password, displayName: name, avatarColor: color })
        : await login(email, password);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        initial={reduced ? undefined : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={closeAuth}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={mode === "signup" ? "Create account" : "Sign in"}
          initial={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          className="pixel-clip pixel-shadow-accent relative w-full max-w-md border-2 border-foreground bg-background"
        >
          <div className="scanlines flex items-center gap-3 border-b-2 border-foreground bg-panel px-5 py-4 text-panel-foreground">
            <span className="pixel-clip flex h-9 w-9 items-center justify-center bg-accent text-white">
              <PixelIcon name="user" className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-pixel text-[12px]">
                {mode === "signup" ? "New player" : "Welcome back"}
              </h2>
              <p className="font-mono text-[11px] text-panel-foreground/60">
                {mode === "signup" ? "create your account" : "sign in to continue"}
              </p>
            </div>
            <button
              type="button"
              onClick={closeAuth}
              className="focus-ring ml-auto font-mono text-sm text-panel-foreground/70 hover:text-panel-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 p-5">
            {mode === "signup" && (
              <>
                <div>
                  <label
                    htmlFor="auth-name"
                    className="mb-1.5 block font-mono text-xs text-muted-foreground"
                  >
                    Display name
                  </label>
                  <input
                    id="auth-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    autoFocus
                    placeholder="e.g. Pixel Max"
                    className="focus-ring w-full border border-border bg-muted px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {name.trim() && (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      you&apos;ll post as{" "}
                      <span className="text-accent">
                        @
                        {name
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9_]+/g, "")
                          .slice(0, 16) || "friend"}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <span className="mb-1.5 block font-mono text-xs text-muted-foreground">
                    Avatar color
                  </span>
                  <div className="flex gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        aria-label={`Pick color ${c}`}
                        aria-pressed={color === c}
                        className={`pixel-clip h-8 w-8 border-2 transition-transform hover:-translate-y-0.5 ${
                          color === c ? "border-foreground" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block font-mono text-xs text-muted-foreground"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus={mode === "login"}
                placeholder="you@example.com"
                className="focus-ring w-full border border-border bg-muted px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block font-mono text-xs text-muted-foreground"
              >
                Password{" "}
                {mode === "signup" && (
                  <span className="text-muted-foreground/60">(min. 6 characters)</span>
                )}
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
                className="focus-ring w-full border border-border bg-muted px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <p className="border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
                {error}
              </p>
            )}

            <PixelButton onClick={submit} size="lg" className="w-full">
              <span className="font-mono">
                {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
              </span>
            </PixelButton>

            <p className="text-center font-mono text-[11px] text-muted-foreground">
              {mode === "signup" ? (
                <button
                  type="button"
                  className="focus-ring underline hover:text-foreground"
                  onClick={() => { setMode("login"); setError(null); }}
                >
                  Already have an account? Sign in
                </button>
              ) : (
                <button
                  type="button"
                  className="focus-ring underline hover:text-foreground"
                  onClick={() => { setMode("signup"); setError(null); }}
                >
                  No account yet? Sign up
                </button>
              )}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
