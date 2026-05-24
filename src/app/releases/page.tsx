import Releases from "@/components/home/Releases";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Releases | MИШKiN LAБS",
};

export default function ReleasesPage() {
  return (
    <main>
      <div className="container mx-auto px-4 max-w-screen-xl pt-8">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to home
        </Link>
      </div>
      <div className="container mx-auto px-4 max-w-screen-xl py-16">
        <Releases />
      </div>
    </main>
  );
}
