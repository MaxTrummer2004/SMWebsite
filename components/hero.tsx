"use client";

import { PixelButton } from "@/components/pixel-button";
import { PixelField } from "@/components/pixel-field";
import { WalkingMascot } from "@/components/walking-mascot";
import { PixelIcon } from "@/components/pixel-icon";
import { useApp } from "@/lib/app";
import { useReducedMotion } from "@/lib/motion";
import { motion, type Variants } from "motion/react";
import { Fragment, type ReactNode } from "react";

const EASE = [0.4, 0, 0.2, 1] as const;

const FIELD_MASK =
  "radial-gradient(125% 105% at 100% 0%, #000 22%, transparent 72%)";

const HEADLINE = "Post. Sling GIFs. Pixels fly.";

type HeroProps = {
  onEnter: () => void;
};

export function Hero({ onEnter }: HeroProps): ReactNode {
  const reduced = useReducedMotion();
  const { openComposer } = useApp();

  const content: Variants = {
    hidden: {},
    visible: {
      transition: reduced ? {} : { staggerChildren: 0.12, delayChildren: 0.35 },
    },
  };

  const item: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE },
        },
      };

  const headline: Variants = {
    hidden: {},
    visible: {
      transition: reduced ? {} : { staggerChildren: 0.045 },
    },
  };

  const word: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { y: "115%" },
        visible: { y: "0%", transition: { duration: 0.65, ease: EASE } },
      };

  const words = HEADLINE.split(" ");

  const handleWritePost = () => {
    onEnter();
    openComposer();
  };

  return (
    <section
      className="relative flex min-h-screen flex-col p-4 sm:p-6 lg:p-8"
      aria-labelledby="hero-title"
    >
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduced ? { duration: 0.3 } : { duration: 0.7, ease: EASE }
        }
        className="relative flex flex-1 overflow-hidden border border-border bg-transparent"
      >
        {/* PixelField — mobile: full-width top strip; desktop: top-right corner */}
        <motion.div
          aria-hidden="true"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduced
              ? { duration: 0.4 }
              : { duration: 1, ease: EASE, delay: 0.35 }
          }
          className="pointer-events-none absolute top-0 inset-x-0 h-48 sm:inset-x-auto sm:right-0 sm:inset-y-0 sm:h-auto sm:w-3/4 lg:w-1/2"
          style={{
            maskImage: "linear-gradient(to bottom, #000 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 30%, transparent 100%)",
            transformOrigin: "top right",
          }}
          // Desktop overrides mask to original radial gradient
        >
          <PixelField className="h-full w-full sm:hidden" fill={0.65} />
          <PixelField className="h-full w-full hidden sm:block" />
        </motion.div>
        {/* Desktop-only mask override */}
        <motion.div
          aria-hidden="true"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduced
              ? { duration: 0.4 }
              : { duration: 1, ease: EASE, delay: 0.35 }
          }
          className="pointer-events-none absolute top-0 right-0 inset-y-0 w-3/4 lg:w-1/2 hidden sm:block"
          style={{
            maskImage: FIELD_MASK,
            WebkitMaskImage: FIELD_MASK,
            transformOrigin: "top right",
          }}
        >
          <PixelField className="h-full w-full" />
        </motion.div>

        {/* Content */}
        <motion.div
          variants={content}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex w-fit flex-col justify-center px-6 pt-8 pb-52 sm:px-10 sm:py-14 lg:px-16 lg:py-20"
        >
          {/* Opaque backdrop only behind text+buttons — cursor grid shows through empty card area */}
          <div className="relative z-20 w-fit bg-background/85 backdrop-blur-sm px-6 py-5 sm:py-8 -mx-6 sm:-mx-10 lg:-mx-16 sm:px-10 lg:px-16">
            <motion.span
              variants={item}
              className="inline-flex w-fit items-center gap-2 border border-white/20 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-accent"
            >
              <PixelIcon name="sparkle" className="h-3 w-3" />
              local-first social club
            </motion.span>

            <motion.h1
              id="hero-title"
              variants={headline}
              className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-foreground sm:mt-6 sm:text-7xl lg:text-8xl"
            >
              {words.map((w, i) => (
                <Fragment key={`${w}-${i}`}>
                  <span className="inline-block overflow-hidden pb-[0.12em] align-bottom -mb-[0.12em]">
                    <motion.span variants={word} className="inline-block">
                      {w}
                    </motion.span>
                  </span>
                  {i < words.length - 1 ? " " : null}
                </Fragment>
              ))}
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-4 max-w-2xl font-mono text-base leading-relaxed text-muted-foreground hidden sm:block"
            >
              SMKnowers is the tiny 8-bit hangout for you and your friends. Write
              a thought, drop the perfect GIF, react, repeat. Your feed lives in
              your browser — no accounts, no ads, no noise.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <PixelButton onClick={handleWritePost} variant="solid" size="lg">
                <span className="font-mono">Write a post</span>
              </PixelButton>
              <PixelButton onClick={onEnter} variant="outline" size="lg" id="enter-feed-btn">
                <span className="font-mono">Enter the feed</span>
              </PixelButton>
            </motion.div>
          </div>
        </motion.div>

        {/* Walking mascot */}
        <WalkingMascot />
      </motion.div>
    </section>
  );
}
