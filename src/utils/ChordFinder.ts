import { NOTE_NAMES } from './KeyFinder';

export interface ChordPrediction {
  chordName: string;
  score: number;
}

export interface ChordTemplate {
  nameSuffix: string;
  intervals: number[];
  multiplier: number; // Multiplier to favor simpler triads over complex ones when energy matches
}

const CHORD_TEMPLATES: ChordTemplate[] = [
  { nameSuffix: '', intervals: [0, 4, 7], multiplier: 1.0 },         // Major (e.g. C)
  { nameSuffix: 'm', intervals: [0, 3, 7], multiplier: 1.0 },        // Minor (e.g. Cm)
  { nameSuffix: '7', intervals: [0, 4, 7, 10], multiplier: 0.92 },    // Dominant 7th (e.g. C7)
  { nameSuffix: 'maj7', intervals: [0, 4, 7, 11], multiplier: 0.90 },  // Major 7th (e.g. Cmaj7)
  { nameSuffix: 'm7', intervals: [0, 3, 7, 10], multiplier: 0.90 },   // Minor 7th (e.g. Cm7)
  { nameSuffix: 'sus4', intervals: [0, 5, 7], multiplier: 0.95 },    // Sus4 (e.g. Csus4)
  { nameSuffix: 'sus2', intervals: [0, 2, 7], multiplier: 0.95 },    // Sus2 (e.g. Csus2)
  { nameSuffix: 'dim', intervals: [0, 3, 6], multiplier: 0.85 },     // Diminished (e.g. Cdim)
  { nameSuffix: 'aug', intervals: [0, 4, 8], multiplier: 0.85 },     // Augmented (e.g. Caug)
];

// Helper to compute cosine similarity between two 12-dimensional vectors
function cosineSimilarity(x: number[], y: number[]): number {
  let dotProduct = 0;
  let normX = 0;
  let normY = 0;

  for (let i = 0; i < 12; i++) {
    dotProduct += x[i] * y[i];
    normX += x[i] * x[i];
    normY += y[i] * y[i];
  }

  if (normX === 0 || normY === 0) return 0;
  return dotProduct / Math.sqrt(normX * normY);
}

// Find the best matching chord for the given chromagram
export function findChord(chromagram: number[]): ChordPrediction | null {
  // Check if there is enough energy in the chromagram
  const sum = chromagram.reduce((a, b) => a + b, 0);
  if (sum < 0.05) {
    return null;
  }

  let bestChordName = '';
  let bestScore = -1;

  // Search through all 12 roots and all templates
  for (let root = 0; root < 12; root++) {
    const rootName = NOTE_NAMES[root];

    for (const temp of CHORD_TEMPLATES) {
      // Build binary template vector for this root + chord intervals
      const templateVector = new Array(12).fill(0);
      for (const interval of temp.intervals) {
        templateVector[(root + interval) % 12] = 1;
      }

      // Calculate similarity
      const similarity = cosineSimilarity(chromagram, templateVector);
      const score = similarity * temp.multiplier;

      if (score > bestScore) {
        bestScore = score;
        bestChordName = `${rootName}${temp.nameSuffix}`;
      }
    }
  }

  // Only return if the score is reasonably high to filter out ambient noise / single notes
  // Cosine similarity for a single note matching a major triad template is about 1/sqrt(3) ≈ 0.577.
  // So a threshold of 0.62 ensures at least some harmonic overlap beyond a single note.
  if (bestScore > 0.62) {
    return {
      chordName: bestChordName,
      score: bestScore
    };
  }

  return null;
}
