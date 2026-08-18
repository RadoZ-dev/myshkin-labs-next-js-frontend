// -----------------------------------------------------------------------------
// Tool registry — metadata for the /tools section.
//
// Tools are hardcoded local React apps, NOT WordPress content. Each tool has a
// static route folder under src/app/tools/<slug>/ that supplies the code; this
// file supplies the metadata shared by the index page and each route's
// `metadata` export, so titles and descriptions never drift apart.
//
// To add a tool: create src/app/tools/<slug>/page.tsx plus its component, then
// add one entry here.
// -----------------------------------------------------------------------------

export type ToolAccent = "neon-blue" | "purple" | "green";

export interface ToolMeta {
  /** URL segment: /tools/<slug> */
  slug: string;
  /** Display name, used as the page <h1> and card title */
  name: string;
  /** Short line shown under the title on the card and the tool page */
  tagline: string;
  /** 1-2 sentences; used for the card body and <meta name="description"> */
  description: string;
  /** Drives the per-tool accent colour class on the index card */
  accent: ToolAccent;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: "polypulse",
    name: "PolyPulse",
    tagline: "Synchronized Polyrhythm Engine",
    description:
      "A polyrhythm metronome. Set two conflicting pulses against each other, accent individual steps, and hear how the phases drift apart and realign.",
    accent: "neon-blue",
  },
  {
    slug: "melodic-shapes",
    name: "Melodic Shapes",
    tagline: "Build Your Own Musical Language",
    description:
      "Generates melodic contours and rhythms as raw material for improvisation. Renders them in standard notation and plays them back over a click.",
    accent: "neon-blue",
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
