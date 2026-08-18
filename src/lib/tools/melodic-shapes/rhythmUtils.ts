// Rhythm generator utilities

interface RhythmItem {
  duration: string;
  beats: number;
  isRest: boolean;
  noteIndex: number | null;
  tiedToNext?: boolean;
  tiedFromPrev?: boolean;
  staccato?: boolean;
}

interface Pitch {
  note: string;
  octave: number;
}

/**
 * Generate a rhythm at eighth-note granularity.
 * Notes can span beat boundaries and will be split into tied pairs.
 * Within a beat, consecutive rests are merged.
 */
export function generateRhythm(numNotes: number, bars = 1): RhythmItem[] {
  const totalEighths = bars * 8; // 8 eighth notes per bar in 4/4

  // Each slot is one eighth note
  interface Slot {
    type: "note" | "rest";
    noteIndex: number | null;
  }

  const slots: Slot[] = Array.from({ length: totalEighths }, () => ({
    type: "rest",
    noteIndex: null,
  }));

  // Place notes: each note starts at a random slot and can be 1 or 2 eighths long
  // First, collect available starting positions
  const availableStarts = Array.from({ length: totalEighths }, (_, i) => i);
  // Shuffle
  for (let i = availableStarts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableStarts[i], availableStarts[j]] = [
      availableStarts[j],
      availableStarts[i],
    ];
  }

  // Track which slots are claimed by notes
  const claimed = new Set<number>();
  const notePlacements: { start: number; length: number }[] = [];

  for (const startPos of availableStarts) {
    if (notePlacements.length >= numNotes) break;
    if (claimed.has(startPos)) continue;

    // Decide if this note is 1 or 2 eighths
    let noteLength = 1;
    if (
      startPos + 1 < totalEighths &&
      !claimed.has(startPos + 1) &&
      Math.random() < 0.35
    ) {
      noteLength = 2;
    }

    claimed.add(startPos);
    if (noteLength === 2) claimed.add(startPos + 1);
    notePlacements.push({ start: startPos, length: noteLength });
  }

  // Sort by start position and assign noteIndex in temporal order
  notePlacements.sort((a, b) => a.start - b.start);

  for (let i = 0; i < notePlacements.length; i++) {
    const { start, length } = notePlacements[i];
    for (let s = 0; s < length; s++) {
      slots[start + s].type = "note";
      slots[start + s].noteIndex = i;
    }
  }

  // Now process beat by beat (each beat = 2 eighth slots)
  const rhythm: RhythmItem[] = [];
  const totalBeats = bars * 4;

  for (let beat = 0; beat < totalBeats; beat++) {
    const slotStart = beat * 2;
    const beatSlots = [slots[slotStart], slots[slotStart + 1]];

    // Process each slot, then merge within beat
    interface BeatItem {
      eighths: number;
      isRest: boolean;
      noteIndex: number | null;
      tiedToNext: boolean;
      tiedFromPrev: boolean;
      staccato?: boolean;
    }

    const items: BeatItem[] = [];

    for (let i = 0; i < 2; i++) {
      const slot = beatSlots[i];
      const globalIdx = slotStart + i;
      const isRest = slot.type === "rest";
      let tiedFromPrev = false;
      let tiedToNext = false;

      if (!isRest) {
        // Check if this slot continues a note from the previous slot (cross-beat tie)
        if (
          globalIdx > 0 &&
          slots[globalIdx - 1].noteIndex === slot.noteIndex &&
          slots[globalIdx - 1].type === "note"
        ) {
          // This is a continuation — only mark as tied if it crosses a beat boundary
          if (i === 0) {
            // First slot of this beat, continuing from previous beat
            tiedFromPrev = true;
          }
        }
        // Check if this note continues into the next slot
        if (
          globalIdx + 1 < totalEighths &&
          slots[globalIdx + 1].noteIndex === slot.noteIndex &&
          slots[globalIdx + 1].type === "note"
        ) {
          if (i === 1) {
            // Last slot of this beat, note continues to next beat
            tiedToNext = true;
          }
          // If i === 0 and continues to i === 1, they're in the same beat — will be merged
        }
      }

      items.push({
        eighths: 1,
        isRest,
        noteIndex: isRest ? null : slot.noteIndex,
        tiedToNext,
        tiedFromPrev,
      });
    }

    // Merge within beat: two same-type items with same noteIndex
    const merged: BeatItem[] = [];
    for (const item of items) {
      const last = merged[merged.length - 1];
      if (
        last &&
        last.isRest === item.isRest &&
        (item.isRest || last.noteIndex === item.noteIndex) &&
        !last.tiedToNext &&
        !item.tiedFromPrev // don't merge across tie boundaries
      ) {
        last.eighths += item.eighths;
        last.tiedToNext = item.tiedToNext;
      } else {
        merged.push({ ...item });
      }
    }

    // Convert eighth note + eighth rest on same beat into staccato quarter
    if (
      merged.length === 2 &&
      !merged[0].isRest &&
      merged[0].eighths === 1 &&
      merged[1].isRest &&
      merged[1].eighths === 1 &&
      !merged[0].tiedFromPrev &&
      !merged[0].tiedToNext
    ) {
      merged.splice(0, 2, {
        eighths: 2,
        isRest: false,
        noteIndex: merged[0].noteIndex,
        tiedToNext: false,
        tiedFromPrev: false,
        staccato: true,
      });
    }

    for (const item of merged) {
      let duration: string;
      if (item.eighths >= 2) {
        duration = item.isRest ? "quarter-rest" : "quarter";
      } else {
        duration = item.isRest ? "eighth-rest" : "eighth";
      }
      rhythm.push({
        duration,
        beats: item.eighths * 0.5,
        isRest: item.isRest,
        noteIndex: item.isRest ? null : item.noteIndex,
        tiedToNext: item.tiedToNext,
        tiedFromPrev: item.tiedFromPrev,
        staccato: item.staccato,
      });
    }
  }

  return rhythm;
}

export function mapToPitch(rowOffset: number): Pitch {
  const cMajorScale = [
    { note: "C", octave: 3, offset: -7 },
    { note: "D", octave: 3, offset: -6 },
    { note: "E", octave: 3, offset: -5 },
    { note: "F", octave: 3, offset: -4 },
    { note: "G", octave: 3, offset: -3 },
    { note: "A", octave: 3, offset: -2 },
    { note: "B", octave: 3, offset: -1 },
    { note: "C", octave: 4, offset: 0 },
    { note: "D", octave: 4, offset: 1 },
    { note: "E", octave: 4, offset: 2 },
    { note: "F", octave: 4, offset: 3 },
    { note: "G", octave: 4, offset: 4 },
    { note: "A", octave: 4, offset: 5 },
    { note: "B", octave: 4, offset: 6 },
    { note: "C", octave: 5, offset: 7 },
  ];

  const pitch = cMajorScale.find((p) => p.offset === rowOffset);
  return pitch
    ? { note: pitch.note, octave: pitch.octave }
    : { note: "C", octave: 4 };
}

export type { RhythmItem, Pitch };
