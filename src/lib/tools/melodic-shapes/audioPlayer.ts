import type { RhythmItem, Pitch } from "./rhythmUtils";

// Browser-only: module-level AudioContext and playback state. Import from
// client components only — a server import would instantiate this per render
// worker.

let audioContext: AudioContext | null = null;
const activeNodes: {
  source: AudioScheduledSourceNode;
  gain: GainNode;
  stopTime: number;
}[] = [];

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }
  // Browsers create contexts suspended without a user gesture. startDrone() can
  // be the first interaction, so resume here rather than only in startPlayback.
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function stopAllNodes() {
  const now = audioContext?.currentTime ?? 0;
  activeNodes.forEach(({ source, gain }) => {
    try {
      source.stop(now);
    } catch {}
    try {
      source.disconnect();
      gain.disconnect();
    } catch {}
  });
  activeNodes.length = 0;
}

function cleanupFinishedNodes(currentTime: number) {
  for (let i = activeNodes.length - 1; i >= 0; i--) {
    if (activeNodes[i].stopTime <= currentTime) {
      activeNodes.splice(i, 1);
    }
  }
}

function noteToFrequency(note: string, octave: number): number {
  const noteMap: Record<string, number> = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
  };
  const semitone = noteMap[note.toUpperCase()] ?? 0;
  const midi = 12 * (octave + 1) + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  staccato = false,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, startTime);
  // Staccato: decay within the first ~25% of the note; full note: decay over 95%
  const decayEnd = staccato
    ? startTime + Math.min(duration * 0.25, 0.12)
    : startTime + duration * 0.95;
  gain.gain.exponentialRampToValueAtTime(0.001, decayEnd);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  const stopTime = startTime + duration;
  osc.stop(stopTime);
  activeNodes.push({ source: osc, gain, stopTime });
}

function playHiHat(ctx: AudioContext, startTime: number, duration: number) {
  // White noise burst for hi-hat sound
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 8000;
  bandpass.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

  source.connect(bandpass).connect(gain).connect(ctx.destination);
  source.start(startTime);
  const stopTime = startTime + 0.1;
  source.stop(stopTime);
  activeNodes.push({ source, gain, stopTime });
}

function playClick(ctx: AudioContext, startTime: number, accent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = accent ? 1000 : 800;
  gain.gain.setValueAtTime(accent ? 0.15 : 0.08, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  const stopTime = startTime + 0.06;
  osc.stop(stopTime);
  activeNodes.push({ source: osc, gain, stopTime });
}

function scheduleCountIn(ctx: AudioContext, bpm: number, startTime: number) {
  const beatDuration = 60 / bpm;
  for (let i = 0; i < 4; i++) {
    playClick(ctx, startTime + i * beatDuration, i === 0);
  }
}

/**
 * Schedule a full melody phrase with metronome.
 * Returns the total duration of the phrase (enough metronome bars to cover the stretched melody).
 */
function schedulePhrase(
  ctx: AudioContext,
  rhythm: RhythmItem[],
  pitches: Pitch[],
  bpm: number,
  phraseStartTime: number,
  timeFeelMultiplier: number = 1,
  rhythmOnly: boolean = false,
  onNoteChange?: (index: number | null) => void,
  noteTimeoutIds?: number[],
  onRhythmIndexChange?: (index: number | null) => void,
): number {
  const beatDuration = 60 / bpm;
  const barDuration = 4 * beatDuration;

  // Calculate total melody duration with time feel
  let melodyBeats = 0;
  rhythm.forEach((item) => {
    melodyBeats += item.beats * timeFeelMultiplier;
  });

  // Number of metronome bars needed to cover the melody
  const barsNeeded = Math.max(1, Math.ceil(melodyBeats / 4));
  const phraseDuration = barsNeeded * barDuration;

  // How many times the motive fits in the phrase duration
  const melodyDuration = melodyBeats * beatDuration;
  const repetitions =
    melodyDuration > 0 ? Math.floor(phraseDuration / melodyDuration) : 1;

  // Schedule metronome clicks for all bars
  for (let bar = 0; bar < barsNeeded; bar++) {
    for (let i = 0; i < 4; i++) {
      playClick(
        ctx,
        phraseStartTime + bar * barDuration + i * beatDuration,
        i === 0,
      );
    }
  }

  // Schedule melody notes, repeating to fill the phrase.
  // Tied notes are merged so e.g. two tied eighths play as one quarter.
  for (let rep = 0; rep < repetitions; rep++) {
    let t = phraseStartTime + rep * melodyDuration;
    for (let i = 0; i < rhythm.length; i++) {
      const item = rhythm[i];
      const duration = item.beats * beatDuration * timeFeelMultiplier;

      if (!item.isRest && item.noteIndex != null && !item.tiedFromPrev) {
        // Accumulate duration of any following tied notes
        let totalDuration = duration;
        let j = i;
        while (rhythm[j].tiedToNext && j + 1 < rhythm.length) {
          j++;
          totalDuration += rhythm[j].beats * beatDuration * timeFeelMultiplier;
        }

        if (rhythmOnly) {
          playHiHat(ctx, t, totalDuration);
        } else {
          const pitch = pitches[item.noteIndex];
          if (pitch) {
            playTone(
              ctx,
              noteToFrequency(pitch.note, pitch.octave),
              t,
              totalDuration,
              item.staccato,
            );
          }
        }
        if (onNoteChange) {
          const delayMs = (t - ctx.currentTime) * 1000;
          const tid = window.setTimeout(
            () => onNoteChange(item.noteIndex ?? null),
            delayMs,
          );
          noteTimeoutIds?.push(tid);
        }
      }
      if (onRhythmIndexChange) {
        const delayMs = (t - ctx.currentTime) * 1000;
        const tid = window.setTimeout(() => onRhythmIndexChange(i), delayMs);
        noteTimeoutIds?.push(tid);
      }
      t += duration;
    }
  }

  return phraseDuration;
}

/** Shared mutable state for a running player session */
interface PlayerState {
  rhythm: RhythmItem[];
  pitches: Pitch[];
  bpm: number;
  timeFeelMultiplier: number;
  rhythmOnly: boolean;
  cancelled: boolean;
  nextBarTime: number;
  pendingUpdate: boolean;
  timeoutId: number;
  noteTimeoutIds: number[];
  onNoteChange?: (index: number | null) => void;
  onRhythmIndexChange?: (index: number | null) => void;
}

let currentState: PlayerState | null = null;

// Drone state
let droneNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

function stopDrone() {
  droneNodes.forEach(({ osc, gain }) => {
    try {
      osc.stop();
    } catch {}
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {}
  });
  droneNodes = [];
}

export function startDrone(note: string) {
  stopDrone();
  const ctx = getAudioContext();
  const freq = noteToFrequency(note, 3);

  // Use a triangle wave with a high-pass filter for a clearer, less bassy drone
  for (const detune of [-5, 5]) {
    const osc = ctx.createOscillator();
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 120;
    highpass.Q.value = 0.7;
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.value = 0.07;
    osc.connect(highpass).connect(gain).connect(ctx.destination);
    osc.start();
    droneNodes.push({ osc, gain });
  }
}

export { stopDrone };

function schedulerLoop(ctx: AudioContext, state: PlayerState) {
  if (state.cancelled) return;

  cleanupFinishedNodes(ctx.currentTime);

  const beatDuration = 60 / state.bpm;
  const barDuration = 4 * beatDuration;
  const lookAhead = ctx.currentTime + barDuration * 4;

  while (state.nextBarTime < lookAhead) {
    if (state.pendingUpdate) {
      scheduleCountIn(ctx, state.bpm, state.nextBarTime);
      state.nextBarTime += barDuration;
      state.pendingUpdate = false;
    } else {
      const phraseDuration = schedulePhrase(
        ctx,
        state.rhythm,
        state.pitches,
        state.bpm,
        state.nextBarTime,
        state.timeFeelMultiplier,
        state.rhythmOnly,
        state.onNoteChange,
        state.noteTimeoutIds,
        state.onRhythmIndexChange,
      );
      state.nextBarTime += phraseDuration;
    }
  }

  state.timeoutId = window.setTimeout(
    () => schedulerLoop(ctx, state),
    barDuration * 0.5 * 1000,
  );
}

/**
 * Start playback with a count-in. Returns a cancel function.
 */
export function startPlayback(
  rhythm: RhythmItem[],
  pitches: Pitch[],
  bpm: number,
  timeFeelMultiplier: number = 1,
  rhythmOnly: boolean = false,
  onNoteChange?: (index: number | null) => void,
  onRhythmIndexChange?: (index: number | null) => void,
): () => void {
  // Stop any existing playback
  if (currentState) {
    currentState.cancelled = true;
    clearTimeout(currentState.timeoutId);
    stopAllNodes();
  }

  const ctx = getAudioContext();
  const beatDuration = 60 / bpm;
  const barDuration = 4 * beatDuration;
  const countInStart = ctx.currentTime + 0.1;

  // Schedule count-in
  scheduleCountIn(ctx, bpm, countInStart);

  const state: PlayerState = {
    rhythm,
    pitches,
    bpm,
    timeFeelMultiplier,
    rhythmOnly,
    cancelled: false,
    nextBarTime: countInStart + barDuration,
    pendingUpdate: false,
    timeoutId: 0,
    noteTimeoutIds: [],
    onNoteChange,
    onRhythmIndexChange,
  };

  currentState = state;
  schedulerLoop(ctx, state);

  return () => {
    state.cancelled = true;
    clearTimeout(state.timeoutId);
    state.noteTimeoutIds.forEach(clearTimeout);
    state.noteTimeoutIds = [];
    stopAllNodes();
    if (currentState === state) currentState = null;
  };
}

/**
 * Update parameters mid-playback. A count-in bar plays before the new melody.
 */
export function updatePlayback(
  rhythm: RhythmItem[],
  pitches: Pitch[],
  bpm: number,
  timeFeelMultiplier?: number,
  rhythmOnly?: boolean,
) {
  if (!currentState || currentState.cancelled) return;

  clearTimeout(currentState.timeoutId);
  currentState.noteTimeoutIds.forEach(clearTimeout);
  currentState.noteTimeoutIds = [];
  stopAllNodes();

  const ctx = getAudioContext();

  currentState.rhythm = rhythm;
  currentState.pitches = pitches;
  currentState.bpm = bpm;
  if (timeFeelMultiplier !== undefined) {
    currentState.timeFeelMultiplier = timeFeelMultiplier;
  }
  if (rhythmOnly !== undefined) {
    currentState.rhythmOnly = rhythmOnly;
  }
  currentState.nextBarTime = ctx.currentTime + 0.05;
  currentState.pendingUpdate = true;

  schedulerLoop(ctx, currentState);
}

export function isCurrentlyPlaying(): boolean {
  return currentState !== null && !currentState.cancelled;
}

/**
 * Hard stop: cancels playback, clears every pending timeout, kills all audio
 * nodes and the drone. Safe to call when nothing is playing.
 *
 * Next.js navigates client-side, so component unmount is the only cleanup
 * signal — without this the scheduler keeps re-arming and audio plays over the
 * rest of the site.
 */
export function stopAll() {
  if (currentState) {
    currentState.cancelled = true;
    clearTimeout(currentState.timeoutId);
    currentState.noteTimeoutIds.forEach(clearTimeout);
    currentState.noteTimeoutIds = [];
    currentState = null;
  }
  stopAllNodes();
  stopDrone();
}
