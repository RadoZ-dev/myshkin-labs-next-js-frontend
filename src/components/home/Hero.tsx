"use client";

import { Button } from "flowbite-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { getLatestExperiment, ExperimentNode } from "@/lib/wordpress";

export default function Hero() {
  const [latestExperiment, setLatestExperiment] = useState<ExperimentNode | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="myshkin-labs-home__hero w-full h-screen flex flex-col items-center justify-center">
      <motion.h1 
        className="font-extrabold tracking-tight leading-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.1 }}
      >
        MИШKiN LAБS
      </motion.h1>

      <motion.p 
        className="myshkin-labs-home__subtitle mt-4 text-lg text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        Sound. Code. Experiments.
      </motion.p>

      {latestExperiment && !loading && (
        <motion.p
          className="mt-6 text-sm font-mono text-gray-600 dark:text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          EXP #{latestExperiment.experimentNumber}: {latestExperiment.title}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
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
      </motion.div>
    </section>
  );
}
