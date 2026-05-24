import { getInstruments } from "@/lib/wordpress";
import Link from "next/link";

export default async function Instruments() {
  let instruments = null;
  let errorMessage = null;

  try {
    instruments = await getInstruments();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load instruments";
    console.error("Error loading instruments:", errorMessage);
  }

  if (errorMessage) {
    return (
      <div className="text-red-500">
        <p>Error loading instruments: {errorMessage}</p>
      </div>
    );
  }

  if (!instruments || instruments.length === 0) {
    return (
      <div className="text-gray-500">
        <p>No instruments available</p>
      </div>
    );
  }

  return (
    <div className="myshkin-labs-instruments">
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Instruments</h2>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {instruments.map((instrument) => (
          <article
            key={instrument.id}
            className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold">{instrument.title}</h3>
              {instrument.instrumentMeta?.type && (
                <span className="text-sm bg-gray-100 px-2 py-1 rounded capitalize">
                  {instrument.instrumentMeta.type}
                </span>
              )}
            </div>
            {instrument.instrumentMeta?.stack && (
              <p className="text-sm text-gray-500 mb-1">
                {instrument.instrumentMeta.stack}
              </p>
            )}
            {instrument.instrumentMeta?.role && (
              <p className="text-sm text-gray-400 mb-4">
                {instrument.instrumentMeta.role}
              </p>
            )}
            <div
              className="text-gray-600 mb-4 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: instrument.content }}
            />
            <Link href={instrument.uri} className="text-blue-500 hover:underline">
              View →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
