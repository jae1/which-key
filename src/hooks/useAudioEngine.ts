import { useState, useEffect, useRef, useCallback } from 'react';
import { findKey } from '../utils/KeyFinder';
import type { KeyPrediction } from '../utils/KeyFinder';
import { BpmTracker } from '../utils/BpmTracker';

export function useAudioEngine() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [alternativeKeys, setAlternativeKeys] = useState<KeyPrediction[]>([]);
  const [chromagram, setChromagram] = useState<number[]>(new Array(12).fill(0));
  const [bpm, setBpm] = useState<number | null>(null);
  const [isBeat, setIsBeat] = useState(false);
  const [manualBpm, setManualBpm] = useState<number>(0);
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio nodes and context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Trackers
  const bpmTrackerRef = useRef<BpmTracker>(new BpmTracker());
  
  // Chromagram smoothing (exponential moving average)
  const smoothedChromaRef = useRef<number[]>(new Array(12).fill(0));
  const smoothingFactor = 0.97; // High value for slow, stable key detection (takes 2-3 seconds to adjust)

  // Precalculated mapping from FFT bin to pitch class
  const binToPitchClassRef = useRef<number[]>([]);
  const fftSize = 4096;

  // Initialize the bin-to-pitch-class lookup table
  const initBinMapping = (sampleRate: number) => {
    const mapping: number[] = [];
    const binCount = fftSize / 2;
    const binSize = sampleRate / fftSize;

    // We only analyze MIDI notes 30 (F#1, ~46Hz) to 88 (E5, ~659Hz)
    // This captures instrument fundamentals and filters out high-frequency overtones and room noise
    const minMidi = 30;
    const maxMidi = 88;

    for (let i = 0; i < binCount; i++) {
      const freq = i * binSize;
      if (freq <= 0) {
        mapping.push(-1);
        continue;
      }

      // Convert frequency to fractional MIDI note
      const midi = 12 * Math.log2(freq / 440) + 69;
      const note = Math.round(midi);

      if (note >= minMidi && note <= maxMidi) {
        const pitchClass = ((note % 12) + 12) % 12;
        mapping.push(pitchClass);
      } else {
        mapping.push(-1);
      }
    }
    binToPitchClassRef.current = mapping;
  };

  // Main processing loop running at frame rate
  const processAudio = useCallback(() => {
    const analyser = analyserNodeRef.current;
    const audioContext = audioContextRef.current;
    if (!analyser || !audioContext) return;

    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Float32Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    // Get FFT and time domain data
    analyser.getFloatFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(timeData);

    // 1. Calculate current input level (0 to 100) for UI meter
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const level = Math.min(100, Math.round(Math.sqrt(rms) * 140)); // High-sensitivity square root scaling
    setInputLevel(level);

    // Only process key and bpm if there is some sound input (threshold check)
    if (rms > 0.005) {
      // 2. Extract raw chromagram from FFT data
      const rawChroma = new Array(12).fill(0);
      const binToPitchClass = binToPitchClassRef.current;

      for (let i = 0; i < frequencyData.length; i++) {
        const pitchClass = binToPitchClass[i];
        if (pitchClass !== -1) {
          // Convert dB to linear amplitude
          const db = frequencyData[i];
          if (db > -90) { // Only count signals above noise floor
            const linearMag = Math.pow(10, db / 20);
            rawChroma[pitchClass] += linearMag;
          }
        }
      }

      // Apply exponential moving average (smoothing) to chromagram
      const smoothedChroma = smoothedChromaRef.current;
      for (let i = 0; i < 12; i++) {
        smoothedChroma[i] = (smoothedChroma[i] * smoothingFactor) + (rawChroma[i] * (1 - smoothingFactor));
      }

      // Normalize smoothed chromagram for UI rendering (0 to 1 scale)
      const maxChroma = Math.max(...smoothedChroma);
      const normalizedChroma = smoothedChroma.map(val => maxChroma > 0 ? val / maxChroma : 0);
      setChromagram(normalizedChroma);

      // 3. Find the musical key using Krumhansl-Schmuckler correlation
      const keyResults = findKey(smoothedChroma);
      if (keyResults.length > 0) {
        const topMatch = keyResults[0];
        // Only set key if correlation (confidence) is reasonably positive
        if (topMatch.correlation > 0.3) {
          setDetectedKey(topMatch.keyName);
          // Scale correlation (usually 0.4 to 0.8) to a percentage (0 to 100)
          const confPercent = Math.min(100, Math.max(0, Math.round((topMatch.correlation - 0.2) * 166)));
          setConfidence(confPercent);
          setAlternativeKeys(keyResults.slice(1, 5)); // Next 4 keys
        } else {
          // If correlation is too low, don't change detected key, but lower confidence
          setConfidence(prev => Math.max(0, prev - 1));
        }
      }

      // 4. Track BPM using low frequency onset detection
      const bpmTracker = bpmTrackerRef.current;
      const sampleRate = audioContext.sampleRate;
      const didBeat = bpmTracker.processFrame(frequencyData, sampleRate, fftSize);
      
      if (didBeat) {
        setIsBeat(true);
        // Turn off flash in the next frame
        setTimeout(() => setIsBeat(false), 80);
      }

      const calculatedBpm = bpmTracker.calculateBpm();
      if (calculatedBpm !== null) {
        setBpm(calculatedBpm);
      }
    } else {
      // Decay chromagram slowly in silence
      const smoothedChroma = smoothedChromaRef.current;
      for (let i = 0; i < 12; i++) {
        smoothedChroma[i] *= 0.95;
      }
      const maxChroma = Math.max(...smoothedChroma);
      const normalizedChroma = smoothedChroma.map(val => maxChroma > 0 ? val / maxChroma : 0);
      setChromagram(normalizedChroma);
      
      // Decay confidence slowly in silence
      setConfidence(prev => Math.max(0, prev - 2));
    }

    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, []);

  // Request mic permissions and build Web Audio node graph
  const startMonitoring = async () => {
    setErrorMsg(null);
    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Capture mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false, // Turn off so we get natural music frequencies
          autoGainControl: false,
        }
      });

      streamRef.current = stream;
      initBinMapping(ctx.sampleRate);

      // Connect nodes: Mic -> Analyser
      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.4;
      analyserNodeRef.current = analyser;

      source.connect(analyser);

      // Clear previous states
      smoothedChromaRef.current = new Array(12).fill(0);
      setChromagram(new Array(12).fill(0));
      setDetectedKey(null);
      setConfidence(0);
      setBpm(null);
      bpmTrackerRef.current.reset();

      setIsMonitoring(true);
      
      // Start processing loop
      animationFrameRef.current = requestAnimationFrame(processAudio);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setErrorMsg(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in your settings.'
          : 'Failed to load audio input device. Please check your device.'
      );
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = useCallback(() => {
    // Stop animation loop
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop mic stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect audio nodes
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    analyserNodeRef.current = null;
    setIsMonitoring(false);
    setInputLevel(0);
  }, []);

  // Manual Tap Tempo function
  const tapTempo = useCallback(() => {
    const calculatedBpm = bpmTrackerRef.current.tap();
    if (calculatedBpm > 0) {
      setManualBpm(calculatedBpm);
    }
  }, []);

  // Reset BPM tracker state
  const resetBpm = useCallback(() => {
    bpmTrackerRef.current.reset();
    setBpm(null);
    setManualBpm(0);
  }, []);

  // Audio Context getter for metronome
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    return audioContextRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    detectedKey,
    confidence,
    alternativeKeys,
    chromagram,
    bpm,
    isBeat,
    manualBpm,
    tapTempo,
    resetBpm,
    inputLevel,
    errorMsg,
    getAudioContext,
  };
}
