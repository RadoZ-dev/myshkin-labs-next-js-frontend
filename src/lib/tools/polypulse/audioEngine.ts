/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Browser-only: creates an AudioContext. Import from client components only.

export class PolyrhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private timerID: number | null = null;

  private bpm: number = 120;
  private beatsMain: number = 4;
  private beatsSecondary: number = 3;

  private nextMainTime: number = 0;
  private nextSecondaryTime: number = 0;

  private currentMainStep: number = 0;
  private currentSecondaryStep: number = 0;

  private mainVolume: number = 0.6;
  private secondaryVolume: number = 0.3;

  private mainAccents: boolean[] = [];
  private secondaryAccents: boolean[] = [];

  private onBeat: (type: "main" | "secondary", step: number, time: number) => void;

  constructor(
    onBeat: (type: "main" | "secondary", step: number, time: number) => void,
  ) {
    this.onBeat = onBeat;
  }

  public get currentTime(): number {
    return this.ctx?.currentTime || 0;
  }

  public setParams(
    bpm: number,
    main: number,
    secondary: number,
    mainAccents: boolean[],
    secondaryAccents: boolean[],
  ) {
    this.bpm = bpm;
    this.beatsMain = main;
    this.beatsSecondary = secondary;
    this.mainAccents = mainAccents;
    this.secondaryAccents = secondaryAccents;
  }

  public setVolumes(main: number, secondary: number) {
    this.mainVolume = main;
    this.secondaryVolume = secondary;
  }

  public start() {
    this.stop();
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime + 0.1;
    this.nextMainTime = now;
    this.nextSecondaryTime = now;
    this.currentMainStep = 0;
    this.currentSecondaryStep = 0;

    this.scheduler();
  }

  public stop() {
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  /**
   * Release the AudioContext entirely. Call on unmount — without this, browsers
   * cap concurrent contexts (~6 in Chrome) and repeatedly navigating to this
   * tool would leak one context per mount.
   */
  public dispose() {
    this.stop();
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
    }
    this.ctx = null;
  }

  public playKick(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.2);

    gain.gain.setValueAtTime(this.mainVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  public playSnare(time: number) {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.mainVolume * 0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);

    oscGain.gain.setValueAtTime(this.mainVolume * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + 0.1);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  public playHiHat(time: number, accented: boolean = false) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = accented ? 6000 : 8000;

    const gain = this.ctx.createGain();
    const vol = accented ? this.secondaryVolume * 1.5 : this.secondaryVolume;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + (accented ? 0.1 : 0.05));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + 0.1);
  }

  private scheduler() {
    if (!this.ctx) return;

    const lookAhead = 0.1; // 100ms
    const intervalMain = 60 / this.bpm;
    const barDuration = intervalMain * this.beatsMain;
    const intervalSecondary = barDuration / this.beatsSecondary;

    while (this.nextMainTime < this.ctx.currentTime + lookAhead) {
      if (this.mainAccents[this.currentMainStep]) {
        this.playSnare(this.nextMainTime);
      } else {
        this.playKick(this.nextMainTime);
      }
      this.onBeat("main", this.currentMainStep, this.nextMainTime);
      this.currentMainStep = (this.currentMainStep + 1) % this.beatsMain;
      this.nextMainTime += intervalMain;
    }

    while (this.nextSecondaryTime < this.ctx.currentTime + lookAhead) {
      const isAccented = this.secondaryAccents[this.currentSecondaryStep];
      this.playHiHat(this.nextSecondaryTime, isAccented);
      this.onBeat("secondary", this.currentSecondaryStep, this.nextSecondaryTime);
      this.currentSecondaryStep =
        (this.currentSecondaryStep + 1) % this.beatsSecondary;
      this.nextSecondaryTime += intervalSecondary;
    }

    this.timerID = window.setTimeout(() => this.scheduler(), 25);
  }
}
