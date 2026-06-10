// Krumhansl-Schmuckler Key Finding Algorithm for Chromagram correlation.

// Sha'ath empirical key profiles (optimized for pop music key finding)
const K_K_MAJOR = [6.58, 1.34, 3.40, 1.15, 5.48, 3.73, 1.37, 5.92, 1.45, 3.82, 1.10, 3.01];
const K_K_MINOR = [6.45, 1.63, 2.76, 5.25, 1.57, 3.80, 1.45, 5.27, 3.82, 1.64, 3.42, 2.94];

// Note names
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface KeyPrediction {
  keyName: string;
  root: number;        // 0 to 11
  isMajor: boolean;
  correlation: number;
}

// Calculate Pearson Correlation Coefficient between two 12-dimensional arrays
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = 12;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

// Rotate array to the right by shift amount
function rotateProfile(profile: number[], shift: number): number[] {
  const rotated = new Array(12);
  for (let i = 0; i < 12; i++) {
    rotated[(i + shift) % 12] = profile[i];
  }
  return rotated;
}

// Finds the most likely keys sorted by correlation
export function findKey(chromagram: number[]): KeyPrediction[] {
  const predictions: KeyPrediction[] = [];

  // Check all 24 possible keys
  for (let root = 0; root < 12; root++) {
    // Major Key
    const majorProfile = rotateProfile(K_K_MAJOR, root);
    const majorCorr = pearsonCorrelation(chromagram, majorProfile);
    predictions.push({
      keyName: `${NOTE_NAMES[root]} Major`,
      root,
      isMajor: true,
      correlation: majorCorr,
    });

    // Minor Key
    const minorProfile = rotateProfile(K_K_MINOR, root);
    const minorCorr = pearsonCorrelation(chromagram, minorProfile);
    predictions.push({
      keyName: `${NOTE_NAMES[root]} Minor`,
      root,
      isMajor: false,
      correlation: minorCorr,
    });
  }

  // Sort by correlation descending
  return predictions.sort((a, b) => b.correlation - a.correlation);
}

// Returns the relative key (e.g. C Major -> A Minor, A Minor -> C Major)
export function getRelativeKey(root: number, isMajor: boolean): string {
  if (isMajor) {
    // Relative minor is 3 semitones down (or 9 up)
    const relRoot = (root + 9) % 12;
    return `${NOTE_NAMES[relRoot]} Minor`;
  } else {
    // Relative major is 3 semitones up
    const relRoot = (root + 3) % 12;
    return `${NOTE_NAMES[relRoot]} Major`;
  }
}

// Returns the parallel key (e.g. C Major -> C Minor)
export function getParallelKey(root: number, isMajor: boolean): string {
  return `${NOTE_NAMES[root]} ${isMajor ? 'Minor' : 'Major'}`;
}

// Returns subdominant and dominant keys (IV and V)
export function getRelatedKeys(root: number, isMajor: boolean): { subdominant: string; dominant: string } {
  const subdominantRoot = (root + 5) % 12; // IV (5 semitones up)
  const dominantRoot = (root + 7) % 12;    // V (7 semitones up)
  const mode = isMajor ? 'Major' : 'Minor';
  return {
    subdominant: `${NOTE_NAMES[subdominantRoot]} ${mode}`,
    dominant: `${NOTE_NAMES[dominantRoot]} ${mode}`,
  };
}
