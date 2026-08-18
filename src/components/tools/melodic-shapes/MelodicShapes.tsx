"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Play, Square } from "lucide-react";
import DotGrid from "./DotGrid";
import MusicNotation from "./MusicNotation";
import {
  generateRhythm,
  mapToPitch,
  type RhythmItem,
  type Pitch,
} from "@/lib/tools/melodic-shapes/rhythmUtils";
import {
  startPlayback,
  updatePlayback,
  startDrone,
  stopDrone,
  stopAll,
} from "@/lib/tools/melodic-shapes/audioPlayer";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Dot {
  x: number;
  y: number;
}

function generateDots(width: number, height: number): Dot[] {
  const centerY = Math.floor(height / 2);
  const dots: Dot[] = [];

  for (let x = 0; x < width; x++) {
    if (x === 0) {
      dots.push({ x, y: centerY });
    } else {
      dots.push({ x, y: getRandomInt(0, height - 1) });
    }
  }

  return dots;
}

/** Deterministic placeholder contour: every dot on the centre line. */
function flatDots(width: number, height: number): Dot[] {
  const centerY = Math.floor(height / 2);
  return Array.from({ length: width }, (_, x) => ({ x, y: centerY }));
}

const CHROMATIC_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const GRID_SIZES = [2, 3, 4, 5];

export default function MelodicShapes() {
  const [gridSize, setGridSize] = useState(4);
  const [animationKey, setAnimationKey] = useState(0);
  const [tempo, setTempo] = useState(80);
  const [timeFeel] = useState<"half" | "regular" | "double">("regular");
  const [isPlaying, setIsPlaying] = useState(false);
  const [rhythmOnly, setRhythmOnly] = useState(false);
  const [droneEnabled, setDroneEnabled] = useState(false);
  const [droneNote, setDroneNote] = useState("C");
  const stopRef = useRef<(() => void) | null>(null);
  const countingInRef = useRef(false);
  const width = gridSize;
  const height = gridSize * 2 - 1;
  const timeFeelMultiplier =
    timeFeel === "half" ? 2 : timeFeel === "double" ? 0.5 : 1;
  const centerY = Math.floor(height / 2);

  // Must be deterministic: this renders on the server too, and Math.random()
  // here would produce a hydration mismatch. The real shape is generated in the
  // mount effect below.
  const [dots, setDots] = useState<Dot[]>(() => flatDots(4, 7));
  const [rhythm, setRhythm] = useState<RhythmItem[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  const [activeRhythmIndex, setActiveRhythmIndex] = useState<number | null>(
    null,
  );

  // Second phrase
  const [extraShapeEnabled, setExtraShapeEnabled] = useState(false);
  const [extraGridSize, setExtraGridSize] = useState(4);
  const [dots2, setDots2] = useState<Dot[]>([]);
  const [rhythm2, setRhythm2] = useState<RhythmItem[]>([]);
  const [pitches2, setPitches2] = useState<Pitch[]>([]);

  // Combined phrase for playback/notation (phrase 2 noteIndexes offset by phrase 1 length)
  const combinedPitches =
    extraShapeEnabled && pitches2.length > 0
      ? [...pitches, ...pitches2]
      : pitches;
  const combinedRhythm =
    extraShapeEnabled && rhythm2.length > 0
      ? [
          ...rhythm,
          ...rhythm2.map((item) => ({
            ...item,
            noteIndex:
              item.noteIndex != null ? item.noteIndex + pitches.length : null,
          })),
        ]
      : rhythm;

  const computeRhythmAndPitches = useCallback(
    (currentDots: Dot[], size: number) => {
      const newRhythm = generateRhythm(currentDots.length, 1);
      const cY = Math.floor((size * 2 - 2) / 2);
      const newPitches = currentDots.map((dot) => mapToPitch(cY - dot.y));
      return { newRhythm, newPitches };
    },
    [],
  );

  const generateRhythmAndPitches = useCallback(
    (currentDots: Dot[]) => {
      const { newRhythm, newPitches } = computeRhythmAndPitches(
        currentDots,
        gridSize,
      );
      setRhythm(newRhythm);
      setPitches(newPitches);
      return { newRhythm, newPitches };
    },
    [gridSize, computeRhythmAndPitches],
  );

  const handleRegenerate = () => {
    const newDots = generateDots(width, height);
    setDots(newDots);
    setAnimationKey((k) => k + 1);
    setActiveNoteIndex(null);
    setActiveRhythmIndex(null);
    const { newRhythm, newPitches } = generateRhythmAndPitches(newDots);

    let newCombinedRhythm = newRhythm;
    let newCombinedPitches = newPitches;

    if (extraShapeEnabled) {
      const extraH = extraGridSize * 2 - 1;
      const newDots2 = generateDots(extraGridSize, extraH);
      setDots2(newDots2);
      const { newRhythm: r2, newPitches: p2 } = computeRhythmAndPitches(
        newDots2,
        extraGridSize,
      );
      setRhythm2(r2);
      setPitches2(p2);
      newCombinedPitches = [...newPitches, ...p2];
      newCombinedRhythm = [
        ...newRhythm,
        ...r2.map((item) => ({
          ...item,
          noteIndex:
            item.noteIndex != null ? item.noteIndex + newPitches.length : null,
        })),
      ];
    }

    if (isPlaying) {
      updatePlayback(
        newCombinedRhythm,
        newCombinedPitches,
        tempo,
        timeFeelMultiplier,
        rhythmOnly,
      );
    }
  };

  const handlePlay = () => {
    if (isPlaying) {
      if (stopRef.current) {
        stopRef.current();
        stopRef.current = null;
      }
      setIsPlaying(false);
      setActiveNoteIndex(null);
      setActiveRhythmIndex(null);
      return;
    }
    setIsPlaying(true);
    // Block note highlights during the count-in (1 bar, minus 100ms so the flag clears before the first note)
    const countInDurationMs = (4 * 60 * 1000) / tempo;
    countingInRef.current = true;
    setTimeout(() => {
      countingInRef.current = false;
    }, countInDurationMs);
    const cancel = startPlayback(
      combinedRhythm,
      combinedPitches,
      tempo,
      timeFeelMultiplier,
      rhythmOnly,
      (index) => {
        if (!countingInRef.current) setActiveNoteIndex(index);
      },
      (index) => {
        if (!countingInRef.current) setActiveRhythmIndex(index);
      },
    );
    stopRef.current = cancel;
  };

  const handleSizeChange = (value: string) => {
    const next = Number(value);
    setGridSize(next);
    const newH = next * 2 - 1;
    const newDots = generateDots(next, newH);
    setDots(newDots);
    setAnimationKey((k) => k + 1);

    const { newRhythm, newPitches } = computeRhythmAndPitches(newDots, next);
    setRhythm(newRhythm);
    setPitches(newPitches);

    if (isPlaying) {
      setActiveNoteIndex(null);
      setActiveRhythmIndex(null);
      const newCombinedPitches =
        extraShapeEnabled && pitches2.length > 0
          ? [...newPitches, ...pitches2]
          : newPitches;
      const newCombinedRhythm =
        extraShapeEnabled && rhythm2.length > 0
          ? [
              ...newRhythm,
              ...rhythm2.map((item) => ({
                ...item,
                noteIndex:
                  item.noteIndex != null
                    ? item.noteIndex + newPitches.length
                    : null,
              })),
            ]
          : newRhythm;
      updatePlayback(
        newCombinedRhythm,
        newCombinedPitches,
        tempo,
        timeFeelMultiplier,
        rhythmOnly,
      );
    }
  };

  const handleTempoChange = (v: number) => {
    setTempo(v);
    if (isPlaying) {
      setActiveNoteIndex(null);
      setActiveRhythmIndex(null);
      updatePlayback(
        combinedRhythm,
        combinedPitches,
        v,
        timeFeelMultiplier,
        rhythmOnly,
      );
    }
  };

  const handleRhythmOnlyChange = (checked: boolean) => {
    setRhythmOnly(checked);
    if (isPlaying) {
      setActiveNoteIndex(null);
      setActiveRhythmIndex(null);
      updatePlayback(
        combinedRhythm,
        combinedPitches,
        tempo,
        timeFeelMultiplier,
        checked,
      );
    }
  };

  const handleExtraShapeToggle = (checked: boolean) => {
    setExtraShapeEnabled(checked);
    setActiveNoteIndex(null);
    setActiveRhythmIndex(null);
    if (checked) {
      const extraH = extraGridSize * 2 - 1;
      const newDots2 = generateDots(extraGridSize, extraH);
      setDots2(newDots2);
      const { newRhythm: r2, newPitches: p2 } = computeRhythmAndPitches(
        newDots2,
        extraGridSize,
      );
      setRhythm2(r2);
      setPitches2(p2);
      if (isPlaying) {
        const r2Offset = r2.map((item) => ({
          ...item,
          noteIndex:
            item.noteIndex != null ? item.noteIndex + pitches.length : null,
        }));
        updatePlayback(
          [...rhythm, ...r2Offset],
          [...pitches, ...p2],
          tempo,
          timeFeelMultiplier,
          rhythmOnly,
        );
      }
    } else {
      setDots2([]);
      setRhythm2([]);
      setPitches2([]);
      if (isPlaying) {
        updatePlayback(rhythm, pitches, tempo, timeFeelMultiplier, rhythmOnly);
      }
    }
  };

  const handleExtraGridSizeChange = (value: string) => {
    const next = Number(value);
    setExtraGridSize(next);
    const extraH = next * 2 - 1;
    const newDots2 = generateDots(next, extraH);
    setDots2(newDots2);
    const { newRhythm: r2, newPitches: p2 } = computeRhythmAndPitches(
      newDots2,
      next,
    );
    setRhythm2(r2);
    setPitches2(p2);
    if (isPlaying) {
      setActiveNoteIndex(null);
      setActiveRhythmIndex(null);
      const r2Offset = r2.map((item) => ({
        ...item,
        noteIndex:
          item.noteIndex != null ? item.noteIndex + pitches.length : null,
      }));
      updatePlayback(
        [...rhythm, ...r2Offset],
        [...pitches, ...p2],
        tempo,
        timeFeelMultiplier,
        rhythmOnly,
      );
    }
  };

  const handleDroneToggle = (checked: boolean) => {
    setDroneEnabled(checked);
    if (checked) {
      startDrone(droneNote);
    } else {
      stopDrone();
    }
  };

  const handleDroneNoteChange = (value: string) => {
    setDroneNote(value);
    if (droneEnabled) {
      startDrone(value);
    }
  };

  // Generate the first real shape after mount. Doing this on the client only
  // keeps the server-rendered HTML deterministic.
  useEffect(() => {
    const initialDots = generateDots(4, 7);
    setDots(initialDots);
    generateRhythmAndPitches(initialDots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop playback and drone on unmount. Next.js navigates client-side, so this
  // is the only cleanup signal — stopAll() also covers the case where stopRef
  // was cleared by a param change.
  useEffect(() => {
    return () => {
      if (stopRef.current) {
        stopRef.current();
        stopRef.current = null;
      }
      stopAll();
    };
  }, []);

  return (
    <div className="myshkin-labs-tool myshkin-labs-melodic-shapes">
      <header className="myshkin-labs-tool__header">
        <h1 className="myshkin-labs-tool__title">Melodic Shapes</h1>
        <p className="myshkin-labs-tool__tagline">
          Build Your Own Musical Language
        </p>
      </header>

      <p className="myshkin-labs-tool__intro">
        Instead of giving you ready-made phrases, Melodic Shapes provides unique
        melodic shapes and rhythmic ideas designed to spark creativity. Use them
        as building blocks to create, vary, and develop your own musical
        thoughts.
      </p>

      {/* Controls */}
      <div className="myshkin-labs-melodic-shapes__controls flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              className="myshkin-labs-tool__label"
              htmlFor="melodic-shapes-tones"
            >
              Tones
            </label>
            <select
              id="melodic-shapes-tones"
              className="myshkin-labs-tool__select"
              value={String(gridSize)}
              onChange={(e) => handleSizeChange(e.target.value)}
            >
              {GRID_SIZES.map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            className="myshkin-labs-tool__button myshkin-labs-tool__button--primary"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>

          <button
            type="button"
            onClick={handlePlay}
            className={`myshkin-labs-tool__button ${
              isPlaying
                ? "myshkin-labs-tool__button--danger"
                : "myshkin-labs-tool__button--go"
            }`}
          >
            {isPlaying ? (
              <Square className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label
            className="myshkin-labs-tool__label"
            htmlFor="melodic-shapes-tempo"
          >
            Tempo
          </label>
          <input
            id="melodic-shapes-tempo"
            type="range"
            min={60}
            max={270}
            step={5}
            value={tempo}
            onChange={(e) => handleTempoChange(Number(e.target.value))}
            className="myshkin-labs-tool__slider myshkin-labs-tool__slider--blue w-32"
          />
          <span className="myshkin-labs-tool__value w-12 text-right text-xs">
            {tempo}
          </span>
        </div>
      </div>

      {/* Audio options */}
      <div className="myshkin-labs-melodic-shapes__options flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rhythm-only"
            className="myshkin-labs-tool__checkbox"
            checked={rhythmOnly}
            onChange={(e) => handleRhythmOnlyChange(e.target.checked)}
          />
          <label
            htmlFor="rhythm-only"
            className="myshkin-labs-tool__checkbox-label"
          >
            Rhythm only
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="drone"
            className="myshkin-labs-tool__checkbox"
            checked={droneEnabled}
            onChange={(e) => handleDroneToggle(e.target.checked)}
          />
          <label htmlFor="drone" className="myshkin-labs-tool__checkbox-label">
            Drone
          </label>
          <select
            className="myshkin-labs-tool__select"
            value={droneNote}
            onChange={(e) => handleDroneNoteChange(e.target.value)}
            disabled={!droneEnabled}
            aria-label="Drone note"
          >
            {CHROMATIC_NOTES.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="extra-shape"
            className="myshkin-labs-tool__checkbox"
            checked={extraShapeEnabled}
            onChange={(e) => handleExtraShapeToggle(e.target.checked)}
          />
          <label
            htmlFor="extra-shape"
            className="myshkin-labs-tool__checkbox-label"
          >
            Extra shape
          </label>
          <select
            className="myshkin-labs-tool__select"
            value={String(extraGridSize)}
            onChange={(e) => handleExtraGridSizeChange(e.target.value)}
            disabled={!extraShapeEnabled}
            aria-label="Extra shape tones"
          >
            {GRID_SIZES.map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Melodic shape */}
      <section className="myshkin-labs-tool__panel myshkin-labs-melodic-shapes__shape">
        <h2 className="myshkin-labs-tool__panel-title">Melodic Shape</h2>
        <div className="flex justify-center overflow-x-auto">
          <DotGrid
            dots={dots}
            dots2={extraShapeEnabled ? dots2 : undefined}
            width={width}
            height={height}
            centerY={centerY}
            animationKey={animationKey}
            activeIndex={activeNoteIndex ?? undefined}
          />
        </div>
      </section>

      {/* Notation */}
      <section className="myshkin-labs-tool__panel">
        <MusicNotation
          rhythm={rhythm}
          pitches={pitches}
          rhythm2={extraShapeEnabled ? rhythm2 : undefined}
          pitches2={extraShapeEnabled ? pitches2 : undefined}
          activeIndex={activeRhythmIndex ?? undefined}
        />
      </section>
    </div>
  );
}
