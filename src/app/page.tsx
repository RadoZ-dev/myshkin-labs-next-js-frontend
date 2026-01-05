"use client";

import { Button } from "flowbite-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-900">
        <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
              MИШКiN LAБS
            </h1>
            <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
              Building modern web experiences with Next.js, Tailwind CSS, and headless WordPress. 
              Start creating something amazing today.
            </p>
            <div className="flex gap-4">
              <Button size="lg" color="dark">
                Get Started
              </Button>
              <Button size="lg" color="light">
                Learn More
              </Button>
            </div>
          </div>
          <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
            <img
              src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/phone-mockup.png"
              alt="mockup"
            />
          </div>
        </div>
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
