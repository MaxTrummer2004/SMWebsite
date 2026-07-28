"use client";

import { PixelIcon } from "@/components/pixel-icon";
import { useApp } from "@/lib/app";
import { useEffect, useRef, useState, type ReactNode } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function NotificationSettings(): ReactNode {
  const { posts } = useApp();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [followed, setFollowed] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const subRef = useRef<PushSubscription | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Unique non-mascot authors
  const authors = Array.from(
    new Map(
      posts
        .filter((p) => !p.isMascot)
        .map((p) => [p.handle, { handle: p.handle, author: p.author, color: p.avatarColor }]),
    ).values(),
  );
  // Always include Brixel
  const allAuthors = [
    { handle: "@brixel", author: "Brixel", color: "#ea580c" },
    ...authors,
  ];

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);

    // Load saved handles regardless of subscription state
    const saved = localStorage.getItem("smknowers.notif.followed");
    if (saved) {
      try { setFollowed(JSON.parse(saved)); } catch { /* ignore */ }
    }

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          subRef.current = sub;
          setSubscribed(true);
        }
      });
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const subscribe = async (handles: string[]) => {
    setSaving(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = subRef.current;
      if (!sub) {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") { setSaving(false); return; }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        subRef.current = sub;
      }
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), followedHandles: handles }),
      });
      localStorage.setItem("smknowers.notif.followed", JSON.stringify(handles));
      setFollowed(handles);
      setSubscribed(true);
    } finally {
      setSaving(false);
    }
  };

  const unsubscribe = async () => {
    setSaving(true);
    try {
      const sub = subRef.current;
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
        subRef.current = null;
      }
      localStorage.removeItem("smknowers.notif.followed");
      setFollowed([]);
      setSubscribed(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleHandle = (handle: string) => {
    setFollowed((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle],
    );
  };

  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  if (permission === "denied") return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`focus-ring flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs transition-colors ${
          subscribed
            ? "border-accent text-accent"
            : "border-border text-muted-foreground hover:border-accent hover:text-accent"
        }`}
        aria-label="Notification settings"
      >
        <PixelIcon name="sparkle" className="h-3 w-3" />
        {subscribed ? "notifs on" : "notify"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 border-2 border-foreground bg-background p-4 shadow-xl">
          <p className="font-pixel text-[10px] mb-3">
            {subscribed ? "Notify me when…" : "Get notified when…"}
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allAuthors.map(({ handle, author, color }) => (
              <label key={handle} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={followed.includes(handle)}
                  onChange={() => toggleHandle(handle)}
                  className="accent-accent"
                />
                <span
                  className="pixel-clip flex h-5 w-5 shrink-0 items-center justify-center font-pixel text-[8px] text-white"
                  style={{ backgroundColor: color }}
                >
                  {author.charAt(0).toUpperCase()}
                </span>
                <span className="font-mono text-xs">{author}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{handle}</span>
              </label>
            ))}
          </div>

          {followed.length === 0 && (
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">Select at least one.</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving || followed.length === 0}
              onClick={() => subscribe(followed)}
              className="flex-1 border-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-xs text-background disabled:opacity-40 hover:bg-foreground/90"
            >
              {saving ? "…" : subscribed ? "Update" : "Enable"}
            </button>
            {subscribed && (
              <button
                type="button"
                disabled={saving}
                onClick={unsubscribe}
                className="border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:border-accent hover:text-accent disabled:opacity-40"
              >
                Off
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
