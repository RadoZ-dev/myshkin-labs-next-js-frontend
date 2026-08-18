"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Square, Sliders, Drum, Music } from "lucide-react";
import { PolyrhythmAudioEngine } from "@/lib/tools/polypulse/audioEngine";

/** Step cell state, consumed by CSS via the data-state attribute. */
type StepState = "active" | "accent" | "idle";

function stepState(isActive: boolean, isAccented: boolean): StepState {
  if (isActive) return "active";
  if (isAccented) return "accent";
  return "idle";
}

export default function PolyPulse() {
  const [bpm, setBpm] = useState(120);
  const [beatsMain, setBeatsMain] = useState(4);
  const [beatsSecondary, setBeatsSecondary] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);

  const [mainVolume, setMainVolume] = useState(0.6);
  const [secondaryVolume, setSecondaryVolume] = useState(0.3);

  const [activeMainStep, setActiveMainStep] = useState<number | null>(null);
  const [activeSecondaryStep, setActiveSecondaryStep] = useState<number | null>(
    null,
  );

  const [mainAccents, setMainAccents] = useState<boolean[]>(
    new Array(16).fill(false),
  );
  const [secondaryAccents, setSecondaryAccents] = useState<boolean[]>(
    new Array(36).fill(false),
  );

  const engineRef = useRef<PolyrhythmAudioEngine | null>(null);

  const handleBeat = useCallback(
    (type: "main" | "secondary", step: number, time: number) => {
      // Schedule UI update to sync with sound. A small timeout accounts for the
      // scheduler's lookahead.
      const delay = (time - (engineRef.current?.currentTime || 0)) * 1000;

      setTimeout(
        () => {
          if (type === "main") {
            setActiveMainStep(step);
          } else {
            setActiveSecondaryStep(step);
          }
        },
        Math.max(0, delay),
      );
    },
    [],
  );

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new PolyrhythmAudioEngine(handleBeat);
    }
  }, [handleBeat]);

  // Release the audio context on unmount. Next.js navigates client-side, so
  // unmount is the only cleanup signal — without this the scheduler keeps
  // re-arming and audio plays over the rest of the site.
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolumes(mainVolume, secondaryVolume);
    }
  }, [mainVolume, secondaryVolume]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setParams(
        bpm,
        beatsMain,
        beatsSecondary,
        mainAccents,
        secondaryAccents,
      );

      if (isPlaying) {
        engineRef.current.start();
      } else {
        engineRef.current.stop();
      }
    }
  }, [
    bpm,
    beatsMain,
    beatsSecondary,
    mainAccents,
    secondaryAccents,
    isPlaying,
  ]);

  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    // Step highlights are driven from the click rather than the effect, so the
    // effect stays a pure sync-to-external-system (the audio engine).
    setActiveMainStep(next ? 0 : null);
    setActiveSecondaryStep(next ? 0 : null);
  };

  const toggleAccent = (type: "main" | "secondary", index: number) => {
    if (type === "main") {
      const newAccents = [...mainAccents];
      newAccents[index] = !newAccents[index];
      setMainAccents(newAccents);
    } else {
      const newAccents = [...secondaryAccents];
      newAccents[index] = !newAccents[index];
      setSecondaryAccents(newAccents);
    }
  };

  return (
    <div className="myshkin-labs-tool myshkin-labs-polypulse flex flex-col items-center">
      {/* Header */}
      <header className="myshkin-labs-tool__header myshkin-labs-polypulse__header">
        <h1 className="myshkin-labs-tool__title">PolyPulse</h1>
        <p className="myshkin-labs-tool__tagline">
          Synchronized Polyrhythm Engine
        </p>
      </header>

      <p className="myshkin-labs-tool__intro myshkin-labs-polypulse__intro">
        Polyrhythm is the simultaneous use of two or more conflicting rhythms.
        In this engine, the{" "}
        <span className="myshkin-labs-polypulse__spec-main">Main</span>{" "}
        metronome defines the global time boundary, while the{" "}
        <span className="myshkin-labs-polypulse__spec-secondary">
          Secondary
        </span>{" "}
        engine subdivides that boundary equally across its set beats.
      </p>

      {/* Main control panel */}
      <section className="myshkin-labs-tool__panel myshkin-labs-polypulse__console w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Transport */}
        <div className="myshkin-labs-polypulse__transport md:col-span-1 flex flex-col items-center justify-center p-4 gap-6">
          <button
            type="button"
            onClick={togglePlay}
            className="myshkin-labs-polypulse__play"
            data-playing={isPlaying}
            aria-label={isPlaying ? "Stop" : "Start"}
            id="play-button"
          >
            {isPlaying ? (
              <Square className="w-12 h-12 fill-current" />
            ) : (
              <Play className="w-12 h-12 fill-current translate-x-1" />
            )}
          </button>
          <div className="myshkin-labs-polypulse__bpm text-center">
            <span className="myshkin-labs-polypulse__bpm-value">{bpm}</span>
            <span className="myshkin-labs-polypulse__bpm-label">BPM</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="myshkin-labs-polypulse__controls md:col-span-2 p-4">
          <div className="myshkin-labs-polypulse__tempo">
            <label
              className="myshkin-labs-tool__label"
              htmlFor="polypulse-bpm-slider"
            >
              <Sliders className="w-3 h-3" />
              <span>Tempo Control</span>
            </label>
            <input
              id="polypulse-bpm-slider"
              type="range"
              min="40"
              max="240"
              step="1"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="myshkin-labs-tool__slider myshkin-labs-tool__slider--green w-full"
            />
          </div>

          <div className="myshkin-labs-polypulse__beats grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
            {/* Main beats */}
            <div className="space-y-4">
              <span className="myshkin-labs-tool__label justify-center">
                <Drum className="w-3 h-3" />
                <span>Main Beats (Kick)</span>
              </span>
              <div className="myshkin-labs-tool__stepper">
                <button
                  type="button"
                  onClick={() => setBeatsMain(Math.max(1, beatsMain - 1))}
                  className="myshkin-labs-tool__stepper-button"
                  aria-label="Fewer main beats"
                >
                  -
                </button>
                <span className="myshkin-labs-polypulse__beat-count">
                  {beatsMain}
                </span>
                <button
                  type="button"
                  onClick={() => setBeatsMain(Math.min(16, beatsMain + 1))}
                  className="myshkin-labs-tool__stepper-button"
                  aria-label="More main beats"
                >
                  +
                </button>
              </div>
              <div className="pt-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mainVolume}
                  onChange={(e) => setMainVolume(parseFloat(e.target.value))}
                  className="myshkin-labs-tool__slider myshkin-labs-tool__slider--green w-24"
                  aria-label="Main volume"
                />
              </div>
            </div>

            {/* Secondary beats */}
            <div className="space-y-4">
              <span className="myshkin-labs-tool__label justify-center">
                <Music className="w-3 h-3" />
                <span>Secondary (Hat)</span>
              </span>
              <div className="myshkin-labs-tool__stepper">
                <button
                  type="button"
                  onClick={() =>
                    setBeatsSecondary(Math.max(1, beatsSecondary - 1))
                  }
                  className="myshkin-labs-tool__stepper-button"
                  aria-label="Fewer secondary beats"
                >
                  -
                </button>
                <span className="myshkin-labs-polypulse__beat-count">
                  {beatsSecondary}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setBeatsSecondary(Math.min(36, beatsSecondary + 1))
                  }
                  className="myshkin-labs-tool__stepper-button"
                  aria-label="More secondary beats"
                >
                  +
                </button>
              </div>
              <div className="pt-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={secondaryVolume}
                  onChange={(e) =>
                    setSecondaryVolume(parseFloat(e.target.value))
                  }
                  className="myshkin-labs-tool__slider myshkin-labs-tool__slider--blue w-24"
                  aria-label="Secondary volume"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visualizer */}
      <div className="myshkin-labs-polypulse__tracks w-full flex flex-col">
        {/* Main track */}
        <div className="myshkin-labs-polypulse__track-group">
          <div className="myshkin-labs-polypulse__track-header">
            <h2 className="myshkin-labs-polypulse__track-title">
              <span className="myshkin-labs-polypulse__pulse myshkin-labs-polypulse__pulse--main" />
              Main Rhythm ({beatsMain} Beats / Bar)
            </h2>
            <span className="myshkin-labs-polypulse__track-hint">
              Kick / Snare
            </span>
          </div>
          <div className="myshkin-labs-polypulse__track">
            {Array.from({ length: beatsMain }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleAccent("main", i)}
                className="myshkin-labs-polypulse__step myshkin-labs-polypulse__step--main"
                data-state={stepState(activeMainStep === i, mainAccents[i])}
                aria-label={`Main step ${i + 1}${mainAccents[i] ? ", accented" : ""}`}
                aria-pressed={mainAccents[i]}
              >
                <span className="myshkin-labs-polypulse__step-number">
                  {i + 1}
                </span>
                {i === 0 && (
                  <span className="myshkin-labs-polypulse__step-marker" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary track */}
        <div className="myshkin-labs-polypulse__track-group">
          <div className="myshkin-labs-polypulse__track-header">
            <h2 className="myshkin-labs-polypulse__track-title">
              <span className="myshkin-labs-polypulse__pulse myshkin-labs-polypulse__pulse--secondary" />
              Counter Rhythm ({beatsSecondary} Beats / Bar)
            </h2>
            <span className="myshkin-labs-polypulse__track-hint">
              Hi-Hat / Accent
            </span>
          </div>
          <div className="myshkin-labs-polypulse__track">
            {Array.from({ length: beatsSecondary }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleAccent("secondary", i)}
                className="myshkin-labs-polypulse__step myshkin-labs-polypulse__step--secondary"
                data-state={stepState(
                  activeSecondaryStep === i,
                  secondaryAccents[i],
                )}
                aria-label={`Secondary step ${i + 1}${secondaryAccents[i] ? ", accented" : ""}`}
                aria-pressed={secondaryAccents[i]}
              >
                <span className="myshkin-labs-polypulse__step-number">
                  {i + 1}
                </span>
                {i === 0 && (
                  <span className="myshkin-labs-polypulse__step-marker" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
