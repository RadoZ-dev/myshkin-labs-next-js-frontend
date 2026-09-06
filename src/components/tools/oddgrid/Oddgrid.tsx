"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Square, Eraser, Volume2 } from "lucide-react";
import {
  ACCENT_VELOCITY_BOOST,
  OddgridAudioEngine,
  PRESETS,
  VOICES,
  isAudible,
  resizeSteps,
  stepCount,
  subdivisionFamily,
  type Lane,
  type StepValue,
  type Voice,
} from "@/lib/tools/oddgrid/audioEngine";

/** Build a lane, sizing its step array and laying `init` over the top. */
function makeLane(
  id: number,
  name: string,
  note: number,
  n: number,
  d: number,
  lengthBeats: number,
  vel: number,
  voice: Voice,
  init: StepValue[] = [],
): Lane {
  const lane: Lane = {
    id,
    name,
    note,
    n,
    d,
    lengthBeats,
    vel,
    voice,
    gain: 0.8,
    mute: false,
    solo: false,
    steps: [],
  };
  const length = stepCount(lane);
  lane.steps = Array.from({ length }, (_, i) => init[i] ?? 0);
  return lane;
}

/** Opening pattern: a straight kit under a quintuplet hat and a 7-over-4 perc. */
const INITIAL_LANES: Lane[] = [
  makeLane(1, "Kick", 36, 4, 1, 4, 100, "kick",
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0]),
  makeLane(2, "Snare", 38, 4, 1, 4, 100, "snare",
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
  makeLane(3, "Hat", 42, 5, 1, 4, 92, "hat",
    [2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1]),
  makeLane(4, "Perc", 39, 7, 4, 4, 88, "clap", [0, 1, 0, 1, 0, 0, 1]),
  makeLane(5, "Tom", 45, 3, 1, 4, 95, "tom"),
  makeLane(6, "Ride", 51, 4, 1, 4, 85, "metal"),
];

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export default function Oddgrid() {
  const [lanes, setLanes] = useState<Lane[]>(INITIAL_LANES);
  const [bpm, setBpm] = useState(100);
  const [volume, setVolume] = useState(0.7);
  const [isPlaying, setIsPlaying] = useState(false);
  /** lane id -> currently sounding step index. */
  const [heads, setHeads] = useState<Record<number, number>>({});

  const engineRef = useRef<OddgridAudioEngine | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new OddgridAudioEngine();
    }
    return engineRef.current;
  }, []);

  // Release the audio context on unmount. Next.js navigates client-side, so
  // unmount is the only cleanup signal — without this the scheduler keeps
  // re-arming and audio plays over the rest of the site.
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keep the engine's copy of the pattern in step with React state.
  useEffect(() => {
    getEngine().setLanes(lanes);
  }, [lanes, getEngine]);

  useEffect(() => {
    getEngine().setBpm(bpm);
  }, [bpm, getEngine]);

  useEffect(() => {
    getEngine().setVolume(volume);
  }, [volume, getEngine]);

  // Move the playhead. The engine timestamps each step when it schedules it, so
  // polling on rAF lights a cell at the moment it is actually heard rather than
  // when it was queued.
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const frame = () => {
      const due = engineRef.current?.drainDueSteps();
      if (due?.size) {
        setHeads((prev) => {
          const next = { ...prev };
          for (const [id, index] of due) next[id] = index;
          return next;
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const engine = getEngine();
    setIsPlaying((playing) => {
      if (playing) {
        engine.stop();
      } else {
        engine.setLanes(lanes);
        engine.start();
      }
      return !playing;
    });
    // Cleared from the click rather than the rAF effect, so that effect stays a
    // pure subscription to the engine.
    setHeads({});
  }, [lanes, getEngine]);

  // Space toggles transport, unless the user is typing in a control.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay]);

  /** Apply a patch to one lane, resizing its steps if the ratio changed. */
  const updateLane = useCallback(
    (id: number, patch: Partial<Lane>, resize = false) => {
      setLanes((prev) =>
        prev.map((lane) => {
          if (lane.id !== id) return lane;
          const next = { ...lane, ...patch };
          if (resize) next.steps = resizeSteps(next);
          return next;
        }),
      );
    },
    [],
  );

  /** Cycle a cell off -> note -> accent, auditioning it while stopped. */
  const cycleStep = useCallback(
    (id: number, index: number) => {
      setLanes((prev) =>
        prev.map((lane) => {
          if (lane.id !== id) return lane;
          const steps = [...lane.steps];
          const value = ((steps[index] + 1) % 3) as StepValue;
          steps[index] = value;
          if (value && !isPlaying) {
            engineRef.current?.preview(
              lane,
              value === 2
                ? Math.min(127, lane.vel + ACCENT_VELOCITY_BOOST)
                : lane.vel,
            );
          }
          return { ...lane, steps };
        }),
      );
    },
    [isPlaying],
  );

  const clearAll = useCallback(() => {
    setLanes((prev) =>
      prev.map((lane) => ({
        ...lane,
        steps: lane.steps.map(() => 0 as StepValue),
      })),
    );
  }, []);

  const anySolo = lanes.some((lane) => lane.solo);

  return (
    <div className="myshkin-labs-tool myshkin-labs-oddgrid">
      <header className="myshkin-labs-tool__header">
        <h1 className="myshkin-labs-tool__title">PolyPulse Drum Trainer</h1>
        <p className="myshkin-labs-tool__tagline">Odd Subdivisions, Side by Side</p>
      </header>

      <p className="myshkin-labs-tool__intro myshkin-labs-oddgrid__intro">
        A step sequencer where every lane keeps its own subdivision. Put
        quintuplets against straight sixteenths, or 7-over-4 against a triplet,
        and hear how they fall. Click a step once for a note, twice for an
        accent, three times to clear it.
      </p>

      {/* Transport */}
      <section className="myshkin-labs-tool__panel myshkin-labs-oddgrid__bar">
        <div className="myshkin-labs-oddgrid__bar-group">
          <label className="myshkin-labs-tool__label" htmlFor="oddgrid-bpm">
            Tempo
          </label>
          <input
            id="oddgrid-bpm"
            type="number"
            min={20}
            max={300}
            value={bpm}
            onChange={(e) =>
              setBpm(clamp(parseInt(e.target.value) || 100, 20, 300))
            }
            className="myshkin-labs-oddgrid__number"
          />
        </div>

        <div className="myshkin-labs-oddgrid__bar-group myshkin-labs-oddgrid__bar-group--wide">
          <label className="myshkin-labs-tool__label" htmlFor="oddgrid-volume">
            <Volume2 className="w-3 h-3" />
            <span>Master</span>
          </label>
          <input
            id="oddgrid-volume"
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
            className="myshkin-labs-tool__slider myshkin-labs-tool__slider--blue w-full"
          />
        </div>

        <div className="myshkin-labs-oddgrid__bar-actions">
          <button
            type="button"
            onClick={togglePlay}
            className={`myshkin-labs-tool__button ${
              isPlaying
                ? "myshkin-labs-tool__button--danger"
                : "myshkin-labs-tool__button--go"
            }`}
            aria-label={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? (
              <Square className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>{isPlaying ? "Stop" : "Play"}</span>
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="myshkin-labs-tool__button"
          >
            <Eraser className="w-3 h-3" />
            <span>Clear all</span>
          </button>
          <span className="myshkin-labs-tool__hint">Space bar toggles play</span>
        </div>
      </section>

      {/* Lanes */}
      <div className="myshkin-labs-oddgrid__lanes">
        {lanes.map((lane) => {
          const head = isPlaying ? heads[lane.id] : undefined;
          // Dim lanes that are silent, so a solo elsewhere is visible here.
          const silent = !isAudible(lane, anySolo);
          const msPerStep = ((lane.d / lane.n) * (60 / bpm) * 1000).toFixed(1);

          return (
            <section
              key={lane.id}
              className="myshkin-labs-oddgrid__lane"
              data-family={subdivisionFamily(lane.n)}
              data-silent={silent}
            >
              {/* Lane controls */}
              <div className="myshkin-labs-oddgrid__controls">
                <div className="myshkin-labs-oddgrid__control-row">
                  <input
                    value={lane.name}
                    onChange={(e) => updateLane(lane.id, { name: e.target.value })}
                    className="myshkin-labs-oddgrid__text"
                    aria-label="Lane name"
                  />
                  <button
                    type="button"
                    onClick={() => updateLane(lane.id, { mute: !lane.mute })}
                    className="myshkin-labs-oddgrid__toggle myshkin-labs-oddgrid__toggle--mute"
                    data-on={lane.mute}
                    aria-pressed={lane.mute}
                    aria-label={`Mute ${lane.name}`}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLane(lane.id, { solo: !lane.solo })}
                    className="myshkin-labs-oddgrid__toggle myshkin-labs-oddgrid__toggle--solo"
                    data-on={lane.solo}
                    aria-pressed={lane.solo}
                    aria-label={`Solo ${lane.name}`}
                  >
                    S
                  </button>
                </div>

                <select
                  value={`${lane.n}/${lane.d}`}
                  onChange={(e) => {
                    const [n, d] = e.target.value.split("/").map(Number);
                    updateLane(lane.id, { n, d }, true);
                  }}
                  className="myshkin-labs-tool__select w-full"
                  aria-label="Subdivision preset"
                >
                  {/* A hand-typed ratio may not match any preset */}
                  {!PRESETS.some(([, n, d]) => n === lane.n && d === lane.d) && (
                    <option value={`${lane.n}/${lane.d}`}>
                      {lane.n}:{lane.d} (custom)
                    </option>
                  )}
                  {PRESETS.map(([label, n, d]) => (
                    <option key={label} value={`${n}/${d}`}>
                      {label}
                    </option>
                  ))}
                </select>

                <div className="myshkin-labs-oddgrid__control-row myshkin-labs-oddgrid__control-row--ratio">
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={lane.n}
                    onChange={(e) =>
                      updateLane(
                        lane.id,
                        { n: clamp(parseInt(e.target.value) || 1, 1, 64) },
                        true,
                      )
                    }
                    className="myshkin-labs-oddgrid__number myshkin-labs-oddgrid__number--tight"
                    aria-label="Notes"
                  />
                  <span className="myshkin-labs-oddgrid__ratio-text">
                    notes per
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={lane.d}
                    onChange={(e) =>
                      updateLane(
                        lane.id,
                        { d: clamp(parseInt(e.target.value) || 1, 1, 16) },
                        true,
                      )
                    }
                    className="myshkin-labs-oddgrid__number myshkin-labs-oddgrid__number--tight"
                    aria-label="Beats per group"
                  />
                  <span className="myshkin-labs-oddgrid__ratio-text">
                    {lane.d === 1 ? "beat" : "beats"}
                  </span>
                </div>

                <select
                  value={lane.voice}
                  onChange={(e) => {
                    const voice = e.target.value as Voice;
                    updateLane(lane.id, { voice });
                    engineRef.current?.preview({ ...lane, voice });
                  }}
                  className="myshkin-labs-tool__select w-full"
                  aria-label="Voice"
                >
                  {VOICES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>

                <div className="myshkin-labs-oddgrid__control-grid">
                  <label className="myshkin-labs-oddgrid__field">
                    <span className="myshkin-labs-tool__label">Beats</span>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={lane.lengthBeats}
                      onChange={(e) =>
                        updateLane(
                          lane.id,
                          {
                            lengthBeats: clamp(
                              parseInt(e.target.value) || 1,
                              1,
                              16,
                            ),
                          },
                          true,
                        )
                      }
                      className="myshkin-labs-oddgrid__number"
                    />
                  </label>
                  <label className="myshkin-labs-oddgrid__field">
                    <span className="myshkin-labs-tool__label">Pitch</span>
                    <input
                      type="number"
                      min={0}
                      max={127}
                      value={lane.note}
                      onChange={(e) =>
                        updateLane(lane.id, {
                          note: clamp(parseInt(e.target.value) || 0, 0, 127),
                        })
                      }
                      className="myshkin-labs-oddgrid__number"
                    />
                  </label>
                  <label className="myshkin-labs-oddgrid__field">
                    <span className="myshkin-labs-tool__label">Vel</span>
                    <input
                      type="number"
                      min={1}
                      max={127}
                      value={lane.vel}
                      onChange={(e) =>
                        updateLane(lane.id, {
                          vel: clamp(parseInt(e.target.value) || 1, 1, 127),
                        })
                      }
                      className="myshkin-labs-oddgrid__number"
                    />
                  </label>
                </div>
              </div>

              {/* Step grid */}
              <div className="myshkin-labs-oddgrid__grid-wrap">
                <div
                  className="myshkin-labs-oddgrid__ruler"
                  style={{
                    gridTemplateColumns: `repeat(${lane.lengthBeats}, 1fr)`,
                  }}
                  aria-hidden="true"
                >
                  {Array.from({ length: lane.lengthBeats }, (_, i) => (
                    <i key={i}>{i + 1}</i>
                  ))}
                </div>

                <div
                  className="myshkin-labs-oddgrid__steps"
                  style={{
                    gridTemplateColumns: `repeat(${lane.steps.length}, 1fr)`,
                  }}
                >
                  {lane.steps.map((value, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => cycleStep(lane.id, i)}
                      className="myshkin-labs-oddgrid__step"
                      data-v={value}
                      data-head={head === i}
                      aria-label={`${lane.name} step ${i + 1}: ${
                        value === 2 ? "accent" : value === 1 ? "note" : "off"
                      }`}
                    />
                  ))}
                </div>

                <p className="myshkin-labs-oddgrid__count">
                  <em>{lane.steps.length} steps</em> · {lane.n}:{lane.d} per beat
                  · {msPerStep} ms
                </p>

                <div className="myshkin-labs-oddgrid__fader">
                  <span className="myshkin-labs-tool__label">Level</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(lane.gain * 100)}
                    onChange={(e) =>
                      updateLane(lane.id, {
                        gain: parseInt(e.target.value) / 100,
                      })
                    }
                    className="myshkin-labs-tool__slider w-full"
                    aria-label={`${lane.name} level`}
                  />
                  <span className="myshkin-labs-tool__value myshkin-labs-oddgrid__fader-value">
                    {Math.round(lane.gain * 100)}
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Notes */}
      <section className="myshkin-labs-oddgrid__notes">
        <h2 className="myshkin-labs-oddgrid__notes-title">How to read it</h2>
        <p>
          Every lane spans the same number of beats, so a five-per-beat lane and
          a four-per-beat lane are drawn the same width. The misalignment
          against the beat ticks along the top is the thing you&apos;re
          listening for.
        </p>

        <h2 className="myshkin-labs-oddgrid__notes-title">Subdivisions</h2>
        <p>
          Each lane is set as <em>n notes per d beats</em>. 4:1 is sixteenths,
          3:1 is eighth-note triplets, 5:1 is sixteenth quintuplets, 7:1
          septuplets. Ratios like 5:2 or 7:4 spread an odd number of notes
          across several beats, so they only resolve every few bars.
        </p>

        <h2 className="myshkin-labs-oddgrid__notes-title">Polymeter</h2>
        <p>
          Lane length is set in beats and can differ per lane. A three-beat lane
          against a four-beat lane realigns every twelve beats — a different
          kind of odd from the subdivisions above, and they stack.
        </p>

        <h2 className="myshkin-labs-oddgrid__notes-title">Sound</h2>
        <p>
          Everything is synthesised in the browser with Web Audio — no samples,
          nothing to load. Each lane has its own level fader; the master is in
          the bar at the top.
        </p>
      </section>
    </div>
  );
}
