"use client";

import { About } from "@/components/about";
import { Feed } from "@/components/feed";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { PixelField } from "@/components/pixel-field";
import { PixelTransition } from "@/components/pixel-transition";
import { Trending } from "@/components/trending";
import { useState, useCallback, type ReactNode } from "react";

export function HomeClient(): ReactNode {
  const [entered, setEntered] = useState(false);
  // showHeroTransition: plays on first page load to reveal hero
  const [showHeroTransition, setShowHeroTransition] = useState(true);
  // showFeedTransition: plays when entering the feed
  const [showFeedTransition, setShowFeedTransition] = useState(false);

  const handleEnter = useCallback(() => {
    setEntered(true);           // switch to feed immediately
    setShowFeedTransition(true); // overlay covers the switch
  }, []);

  return (
    <>
      {/* Hero pixel sweep on page load */}
      {showHeroTransition && (
        <PixelTransition onDone={() => setShowHeroTransition(false)} />
      )}

      {/* Feed pixel sweep on enter */}
      {showFeedTransition && (
        <PixelTransition onDone={() => setShowFeedTransition(false)} />
      )}

      {!entered ? (
        <Hero onEnter={handleEnter} />
      ) : (
        <>
          <Nav />
          <main id="main-content" className="relative z-10">
            {/* Left pixel strip */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 left-0 z-0 w-80 hidden xl:block opacity-35" style={{ maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, transparent 100%)" }}>
              <PixelField className="h-full w-full" direction="left" />
            </div>
            {/* Right pixel strip */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 right-0 z-0 w-80 hidden xl:block opacity-35"
              style={{ maskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, transparent 100%)", WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, transparent 100%)" }}>
              <PixelField className="h-full w-full" direction="right" />
            </div>

            <div className="relative z-10 mx-auto max-w-[1100px] px-4 py-12 sm:px-6 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                <Feed />
                <Trending />
              </div>
            </div>
            <About />
          </main>
          <Footer />
        </>
      )}
    </>
  );
}
