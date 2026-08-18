"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { LatestPostNode } from "@/lib/wordpress";
import gsap from "gsap";

interface HeroProps {
  // Kept so Home.tsx's existing call site still type-checks. The hero now
  // links to /tools rather than the latest WordPress post.
  latestPost?: LatestPostNode | null;
}

export default function Hero({}: HeroProps) {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const expRef = useRef<HTMLDivElement>(null);
  const expLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    gsap.fromTo(
      h1Ref.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.1 },
    );

    gsap.fromTo(
      subtitleRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1, delay: 0.2 },
    );
  }, []);

  useEffect(() => {
    if (expRef.current) {
      gsap.fromTo(
        expRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 0.5 },
      );
    }
  }, []);

  const handleExpLinkHover = (isHovering: boolean) => {
    if (expLinkRef.current) {
      gsap.to(expLinkRef.current, {
        scale: isHovering ? 1.05 : 1,
        textShadow: isHovering
          ? "0 0 8px rgba(99, 102, 241, 0.5)"
          : "0 0 0px rgba(99, 102, 241, 0)",
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  return (
    <section className="myshkin-labs-home__hero py-4 w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 ref={h1Ref} className="font-extrabold tracking-tight leading-none">
          MИШKiN LAБS
        </h1>

        <p
          ref={subtitleRef}
          className="myshkin-labs-home__subtitle mt-4 text-lg"
        >
          Sound. Code. Experiments.
        </p>

        <div
          ref={expRef}
          className="myshkin-labs-home__latest-experiment-container"
          style={{ opacity: 0 }}
        >
          <p className="myshkin-labs-home__latest-experiment-label text-lg md:text-3xl font-bold text-center mt-8">
            Play with the instruments:
          </p>
          <Link
            ref={expLinkRef}
            href="/tools"
            className="myshkin-labs-home__latest-experiment mt-6 text-sm font-mono block"
            onMouseEnter={() => handleExpLinkHover(true)}
            onMouseLeave={() => handleExpLinkHover(false)}
          >
            Rhythm & melody tools you can use in the browser
          </Link>
          <Link
            href="/tools"
            className="myshkin-labs-home__read-more button mt-6 inline-block  px-8 py-4 text-base font-mono bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
          >
            Open tools →
          </Link>
        </div>
      </div>
    </section>
  );
}
