"use client";

import { PixelCharacter } from "@/components/pixel-character";
import { useAnimation, motion } from "motion/react";
import React, { useEffect, useRef, useState, type ReactNode } from "react";

const ROAM_MESSAGES = [
  "gm! post something!",
  "no ads here btw",
  "we live in pixels",
  "8-bit forever",
  "ur feed = ur kingdom",
  "based & pixel-pilled",
];

const BTN_MESSAGES = [
  "just click already!",
  "ur missing out...",
  "the feed awaits!!",
  "go on, click it",
  "do it. DO IT.",
  "one click. thats all.",
  "bro... the button",
];

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

async function waitWhile(ref: React.MutableRefObject<boolean>) {
  while (ref.current) await sleep(60);
}

function randomBetween(a: number, b: number): number {
  return a + (b - a) * Math.random();
}

function pick(list: string[], current: string): string {
  const others = list.filter((m) => m !== current);
  return others[Math.floor(Math.random() * others.length)] ?? current;
}

export function WalkingMascot(): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [isWalking, setIsWalking] = useState(false);
  const [facingRight, setFacingRight] = useState(false);
  const [message, setMessage] = useState<string | null>(ROAM_MESSAGES[0]!);
  const [angry, setAngry] = useState(false);
  const [atButton, setAtButton] = useState(false);
  const [dancing, setDancing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fallen, setFallen] = useState(false);
  const xRef = useRef<number | null>(null);
  const fallenRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const walk = async (to: number, speed = 120) => {
      await waitWhile(fallenRef);
      const from = xRef.current ?? 0;
      const dist = Math.abs(to - from);
      setFacingRight(to > from);
      setIsWalking(true);
      await controls.start({ x: to }, { duration: dist / speed, ease: "linear" });
      await waitWhile(fallenRef);
      xRef.current = to;
      setIsWalking(false);
    };

    const run = async () => {
      await sleep(600);
      if (cancelled) return;

      const container = containerRef.current;
      if (!container) return;

      const charWidth = 16 * 12;
      const maxX = container.clientWidth - charWidth - 24;
      xRef.current = maxX;
      controls.set({ x: maxX });
      setVisible(true);

      const dance = async () => {
        setIsWalking(false);
        setDancing(true);
        setMessage("boogie! 🕺");
        // Wiggle left-right rapidly
        for (let i = 0; i < 6; i++) {
          if (cancelled) break;
          setFacingRight(i % 2 === 0);
          await sleep(160);
        }
        setDancing(false);
        setMessage(null);
      };

      while (!cancelled) {
        // --- Walk to "Enter the feed" button ---
        const btn = document.getElementById("enter-feed-btn");
        const containerRect = container.getBoundingClientRect();
        let targetX = 160; // fallback
        if (btn) {
          const btnRect = btn.getBoundingClientRect();
          targetX = Math.max(8, btnRect.right - containerRect.left + 80);
        }

        // Pause + bubble before heading left
        setIsWalking(false);
        setMessage((m) => pick(ROAM_MESSAGES, m ?? ""));
        await sleep(randomBetween(2200, 3800));
        if (cancelled) break;
        setMessage(null);

        // Walk to first stop (1/3 of the way)
        const stop1X = maxX - (maxX - targetX) * randomBetween(0.25, 0.4);
        await walk(stop1X, 110);
        if (cancelled) break;
        setIsWalking(false);
        setMessage((m) => pick(ROAM_MESSAGES, m ?? ""));
        await sleep(randomBetween(2500, 4500));
        if (cancelled) break;
        setMessage(null);

        // Dance midway
        const midX = (stop1X + targetX) / 2;
        await walk(midX, 120);
        if (cancelled) break;
        await dance();
        if (cancelled) break;

        // Pause after dance
        setMessage((m) => pick(ROAM_MESSAGES, m ?? ""));
        await sleep(randomBetween(1800, 3200));
        if (cancelled) break;
        setMessage(null);

        await walk(targetX, 110);
        if (cancelled) break;

        // Angry face + fixed message at button
        setAngry(true);
        setAtButton(true);
        setMessage("Just click the button already!");
        await sleep(3800);
        if (cancelled) break;

        setAngry(false);
        setAtButton(false);
        setMessage(null);

        // Walk back — two stops
        const safeMax = Math.max(targetX + 1, maxX);
        const pause1X = targetX + (safeMax - targetX) * randomBetween(0.2, 0.45);
        await walk(pause1X, 110);
        if (cancelled) break;
        setIsWalking(false);
        setMessage((m) => pick(ROAM_MESSAGES, m ?? ""));
        await sleep(randomBetween(2000, 3500));
        if (cancelled) break;
        setMessage(null);

        const pause2X = targetX + (safeMax - targetX) * randomBetween(0.55, 0.8);
        await walk(pause2X, 110);
        if (cancelled) break;
        setIsWalking(false);
        await sleep(randomBetween(1500, 2800));
        if (cancelled) break;

        await walk(maxX, 110);
        if (cancelled) break;

        const showRoamBubble = Math.random() > 0.25;
        if (showRoamBubble) {
          setMessage((m) => pick(ROAM_MESSAGES, m ?? ""));
        }
        await sleep(randomBetween(2500, 4000));
        if (cancelled) break;
        setMessage(null);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [controls]);

  const handleClick = () => {
    if (fallenRef.current) return;
    fallenRef.current = true;
    setFallen(true);
    setIsWalking(false);
    setAngry(true);
    setDancing(false);
    setMessage("ow!! 💀");
    controls.stop();
    setTimeout(() => {
      setFallen(false);
      setMessage("hey!! rude. >:(");
      setAngry(true);
    }, 2000);
    setTimeout(() => {
      fallenRef.current = false;
      setAngry(false);
      setMessage(null);
    }, 4000);
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 bottom-8 z-20"
    >
      <motion.div
        animate={controls}
        className="absolute bottom-0 flex flex-col items-center"
        style={{ left: 0, opacity: visible ? 1 : 0 }}
      >
        {/* Speech bubble */}
        {message && (
          <div className="relative mb-3">
            <div className={`border-2 px-3 py-2 font-pixel text-[9px] leading-relaxed whitespace-nowrap ${atButton ? "border-red-600 bg-red-600/10 text-red-600" : "border-foreground bg-background text-foreground"}`}>
              {message}
            </div>
            <div
              className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 h-0 w-0"
              style={{
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `10px solid ${atButton ? "#dc2626" : "var(--foreground)"}`,
              }}
            />
            <div
              className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 h-0 w-0"
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `9px solid ${atButton ? "rgb(220 38 38 / 0.1)" : "var(--background)"}`,
              }}
            />
          </div>
        )}

        <motion.div
          animate={fallen ? { rotate: 90, y: 20 } : { rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          style={{ transform: facingRight ? "scaleX(1)" : "scaleX(-1)", cursor: "pointer" }}
          className="pointer-events-auto"
          onClick={handleClick}
        >
          <PixelCharacter scale={12} isWalking={isWalking || dancing} angry={angry} />
        </motion.div>
      </motion.div>
    </div>
  );
}
