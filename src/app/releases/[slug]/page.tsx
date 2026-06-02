import { getReleases, getReleaseBySlug } from "@/lib/wordpress";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const releases = await getReleases();
  return releases.map((release) => ({
    slug: release.uri.split("/").filter(Boolean).pop() || "",
  }));
}

export async function generateMetadata({ params }: ReleasePageProps) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);

  if (!release) {
    return { title: "Release Not Found" };
  }

  return {
    title: `${release.title} | MИШKiN LAБS`,
    description: release.content.replace(/<[^>]+>/g, "").substring(0, 160),
  };
}

export default async function ReleasePage({ params }: ReleasePageProps) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);

  if (!release) {
    notFound();
  }

  return (
    <article className="max-w-7xl px-4 py-4" style={{ margin: "0px auto" }}>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/releases"
          className="text-blue-500 hover:underline mb-6 inline-block"
        >
          ← Back to releases
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{release.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {release.releaseMeta?.releaseType && (
              <span>Type: {release.releaseMeta.releaseType}</span>
            )}
            {release.releaseMeta?.releaseDate && (
              <span>
                Date:{" "}
                {new Date(release.releaseMeta.releaseDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </header>

        <div
          className="prose max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: release.content }}
        />

        {release.releaseMeta?.externalLink && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href={release.releaseMeta.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              View External Link ↗
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
