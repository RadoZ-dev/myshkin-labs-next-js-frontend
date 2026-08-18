import Instruments from "@/components/home/Instruments";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instruments | MИШKiN LAБS",
};

export default function InstrumentsPage() {
  return (
    <main className="max-w-7xl px-4 py-4" style={{ margin: "0px auto" }}>
      <div className="pt-8">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to home
        </Link>
      </div>
      <div className="py-16">
        <Instruments />
      </div>
    </main>
  );
}
