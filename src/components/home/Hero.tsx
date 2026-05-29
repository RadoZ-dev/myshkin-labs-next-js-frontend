"use client";

import { useEffect, useRef } from "react";
import { getPostTypeLabel, LatestPostNode } from "@/lib/wordpress";
import gsap from "gsap";

interface HeroProps {
  latestPost: LatestPostNode | null;
}

export default function Hero({ latestPost }: HeroProps) {
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
    if (latestPost && expRef.current) {
      gsap.fromTo(
        expRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 0.5 },
      );
    }
  }, [latestPost]);

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
    <section className="myshkin-labs-home__hero p-4 w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 ref={h1Ref} className="font-extrabold tracking-tight leading-none">
          MИШKiN LAБS
        </h1>

        <p
          ref={subtitleRef}
          className="myshkin-labs-home__subtitle mt-4 text-lg text-gray-500 dark:text-gray-400"
        >
          Sound. Code. Experiments.
        </p>

        {latestPost && (
          <div
            ref={expRef}
            className="myshkin-labs-home__latest-experiment-container"
            style={{ opacity: 0 }}
          >
            <p className="myshkin-labs-home__latest-experiment-label text-lg md:text-3xl font-bold text-center mt-8">
              Latest {getPostTypeLabel(latestPost.type)}:
            </p>
            <a
              ref={expLinkRef}
              href={latestPost.uri}
              className="myshkin-labs-home__latest-experiment mt-6 text-sm font-mono text-gray-600 dark:text-gray-300 block"
              onMouseEnter={() => handleExpLinkHover(true)}
              onMouseLeave={() => handleExpLinkHover(false)}
            >
              {latestPost.title}
            </a>
            <a
              href={latestPost.uri}
              className="myshkin-labs-home__read-more mt-6 inline-block  px-8 py-4 text-base font-mono bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
            >
              Read more →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
