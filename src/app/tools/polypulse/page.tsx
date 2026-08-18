import Link from "next/link";
import type { Metadata } from "next";
import PolyPulse from "@/components/tools/polypulse/PolyPulse";
import { getTool } from "@/lib/tools/registry";

const tool = getTool("polypulse")!;

export const metadata: Metadata = {
  title: `${tool.name} | MИШKiN LAБS`,
  description: tool.description,
};

export default function PolyPulsePage() {
  return (
    <main
      className="max-w-7xl px-4 py-4"
      style={{ margin: "0px auto" }}
    >
      <div className="pt-8">
        <Link href="/tools" className="myshkin-labs-tools__back text-sm hover:underline">
          ← Back to tools
        </Link>
      </div>
      <div className="pt-8">
        <PolyPulse />
      </div>
    </main>
  );
}
