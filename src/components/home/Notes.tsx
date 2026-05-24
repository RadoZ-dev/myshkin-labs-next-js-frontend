import { getNotes } from "@/lib/wordpress";
import Link from "next/link";

export default async function Notes() {
  let notes = null;
  let errorMessage = null;

  try {
    notes = await getNotes();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load notes";
    console.error("Error loading notes:", errorMessage);
  }

  if (errorMessage) {
    return (
      <div className="text-red-500">
        <p>Error loading notes: {errorMessage}</p>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="text-gray-500">
        <p>No notes available</p>
      </div>
    );
  }

  return (
    <div className="myshkin-labs-notes">
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Notes</h2>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <article
            key={note.id}
            className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold">{note.title}</h3>
              {note.noteMeta?.mood && (
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {note.noteMeta.mood}
                </span>
              )}
            </div>
            <div
              className="text-gray-600 mb-4 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
            <Link href={note.uri} className="text-blue-500 hover:underline">
              Read more →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
