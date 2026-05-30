import { getReleases } from "@/lib/wordpress";
import Link from "next/link";

export default async function Releases() {
  let releases = null;
  let errorMessage = null;

  try {
    releases = await getReleases();
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Failed to load releases";
    console.error("Error loading releases:", errorMessage);
  }

  if (errorMessage) {
    return (
      <div className="text-red-500">
        <p>Error loading releases: {errorMessage}</p>
      </div>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <div className="">
        <p>No releases available</p>
      </div>
    );
  }

  return (
    <div className="myshkin-labs-releases">
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold dark:text-white">
        Releases
      </h2>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {releases.map((release) => (
          <article
            key={release.id}
            className="p-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold">{release.title}</h3>
              {release.releaseMeta?.releaseType && (
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {release.releaseMeta.releaseType}
                </span>
              )}
            </div>
            {release.releaseMeta?.releaseDate && (
              <p className="text-sm mb-2">
                {new Date(release.releaseMeta.releaseDate).toLocaleDateString()}
              </p>
            )}
            <div
              className="mb-4 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: release.content }}
            />
            <div className="flex gap-2">
              <Link href={release.uri} className="hover:underline">
                Learn more →
              </Link>
              {release.releaseMeta?.externalLink && (
                <a
                  href={release.releaseMeta.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  External link ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
