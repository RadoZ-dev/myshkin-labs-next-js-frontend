"use client";

import { useEffect, useRef } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
  StaveTie,
  Articulation,
} from "vexflow";
import type { RhythmItem, Pitch } from "@/lib/tools/melodic-shapes/rhythmUtils";

function buildNotes(rhythm: RhythmItem[], pitches: Pitch[]): StaveNote[] {
  const notes: StaveNote[] = [];
  rhythm.forEach((item) => {
    if (item.isRest) {
      const duration = item.duration === "quarter-rest" ? "qr" : "8r";
      notes.push(new StaveNote({ keys: ["b/4"], duration }));
    } else {
      const pitch = pitches[item.noteIndex!];
      if (!pitch) return;
      const key = `${pitch.note.toLowerCase()}/${pitch.octave}`;
      const duration = item.duration === "quarter" ? "q" : "8";
      const note = new StaveNote({ keys: [key], duration });
      if (item.staccato) note.addModifier(new Articulation("a."));
      notes.push(note);
    }
  });
  return notes;
}

function drawTies(
  context: ReturnType<Renderer["getContext"]>,
  rhythm: RhythmItem[],
  notes: StaveNote[],
) {
  let noteIdx = 0;
  for (let i = 0; i < rhythm.length; i++) {
    if (rhythm[i].tiedToNext && noteIdx < notes.length) {
      const nextNoteIdx = noteIdx + 1;
      if (nextNoteIdx < notes.length) {
        new StaveTie({
          firstNote: notes[noteIdx],
          lastNote: notes[nextNoteIdx],
          firstIndexes: [0],
          lastIndexes: [0],
        })
          .setContext(context)
          .draw();
      }
    }
    noteIdx++;
  }
}

interface MusicNotationProps {
  rhythm: RhythmItem[];
  pitches: Pitch[];
  rhythm2?: RhythmItem[];
  pitches2?: Pitch[];
  activeIndex?: number;
}

export default function MusicNotation({
  rhythm,
  pitches,
  rhythm2,
  pitches2,
  activeIndex,
}: MusicNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rhythm || rhythm.length === 0 || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const internalWidth = 800;
    const internalHeight = 150;
    const staveWidth = internalWidth - 20;

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(internalWidth, internalHeight);
    const context = renderer.getContext();

    const notes1 = buildNotes(rhythm, pitches);
    const beams1 = Beam.generateBeams(notes1).filter(
      (b) => b.getNotes().length > 1,
    );
    const voice1 = new Voice({ numBeats: 4, beatValue: 4 });
    voice1.addTickables(notes1);

    const hasTwoBars = rhythm2 && pitches2 && rhythm2.length > 0;

    if (hasTwoBars) {
      const bar1Width = Math.floor(staveWidth / 2) + 30;
      const bar2Width = staveWidth - bar1Width;

      const stave1 = new Stave(10, 20, bar1Width);
      stave1.addClef("treble").addTimeSignature("4/4");
      stave1.setContext(context).draw();

      const stave2 = new Stave(10 + bar1Width, 20, bar2Width);
      stave2.setContext(context).draw();

      new Formatter().joinVoices([voice1]).format([voice1], bar1Width - 80);
      voice1.draw(context, stave1);
      beams1.forEach((b) => b.setContext(context).draw());
      drawTies(context, rhythm, notes1);

      const notes2 = buildNotes(rhythm2, pitches2);
      const beams2 = Beam.generateBeams(notes2).filter(
        (b) => b.getNotes().length > 1,
      );
      const voice2 = new Voice({ numBeats: 4, beatValue: 4 });
      voice2.addTickables(notes2);
      new Formatter().joinVoices([voice2]).format([voice2], bar2Width - 20);
      voice2.draw(context, stave2);
      beams2.forEach((b) => b.setContext(context).draw());
      drawTies(context, rhythm2, notes2);
    } else {
      const stave = new Stave(10, 20, staveWidth);
      stave.addClef("treble").addTimeSignature("4/4");
      stave.setContext(context).draw();

      new Formatter().joinVoices([voice1]).format([voice1], staveWidth - 100);
      voice1.draw(context, stave);
      beams1.forEach((b) => b.setContext(context).draw());
      drawTies(context, rhythm, notes1);
    }

    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";
    }
  }, [rhythm, pitches, rhythm2, pitches2]);

  // Highlight the active note without re-rendering the whole notation
  useEffect(() => {
    if (!containerRef.current) return;
    const noteEls =
      containerRef.current.querySelectorAll<SVGGElement>(".vf-stavenote");
    noteEls.forEach((el, i) => {
      const isActive = activeIndex != null && i === activeIndex;
      // $color-purple — legible as ink on the white notation panel
      const color = isActive ? "#961ee1" : "";
      // Color all SVG children of the note (notehead, stem, flag, etc.)
      el.querySelectorAll<SVGElement>("*").forEach((child) => {
        child.style.fill = color;
        child.style.stroke = color;
        if (color) {
          child.setAttribute("fill", color);
          child.setAttribute("stroke", color);
        } else {
          child.removeAttribute("fill");
          child.removeAttribute("stroke");
        }
      });
    });
    const beamEls =
      containerRef.current.querySelectorAll<SVGPathElement>(".vf-beam path");
    beamEls.forEach((el) => {
      el.style.opacity = "1";
    });
  }, [activeIndex, rhythm, rhythm2]);

  if (!rhythm || rhythm.length === 0) {
    return (
      <div className="myshkin-labs-tool__hint">No rhythm generated</div>
    );
  }

  return (
    <div className="myshkin-labs-melodic-shapes__notation">
      <h3 className="myshkin-labs-tool__panel-title">
        Rhythm Notation
      </h3>
      <div className="myshkin-labs-melodic-shapes__notation-paper overflow-x-auto">
        <div ref={containerRef} className="min-w-[500px] vexflow-container" />
      </div>
    </div>
  );
}
