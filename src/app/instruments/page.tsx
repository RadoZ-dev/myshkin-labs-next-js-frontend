import Instruments from "@/components/home/Instruments";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instruments | MИШKiN LAБS",
};

export default function InstrumentsPage() {
  return (
    <main>
      <div className="container mx-auto px-4 max-w-screen-xl pt-8">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to home
        </Link>
      </div>
      <div className="container mx-auto px-4 max-w-screen-xl py-16">
        <Instruments />
      </div>
    </main>
  );
}
