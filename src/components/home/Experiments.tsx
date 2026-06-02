import { getExperiments } from "@/lib/wordpress";
import Link from "next/link";

export default async function Experiments() {
  let experiments = null;
  let errorMessage = null;

  try {
    experiments = await getExperiments();
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Failed to load experiments";
    console.error("Error loading experiments:", errorMessage);
  }

  if (errorMessage) {
    return (
      <section className="myshkin-labs-experiments">
        <p className="text-red-500">
          Error loading experiments: {errorMessage}
        </p>
      </section>
    );
  }

  if (!experiments || experiments.length === 0) {
    return (
      <section className="myshkin-labs-experiments">
        <p>No experiments available</p>
      </section>
    );
  }

  return (
    <section className="myshkin-labs-experiments">
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold">
        Experiments
      </h2>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {experiments.map((experiment) => (
          <article
            key={experiment.id}
            className="p-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold">{experiment.title}</h3>
            </div>
            <div
              className="mb-4 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: experiment.content }}
            />
            <Link href={experiment.uri} className="hover:underline">
              View Experiment →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
