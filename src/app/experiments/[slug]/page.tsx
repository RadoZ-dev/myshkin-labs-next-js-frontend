import { getExperiments, getExperimentBySlug } from "@/lib/wordpress";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ExperimentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const experiments = await getExperiments();
  return experiments.map((experiment) => ({
    slug: experiment.uri.split("/").filter(Boolean).pop() || "",
  }));
}

export async function generateMetadata({ params }: ExperimentPageProps) {
  const { slug } = await params;
  const experiment = await getExperimentBySlug(slug);

  if (!experiment) {
    return { title: "Experiment Not Found" };
  }

  return {
    title: `${experiment.title} | MИШKiN LAБS`,
    description: experiment.excerpt.replace(/<[^>]+>/g, "").substring(0, 160),
  };
}

export default async function ExperimentPage({ params }: ExperimentPageProps) {
  const { slug } = await params;
  const experiment = await getExperimentBySlug(slug);

  if (!experiment) {
    notFound();
  }

  return (
    <article className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/experiments" className="text-blue-500 hover:underline mb-6 inline-block">
          ← Back to experiments
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{experiment.title}</h1>
          {experiment.excerpt && (
            <div
              className="text-lg text-gray-600"
              dangerouslySetInnerHTML={{ __html: experiment.excerpt }}
            />
          )}
        </header>

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: experiment.content }}
        />
      </div>
    </article>
  );
}
