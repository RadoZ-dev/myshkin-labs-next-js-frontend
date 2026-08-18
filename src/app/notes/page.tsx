import Notes from "@/components/home/Notes";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes | MИШKiN LAБS",
};

export default function NotesPage() {
  return (
    <main className="max-w-7xl px-4 py-4" style={{ margin: "0px auto" }}>
      <div className="pt-8">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to home
        </Link>
      </div>
      <div className="py-16">
        <Notes />
      </div>
    </main>
  );
}
