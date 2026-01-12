"use client";

import { Button } from "flowbite-react";

export default function Home() {
  return (
    <div className="myshkin-labs-home min-h-screen">
      {/* Hero Section */}
      <section className="myshkin-labs-home__hero w-full h-screen flex flex-col items-center justify-center">
        <h1 className="font-extrabold tracking-tight leading-none">
          MИШKiN LAБS
        </h1>
        <p className="myshkin-labs-home__subtitle mt-4 text-lg text-gray-500 dark:text-gray-400">
          Sound. Code. Experiments.
        </p>
        <Button
          className="button mt-6 rounded-full"
          color="dark"
          size="lg"
          href="#features"
        >
          Latest Experiment
        </Button>
      </section>

      {/* Feature Section */}
      <section className="bg-gray-50 dark:bg-gray-800">
        <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <div className="max-w-screen-md mb-8 lg:mb-16">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
              Designed for modern development
            </h2>
            <p className="text-gray-500 sm:text-xl dark:text-gray-400">
              Built with the latest technologies and best practices
            </p>
          </div>
          <div className="space-y-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-12 md:space-y-0">
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">Next.js 16</h3>
              <p className="text-gray-500 dark:text-gray-400">
                React framework with App Router for building modern web applications
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">Tailwind CSS</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Utility-first CSS framework for rapid UI development
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">TypeScript</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Type-safe development with full IntelliSense support
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
