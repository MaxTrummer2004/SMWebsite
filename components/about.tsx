"use client";

import PixelReveal from "@/components/pixel-reveal";
import { PixelIcon } from "@/components/pixel-icon";
import StaggeredText from "@/components/staggered-text";
import { useReducedMotion } from "@/lib/motion";
import type { PixelName } from "@/components/pixel-icon";
import type { ReactNode } from "react";

const STEPS: { icon: PixelName; title: string; body: string }[] = [
  {
    icon: "type",
    title: "Write it",
    body: "Type a thought, a joke, a plan. Add a #hashtag so friends can find it.",
  },
  {
    icon: "film",
    title: "GIF it",
    body: "Search millions of GIFs from Giphy and drop the perfect one in a tap.",
  },
  {
    icon: "sparkle",
    title: "React to it",
    body: "Like posts, watch the feed animate, and keep the pixels flying.",
  },
];

export function About(): ReactNode {
  const reduced = useReducedMotion();

  return (
    <section
      id="about"
      className="border-t border-border bg-muted/40"
      aria-labelledby="about-title"
    >
      <div className="mx-auto grid max-w-[1100px] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 id="about-title" className="font-pixel text-2xl leading-[1.5]">
            <StaggeredText
              text="How it works"
              as="span"
              segmentBy="words"
              blur
              duration={0.5}
            />
          </h2>
          <p className="mt-5 max-w-md font-mono text-sm leading-relaxed text-muted-foreground">
            No sign-ups, no algorithm, no strangers. SMKnowers keeps everything
            in your browser so it stays small, fast, and just for your crew.
          </p>

          <ul className="mt-8 space-y-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="pixel-clip flex h-11 w-11 shrink-0 items-center justify-center bg-foreground text-background">
                  <PixelIcon name={step.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-sm font-semibold">
                    <span className="text-accent">0{i + 1}</span> — {step.title}
                  </p>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* React Bits: pixel-sweep image reveal */}
        <div className="mx-auto w-full max-w-sm">
          <div className="pixel-clip border-2 border-foreground pixel-shadow">
            <PixelReveal
              imageSrc="/pixel-art.svg"
              width="100%"
              height={360}
              gridSize={28}
              transitionColor="#ea580c"
              duration={1.4}
              autoTrigger={!reduced}
              triggerOnce={false}
            />
          </div>
          <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
            built with pixels, on purpose
          </p>
        </div>
      </div>
    </section>
  );
}
