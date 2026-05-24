import Experiments from "@/components/home/Experiments";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experiments | MИШKiN LAБS",
};

export default function ExperimentsPage() {
  return (
    <main>
      <div className="container mx-auto px-4 max-w-screen-xl pt-8">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to home
        </Link>
      </div>
      <Experiments />
    </main>
  );
}
