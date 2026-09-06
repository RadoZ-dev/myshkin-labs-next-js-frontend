// Browser-only: creates an AudioContext. Import from client components only.

/** Synth voices. Each is built from oscillators/noise — no samples to load. */
export const VOICES = [
  "kick",
  "snare",
  "hat",
  "clap",
  "tom",
  "metal",
  "tone",
] as const;

export type Voice = (typeof VOICES)[number];

/** 0 = off, 1 = note, 2 = accent. Cells cycle through these on click. */
export type StepValue = 0 | 1 | 2;

/** How much an accented step adds to a lane's velocity. */
export const ACCENT_VELOCITY_BOOST = 30;

export interface Lane {
  id: number;
  name: string;
  /** MIDI note number — only the pitched voices (tom, tone) read this. */
  note: number;
  /** Subdivision numerator: `n` notes per `d` beats. */
  n: number;
  /** Subdivision denominator. */
  d: number;
  /** Lane length in beats. Lanes may differ, which is what makes polymeter. */
  lengthBeats: number;
  /** Base MIDI velocity, 1-127. */
  vel: number;
  voice: Voice;
  /** Lane level, 0-1. */
  gain: number;
  mute: boolean;
  steps: StepValue[];
}

/** Subdivision presets offered in each lane's dropdown. */
export const PRESETS: ReadonlyArray<readonly [label: string, n: number, d: number]> = [
  ["1/4", 1, 1],
  ["1/8", 2, 1],
  ["1/8 triplet", 3, 1],
  ["1/16", 4, 1],
  ["1/16 quintuplet", 5, 1],
  ["1/16 triplet", 6, 1],
  ["1/16 septuplet", 7, 1],
  ["1/32", 8, 1],
  ["1/32 nonuplet", 9, 1],
  ["5 over 2 beats", 5, 2],
  ["7 over 4 beats", 7, 4],
  ["11 over 4 beats", 11, 4],
];

/** Step count for a lane: its length in beats times its subdivision. */
export function stepCount(lane: Pick<Lane, "lengthBeats" | "n" | "d">): number {
  return Math.max(1, Math.round((lane.lengthBeats * lane.n) / lane.d));
}

/**
 * Grow or shrink a lane's step array to match its current ratio and length,
 * preserving whatever steps still fit.
 */
export function resizeSteps(lane: Lane): StepValue[] {
  const want = stepCount(lane);
  return Array.from({ length: want }, (_, i) => lane.steps[i] ?? 0);
}

/**
 * Which accent colour a lane wears, keyed on its subdivision. Septuplets,
 * quintuplets and triplets each get their own colour so the odd lanes are
 * distinguishable at a glance from the ordinary power-of-two grid.
 */
export type SubdivisionFamily = "sept" | "quint" | "trip" | "pow2" | "odd";

export function subdivisionFamily(n: number): SubdivisionFamily {
  if (n % 7 === 0) return "sept";
  if (n % 5 === 0) return "quint";
  if (n % 3 === 0) return "trip";
  if ((n & (n - 1)) === 0) return "pow2";
  return "odd";
}

const mtof = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** A step that has been scheduled but has not sounded yet. */
interface QueuedStep {
  at: number;
  index: number;
}

/** Per-lane playback bookkeeping, kept outside React state. */
interface LaneRuntime {
  nextTime: number;
  step: number;
  queue: QueuedStep[];
  bus: GainNode | null;
}

const TICK_MS = 25; // scheduler wakeup interval
const LOOKAHEAD = 0.15; // seconds scheduled in advance

/**
 * Step sequencer where every lane runs its own subdivision against a shared
 * tempo. Everything is scheduled on the AudioContext clock; the UI reads back
 * which step is sounding via `drainDueSteps`.
 */
export class OddgridAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timerId: number | null = null;

  private bpm = 100;
  private vol = 0.7;
  private lanes: Lane[] = [];
  private runtime = new Map<number, LaneRuntime>();

  public get playing(): boolean {
    return this.timerId !== null;
  }

  public get currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.vol;
      this.master.connect(this.ctx.destination);

      // Two seconds of looping white noise, shared by every noise-based voice.
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.ctx;
  }

  /**
   * Push the current lane list and tempo in. Called whenever React state
   * changes; safe to call while playing.
   */
  public setLanes(lanes: Lane[]) {
    this.lanes = lanes;

    // Drop runtime for lanes that no longer exist, releasing their bus.
    for (const [id, rt] of this.runtime) {
      if (!lanes.some((l) => l.id === id)) {
        rt.bus?.disconnect();
        this.runtime.delete(id);
      }
    }

    for (const lane of lanes) {
      const rt = this.runtime.get(lane.id);
      if (rt?.bus) {
        rt.bus.gain.setTargetAtTime(
          lane.mute ? 0 : lane.gain,
          this.currentTime,
          0.01, // ramp, so level changes don't click
        );
      }
    }
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public setVolume(vol: number) {
    this.vol = vol;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.01);
    }
  }

  /** Audio-thread gain node for a lane, created on first use. */
  private busFor(lane: Lane): GainNode {
    const ctx = this.ensureContext();
    let rt = this.runtime.get(lane.id);
    if (!rt) {
      rt = { nextTime: 0, step: 0, queue: [], bus: null };
      this.runtime.set(lane.id, rt);
    }
    if (!rt.bus) {
      rt.bus = ctx.createGain();
      rt.bus.gain.value = lane.mute ? 0 : lane.gain;
      rt.bus.connect(this.master!);
    }
    return rt.bus;
  }

  /** Exponential decay envelope; returns the node to connect a source into. */
  private env(
    at: number,
    peak: number,
    dur: number,
    dest: AudioNode,
    attack = 0.002,
  ): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    g.connect(dest);
    return g;
  }

  private noiseSource(): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    return s;
  }

  private run(node: AudioScheduledSourceNode, at: number, dur: number) {
    node.start(at);
    node.stop(at + dur + 0.03);
  }

  /** Synthesise one hit of `voice` at AudioContext time `at`. */
  private hit(
    voice: Voice,
    at: number,
    vel: number,
    note: number,
    dest: AudioNode,
  ) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const a = vel / 127;
    const E = (peak: number, dur: number, t0 = at, atk = 0.002) =>
      this.env(t0, peak, dur, dest, atk);

    if (voice === "kick") {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(150, at);
      o.frequency.exponentialRampToValueAtTime(44, at + 0.09);
      o.connect(E(0.9 * a, 0.42));
      this.run(o, at, 0.42);
    } else if (voice === "snare") {
      const n = this.noiseSource();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      bp.Q.value = 0.9;
      n.connect(bp);
      bp.connect(E(0.45 * a, 0.19));
      this.run(n, at, 0.19);

      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(190, at);
      o.connect(E(0.3 * a, 0.11));
      this.run(o, at, 0.11);
    } else if (voice === "hat") {
      const n = this.noiseSource();
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7500;
      n.connect(hp);
      hp.connect(E(0.26 * a, 0.045));
      this.run(n, at, 0.045);
    } else if (voice === "clap") {
      // Three short bursts through one filter — the classic clap smear.
      const hp = ctx.createBiquadFilter();
      hp.type = "bandpass";
      hp.frequency.value = 1100;
      hp.Q.value = 0.7;
      [0, 0.009, 0.019].forEach((off, i) => {
        const last = i === 2;
        const n = this.noiseSource();
        n.connect(hp);
        hp.connect(
          E((last ? 0.42 : 0.22) * a, last ? 0.13 : 0.03, at + off),
        );
        this.run(n, at + off, last ? 0.13 : 0.03);
      });
    } else if (voice === "tom") {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(mtof(note) * 2, at);
      o.frequency.exponentialRampToValueAtTime(mtof(note), at + 0.18);
      o.connect(E(0.65 * a, 0.34));
      this.run(o, at, 0.34);
    } else if (voice === "metal") {
      const n = this.noiseSource();
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 8200;
      n.connect(hp);
      hp.connect(E(0.2 * a, 0.5));
      this.run(n, at, 0.5);
    } else {
      // tone — pitched, follows the lane's note number
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(mtof(note), at);
      o.connect(E(0.32 * a, 0.28, at, 0.004));
      this.run(o, at, 0.28);
    }
  }

  /** Audition a lane's voice once, for previewing edits while stopped. */
  public preview(lane: Lane, vel?: number) {
    const ctx = this.ensureContext();
    void ctx.resume();
    this.hit(
      lane.voice,
      ctx.currentTime + 0.02,
      vel ?? lane.vel,
      lane.note,
      this.busFor(lane),
    );
  }

  private beatDur(): number {
    return 60 / this.bpm;
  }

  private stepDur(lane: Lane): number {
    return (lane.d / lane.n) * this.beatDur();
  }

  private scheduler = () => {
    if (!this.ctx) return;
    const horizon = this.ctx.currentTime + LOOKAHEAD;

    for (const lane of this.lanes) {
      const rt = this.runtime.get(lane.id);
      if (!rt) continue;
      const sd = this.stepDur(lane);
      if (!Number.isFinite(sd) || sd <= 0) continue;

      while (rt.nextTime < horizon) {
        // A lane's step array can shrink under us when the ratio changes.
        const index = rt.step % lane.steps.length;
        const v = lane.steps[index];
        if (v && !lane.mute) {
          const vel =
            v === 2 ? Math.min(127, lane.vel + ACCENT_VELOCITY_BOOST) : lane.vel;
          this.hit(lane.voice, rt.nextTime, vel, lane.note, this.busFor(lane));
        }
        rt.queue.push({ at: rt.nextTime, index });
        rt.step = (index + 1) % lane.steps.length;
        rt.nextTime += sd;
      }
    }
  };

  public start() {
    const ctx = this.ensureContext();
    void ctx.resume(); // browsers only allow this from a user gesture
    this.stop();

    const t0 = ctx.currentTime + 0.1;
    for (const lane of this.lanes) {
      this.busFor(lane); // creates runtime as a side effect
      const rt = this.runtime.get(lane.id)!;
      rt.nextTime = t0;
      rt.step = 0;
      rt.queue = [];
    }

    this.scheduler();
    this.timerId = window.setInterval(this.scheduler, TICK_MS);
  }

  public stop() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    for (const rt of this.runtime.values()) rt.queue = [];
  }

  /**
   * Pop every step whose scheduled time has now passed, so the caller can move
   * the playhead. Returns a lane id -> step index map of what just sounded.
   */
  public drainDueSteps(): Map<number, number> {
    const heads = new Map<number, number>();
    if (!this.ctx) return heads;
    const now = this.ctx.currentTime;

    for (const [id, rt] of this.runtime) {
      while (rt.queue.length && rt.queue[0].at <= now) {
        heads.set(id, rt.queue.shift()!.index);
      }
    }
    return heads;
  }

  /**
   * Release the AudioContext entirely. Call on unmount — without this, browsers
   * cap concurrent contexts (~6 in Chrome) and repeatedly navigating to this
   * tool would leak one context per mount.
   */
  public dispose() {
    this.stop();
    this.runtime.clear();
    if (this.ctx && this.ctx.state !== "closed") {
      void this.ctx.close();
    }
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
  }
}
