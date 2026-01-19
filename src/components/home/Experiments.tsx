import { getExperiments, ExperimentNode } from "@/lib/wordpress";
import Link from "next/link";

export default async function Experiments() {
  let experiments: ExperimentNode[] = [];
  let error: string | null = null;

  try {
    experiments = await getExperiments();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load experiments";
    console.error("Error fetching experiments:", err);
  }

  return (
    <section className="experiments-section bg-white dark:bg-gray-900 py-16">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="mb-8 lg:mb-16">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            Latest Experiments
          </h2>
          <p className="text-gray-500 sm:text-xl dark:text-gray-400">
            Explore our recent experiments in sound and code
          </p>
        </div>

        {error ? (
          <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400">
            {error}
          </div>
        ) : experiments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No experiments found yet.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {experiments.map((experiment) => (
              <article
                key={experiment.id}
                className="p-6 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              >
                <div
                  className="mb-4 text-gray-500 dark:text-gray-400"
                  dangerouslySetInnerHTML={{ __html: experiment.excerpt }}
                />
                <Link
                  href={experiment.uri}
                  className="inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline"
                >
                  View Experiment
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
