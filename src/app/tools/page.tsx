import Link from "next/link";
import type { Metadata } from "next";
import { TOOLS } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Tools | MИШKiN LAБS",
  description:
    "Small interactive instruments for practising rhythm, melody and time.",
};

export default function ToolsPage() {
  return (
    <main
      className="max-w-7xl px-4 py-4"
      style={{ margin: "0px auto" }}
    >
      <div className="pt-8">
        <Link href="/" className="myshkin-labs-tools__back text-sm hover:underline">
          ← Back to home
        </Link>
      </div>

      <div className="myshkin-labs-tools pt-8">
        <h1 className="myshkin-labs-tools__title">Tools</h1>
        <p className="myshkin-labs-tools__intro">
          Small interactive instruments for practising rhythm, melody and time.
          Everything runs in the browser — nothing is recorded or sent anywhere.
        </p>

        <div className="myshkin-labs-tools__grid">
          {TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className={`myshkin-labs-tools__card myshkin-labs-tools__card--${tool.accent}`}
            >
              <h2 className="myshkin-labs-tools__card-title">{tool.name}</h2>
              <p className="myshkin-labs-tools__card-tagline">{tool.tagline}</p>
              <p className="myshkin-labs-tools__card-description">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
