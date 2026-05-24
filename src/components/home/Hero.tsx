"use client";

import { Button } from "flowbite-react";
import { useEffect, useState, useRef } from "react";
import { getLatestPost, getPostTypeLabel, LatestPostNode } from "@/lib/wordpress";
import gsap from "gsap";

export default function Hero() {
  const [latestPost, setLatestPost] = useState<LatestPostNode | null>(null);
  const [loading, setLoading] = useState(true);

  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const expRef = useRef<HTMLParagraphElement>(null);
  const expLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const post = await getLatestPost();
        setLatestPost(post);
      } catch (error) {
        console.error("Failed to fetch latest post:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      h1Ref.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.1 }
    );

    gsap.fromTo(
      subtitleRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1, delay: 0.2 }
    );
  }, []);

  useEffect(() => {
    if (latestPost && !loading && expRef.current) {
      gsap.fromTo(
        expRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 0.5 }
      );
    }
  }, [latestPost, loading]);

  const handleExpLinkHover = (isHovering: boolean) => {
    if (expLinkRef.current) {
      gsap.to(expLinkRef.current, {
        scale: isHovering ? 1.05 : 1,
        textShadow: isHovering ? '0 0 8px rgba(99, 102, 241, 0.5)' : '0 0 0px rgba(99, 102, 241, 0)',
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  return (
    <section className="myshkin-labs-home__hero w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1
          ref={h1Ref}
          className="font-extrabold tracking-tight leading-none"
        >
          MИШKiN LAБS
        </h1>

        <p
          ref={subtitleRef}
          className="myshkin-labs-home__subtitle mt-4 text-lg text-gray-500 dark:text-gray-400"
        >
          Sound. Code. Experiments.
        </p>

        {latestPost && !loading && (
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
          </div>
        )}
      </div>
    </section>
  );
}
