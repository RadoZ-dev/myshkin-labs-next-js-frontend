import { getInstruments, getInstrumentBySlug } from "@/lib/wordpress";
import Link from "next/link";
import { notFound } from "next/navigation";

interface InstrumentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const instruments = await getInstruments();
  return instruments.map((instrument) => ({
    slug: instrument.uri.split("/").filter(Boolean).pop() || "",
  }));
}

export async function generateMetadata({ params }: InstrumentPageProps) {
  const { slug } = await params;
  const instrument = await getInstrumentBySlug(slug);

  if (!instrument) {
    return { title: "Instrument Not Found" };
  }

  return {
    title: `${instrument.title} | MИШKiN LAБS`,
    description: instrument.content.replace(/<[^>]+>/g, "").substring(0, 160),
  };
}

export default async function InstrumentPage({ params }: InstrumentPageProps) {
  const { slug } = await params;
  const instrument = await getInstrumentBySlug(slug);

  if (!instrument) {
    notFound();
  }

  return (
    <article className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/instruments" className="text-blue-500 hover:underline mb-6 inline-block">
          ← Back to instruments
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{instrument.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {instrument.instrumentMeta?.type && (
              <span className="capitalize">{instrument.instrumentMeta.type}</span>
            )}
            {instrument.instrumentMeta?.stack && (
              <span>{instrument.instrumentMeta.stack}</span>
            )}
            {instrument.instrumentMeta?.role && (
              <span>{instrument.instrumentMeta.role}</span>
            )}
          </div>
        </header>

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: instrument.content }}
        />
      </div>
    </article>
  );
}
