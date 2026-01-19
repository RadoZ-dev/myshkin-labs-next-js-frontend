"use client";

import { Button } from "flowbite-react";
import { useEffect, useState, useRef } from "react";
import { getLatestExperiment, ExperimentNode } from "@/lib/wordpress";
import gsap from "gsap";

export default function Hero() {
  const [latestExperiment, setLatestExperiment] = useState<ExperimentNode | null>(null);
  const [loading, setLoading] = useState(true);
  
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const expRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const experiment = await getLatestExperiment();
        setLatestExperiment(experiment);
      } catch (error) {
        console.error("Failed to fetch latest experiment:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, []);

  useEffect(() => {
    // Animate elements on mount
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

    gsap.fromTo(
      buttonRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    // Animate experiment text when it loads
    if (latestExperiment && !loading && expRef.current) {
      gsap.fromTo(
        expRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 0.5 }
      );
    }
  }, [latestExperiment, loading]);

  const handleButtonHover = (isHovering: boolean) => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: isHovering ? 1.05 : 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleButtonClick = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    }
  };

  return (
    <section className="myshkin-labs-home__hero w-full h-screen flex flex-col items-center justify-center">
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

      {latestExperiment && !loading && (
        <p
          ref={expRef}
          className="mt-6 text-sm font-mono text-gray-600 dark:text-gray-300"
        >
          EXP #{latestExperiment.experimentNumber}: {latestExperiment.title}
        </p>
      )}

      <div
        ref={buttonRef}
        onMouseEnter={() => handleButtonHover(true)}
        onMouseLeave={() => handleButtonHover(false)}
        onClick={handleButtonClick}
      >
        <Button
          className="button mt-4 rounded-full"
          color="dark"
          size="lg"
          href={latestExperiment?.uri || "#features"}
          disabled={loading}
        >
          {loading ? "Loading..." : "Read More"}
        </Button>
      </div>
    </section>
  );
}
