import { getNotes, getNoteBySlug } from "@/lib/wordpress";
import Link from "next/link";
import { notFound } from "next/navigation";

interface NotePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const notes = await getNotes();
  return notes.map((note) => ({
    slug: note.uri.split("/").filter(Boolean).pop() || "",
  }));
}

export async function generateMetadata({ params }: NotePageProps) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  if (!note) {
    return { title: "Note Not Found" };
  }

  return {
    title: `${note.title} | MИШKiN LAБS`,
    description: note.content.replace(/<[^>]+>/g, "").substring(0, 160),
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  return (
    <article className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/notes" className="text-blue-500 hover:underline mb-6 inline-block">
          ← Back to notes
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{note.title}</h1>
          {note.noteMeta?.mood && (
            <p className="text-sm text-gray-500">Mood: {note.noteMeta.mood}</p>
          )}
        </header>

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </div>
    </article>
  );
}
