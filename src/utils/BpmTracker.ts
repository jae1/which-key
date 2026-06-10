export class BpmTracker {
  private energyHistory: number[] = [];
  private historyMaxLength = 100; // About 2 seconds of history at ~50fps
  private beatTimestamps: number[] = [];
  private maxBeatHistory = 15;
  private lastBeatTime = 0;
  
  // Settings
  private thresholdMultiplier = 1.22; // How much higher than average the peak must be (lowered to 1.22 for better transient capture)
  private minBeatInterval = 280;      // ~214 BPM max
  private maxBeatInterval = 1200;     // ~50 BPM min
  
  // Manual Tap Tempo state
  private tapTimestamps: number[] = [];
  private maxTaps = 8;

  constructor() {}

  /**
   * Process a frame of FFT frequency data and return if a beat was detected.
   * @param frequencyData - Float32Array of frequency bins from AnalyserNode
   * @param sampleRate - The audio context sample rate (e.g., 44100)
   * @param fftSize - The FFT size (e.g., 2048)
   */
  public processFrame(frequencyData: Float32Array, sampleRate: number, fftSize: number): boolean {
    const binSize = sampleRate / fftSize;
    
    // Sum energy in the mid-bass range (50 Hz to 250 Hz) for better laptop mic response
    const lowFreqLimit = 50;
    const highFreqLimit = 250;
    const startBin = Math.max(0, Math.floor(lowFreqLimit / binSize));
    const endBin = Math.min(frequencyData.length - 1, Math.ceil(highFreqLimit / binSize));
    
    let bassEnergy = 0;
    let count = 0;
    
    for (let i = startBin; i <= endBin; i++) {
      // FFT values in dB are negative, convert to linear scale: 10^(db/20)
      // If we are using getFloatFrequencyData, values are -140 to 0 dB.
      const db = frequencyData[i];
      if (db > -100) { // Filter out extremely low noise
        const linear = Math.pow(10, db / 20);
        bassEnergy += linear;
        count++;
      }
    }
    
    if (count > 0) {
      bassEnergy = bassEnergy / count;
    }

    // Add to history
    this.energyHistory.push(bassEnergy);
    if (this.energyHistory.length > this.historyMaxLength) {
      this.energyHistory.shift();
    }

    // Need enough history to make an average
    if (this.energyHistory.length < 20) {
      return false;
    }

    // Calculate average energy in history (excluding the current frame)
    let sum = 0;
    for (let i = 0; i < this.energyHistory.length - 1; i++) {
      sum += this.energyHistory[i];
    }
    const avgEnergy = sum / (this.energyHistory.length - 1);

    const now = performance.now();
    const timeSinceLastBeat = now - this.lastBeatTime;

    // Detect Peak: current energy exceeds average by multiplier AND enough time has passed
    if (
      bassEnergy > avgEnergy * this.thresholdMultiplier &&
      timeSinceLastBeat > this.minBeatInterval &&
      bassEnergy > 0.005 // Absolute minimum threshold to prevent beat trigger in silence
    ) {
      this.lastBeatTime = now;
      this.beatTimestamps.push(now);
      
      if (this.beatTimestamps.length > this.maxBeatHistory) {
        this.beatTimestamps.shift();
      }
      
      return true;
    }

    return false;
  }

  /**
   * Reset all beat and tap history
   */
  public reset(): void {
    this.energyHistory = [];
    this.beatTimestamps = [];
    this.tapTimestamps = [];
    this.lastBeatTime = 0;
  }

  /**
   * Calculate BPM from automatic beat detection history
   */
  public calculateBpm(): number | null {
    if (this.beatTimestamps.length < 4) {
      return null; // Need at least 4 beats to calculate a stable BPM
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.beatTimestamps.length; i++) {
      const interval = this.beatTimestamps[i] - this.beatTimestamps[i - 1];
      if (interval >= this.minBeatInterval && interval <= this.maxBeatInterval) {
        intervals.push(interval);
      }
    }

    if (intervals.length < 3) {
      return null;
    }

    // Basic clustering: group intervals that are within 12% of each other
    const clusters: number[][] = [];
    const tolerance = 0.12;

    for (const interval of intervals) {
      let placed = false;
      for (const cluster of clusters) {
        const clusterAverage = cluster.reduce((a, b) => a + b, 0) / cluster.length;
        if (Math.abs(interval - clusterAverage) / clusterAverage < tolerance) {
          cluster.push(interval);
          placed = true;
          break;
        }
      }
      if (!placed) {
        clusters.push([interval]);
      }
    }

    // Find the cluster with the most intervals
    let largestCluster: number[] = [];
    for (const cluster of clusters) {
      if (cluster.length > largestCluster.length) {
        largestCluster = cluster;
      }
    }

    if (largestCluster.length < 2) {
      return null;
    }

    const avgInterval = largestCluster.reduce((a, b) => a + b, 0) / largestCluster.length;
    const bpm = 60000 / avgInterval;
    return Math.round(bpm);
  }

  /**
   * Handle user manual tap input and return the updated manual BPM
   */
  public tap(): number {
    const now = performance.now();
    this.tapTimestamps.push(now);

    // Keep only the last N taps
    if (this.tapTimestamps.length > this.maxTaps) {
      this.tapTimestamps.shift();
    }

    // If too much time passed since last tap, reset the queue except the current tap
    if (this.tapTimestamps.length > 1) {
      const lastInterval = now - this.tapTimestamps[this.tapTimestamps.length - 2];
      if (lastInterval > 2000) { // More than 2 seconds means tap sequence broke
        this.tapTimestamps = [now];
        return 0; // First tap of a new sequence
      }
    }

    if (this.tapTimestamps.length < 2) {
      return 0; // Need at least two taps
    }

    // Calculate intervals between taps
    const intervals: number[] = [];
    for (let i = 1; i < this.tapTimestamps.length; i++) {
      intervals.push(this.tapTimestamps[i] - this.tapTimestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60000 / avgInterval;
    return Math.round(bpm);
  }

  /**
   * Check if the beat detector has been active recently (e.g. within 2 seconds)
   */
  public isRecentBeatActive(): boolean {
    if (this.lastBeatTime === 0) return false;
    return (performance.now() - this.lastBeatTime) < 2000;
  }
}
