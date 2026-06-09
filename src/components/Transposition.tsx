import { useState } from 'react';
import { NOTE_NAMES } from '../utils/KeyFinder';

interface TranspositionProps {
  detectedKey: string | null;
  hideHeader?: boolean;
}

// Diatonic scales and chord definitions
const CHORD_DEGREES_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const CHORD_DEGREES_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

// Semitone intervals relative to root
const INTERVALS_MAJOR = [0, 2, 4, 5, 7, 9, 11];
const INTERVALS_MINOR = [0, 2, 3, 5, 7, 8, 10];

// Mode/suffix of chords in Major Scale
const SUFFIX_MAJOR = ['', 'm', 'm', '', '', 'm', 'dim'];
// Mode/suffix of chords in Minor Scale
const SUFFIX_MINOR = ['m', 'dim', '', 'm', 'm', '', ''];

function getDiatonicChords(root: number, isMajor: boolean): { degree: string; chord: string }[] {
  const intervals = isMajor ? INTERVALS_MAJOR : INTERVALS_MINOR;
  const suffixes = isMajor ? SUFFIX_MAJOR : SUFFIX_MINOR;
  const degrees = isMajor ? CHORD_DEGREES_MAJOR : CHORD_DEGREES_MINOR;

  return intervals.map((interval, index) => {
    const chordRootIndex = (root + interval) % 12;
    const chordRoot = NOTE_NAMES[chordRootIndex];
    return {
      degree: degrees[index],
      chord: `${chordRoot}${suffixes[index]}`
    };
  });
}

interface ProgressionItem {
  name: string;
  degrees: string;
  indices: number[];
  description: string;
}

const MAJOR_PROGRESSIONS: ProgressionItem[] = [
  {
    name: 'Pop Money Chords',
    degrees: 'I - V - vi - IV',
    indices: [0, 4, 5, 3],
    description: 'The most popular and uplifting progression, used in over 80% of hit songs worldwide.'
  },
  {
    name: '4-5-3-6 Progression (Emotional / J-Pop)',
    degrees: 'IV - V - iii - vi',
    indices: [3, 4, 2, 5],
    description: 'Frequently used in pop, J-Pop, and anime OSTs to create dramatic tension and nostalgia.'
  },
  {
    name: '2-5-1 Progression (Jazz / City Pop)',
    degrees: 'ii - V - I',
    indices: [1, 4, 0],
    description: 'The most critical progression in Jazz, R&B, and City Pop to elegantly resolve harmonic tension.'
  },
  {
    name: 'Canon Progression (Classic / Pop)',
    degrees: 'I - V - vi - iii - IV - I - IV - V',
    indices: [0, 4, 5, 2, 3, 0, 3, 4],
    description: 'Derived from Pachelbel\'s Canon; extremely smooth, lyrical, and stable.'
  },
  {
    name: '1-6-2-5 Turnaround (Retro / Jazz)',
    degrees: 'I - vi - ii - V',
    indices: [0, 5, 1, 4],
    description: 'Mainly used in retro ballads, classic pop, or repeating sections of Jazz tunes.'
  }
];

const MINOR_PROGRESSIONS: ProgressionItem[] = [
  {
    name: 'Minor Money Chords (Sad Pop)',
    degrees: 'i - VI - III - VII',
    indices: [0, 5, 2, 6],
    description: 'A classic minor progression that carries a dark, epic vibe with a touch of hope.'
  },
  {
    name: 'Minor 2-5-1 Progression (Jazz / R&B)',
    degrees: 'ii° - v - i',
    indices: [1, 4, 0],
    description: 'Essential in minor Jazz and R&B for creating dark, sophisticated moods.'
  },
  {
    name: 'Andalusian Cadence (Latin / Spanish)',
    degrees: 'i - VII - VI - V',
    indices: [0, 6, 5, 4],
    description: 'An exotic, dramatic cadence widely used to create a Spanish or Latin flavor.'
  },
  {
    name: 'Minor Sentimental Progression',
    degrees: 'i - iv - VII - III',
    indices: [0, 3, 6, 2],
    description: 'Evokes a melancholic, lonely mood; fits beautifully in ballad verses.'
  }
];

export function Transposition({ detectedKey }: TranspositionProps) {
  const [activeTab, setActiveTab] = useState<'target' | 'matrix' | 'progressions'>('target');
  const [targetKeyIndex, setTargetKeyIndex] = useState<number>(7); // Default to G (Index 7) for transpose example
  const [targetMode, setTargetMode] = useState<boolean>(true); // true = Major, false = Minor

  // Local state for manual source key when audio analysis is inactive
  const [manualSourceIndex, setManualSourceIndex] = useState<number>(0); // Default C
  const [manualSourceIsMajor, setManualSourceIsMajor] = useState<boolean>(true); // Default Major

  // Parse detected key details if available
  let detectedRoot = -1;
  let detectedIsMajor = true;

  if (detectedKey) {
    const parts = detectedKey.split(' ');
    const note = parts[0];
    detectedIsMajor = parts[1] === 'Major';
    detectedRoot = NOTE_NAMES.indexOf(note);
  }

  // Resolve active source key (use live detected key if available, otherwise use manual source key)
  const isLive = detectedKey !== null;
  const sourceRoot = isLive ? detectedRoot : manualSourceIndex;
  const sourceIsMajor = isLive ? detectedIsMajor : manualSourceIsMajor;
  const sourceKeyName = isLive 
    ? detectedKey 
    : `${NOTE_NAMES[manualSourceIndex]} ${manualSourceIsMajor ? 'Major' : 'Minor'}`;

  // Diatonic chords for active source key
  const sourceChords = getDiatonicChords(sourceRoot, sourceIsMajor);

  // Diatonic chords for target key
  const targetChords = getDiatonicChords(targetKeyIndex, targetMode);

  // Calculate interval difference in semitones
  let semitoneDiff = (targetKeyIndex - sourceRoot + 12) % 12;
  if (semitoneDiff > 6) {
    semitoneDiff -= 12; // e.g. instead of +10, show -2 semitones
  }

  // Helper to get chord matrix for 12 keys
  const getMatrixRows = () => {
    return NOTE_NAMES.map((_, index) => {
      const chords = getDiatonicChords(index, sourceIsMajor);
      const keyName = `${NOTE_NAMES[index]} ${sourceIsMajor ? 'Major' : 'Minor'}`;
      const isCurrent = sourceRoot === index;
      return {
        keyName,
        chords,
        isCurrent
      };
    });
  };

  const matrixRows = getMatrixRows();
  const matrixDegrees = sourceIsMajor ? CHORD_DEGREES_MAJOR : CHORD_DEGREES_MINOR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', height: '100%' }}>
      {/* Tabs / Sub-header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span className={isLive ? 'live-badge' : 'hold-badge'} style={{ fontSize: '9px', padding: '2px 6px' }}>
            {isLive ? (
              <>
                <span className="pulse-dot" />
                Live Analyzing
              </>
            ) : (
              'Manual Mode'
            )}
          </span>
        </div>
        
        {/* Toggle tabs */}
        <div style={{ display: 'flex', gap: '2px', background: 'var(--border-color)', padding: '2px', borderRadius: '6px' }}>
          <button 
            onClick={() => setActiveTab('target')}
            className={`tab-btn ${activeTab === 'target' ? 'active' : ''}`}
            style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
          >
            Target Transpose
          </button>
          <button 
            onClick={() => setActiveTab('matrix')}
            className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
          >
            12-Key Matrix
          </button>
          <button 
            onClick={() => setActiveTab('progressions')}
            className={`tab-btn ${activeTab === 'progressions' ? 'active' : ''}`}
            style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
          >
            Suggested Progressions
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {/* TAB 1: Target Key Transposer */}
        {activeTab === 'target' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Input Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(128,128,128,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              
              {/* Source Key (Disabled if live, enabled if manual) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Source Key:</span>
                {isLive ? (
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>{sourceKeyName}</span>
                ) : (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select 
                      value={manualSourceIndex} 
                      onChange={(e) => setManualSourceIndex(Number(e.target.value))} 
                      className="select-input"
                      style={{ padding: '3px 6px', fontSize: '11px' }}
                    >
                      {NOTE_NAMES.map((note, idx) => (
                        <option key={idx} value={idx}>{note}</option>
                      ))}
                    </select>
                    <select
                      value={manualSourceIsMajor ? 'Major' : 'Minor'}
                      onChange={(e) => setManualSourceIsMajor(e.target.value === 'Major')}
                      className="select-input"
                      style={{ padding: '3px 6px', fontSize: '11px' }}
                    >
                      <option value="Major">Major</option>
                      <option value="Minor">Minor</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Target Key Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Target Key:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <select 
                    value={targetKeyIndex} 
                    onChange={(e) => setTargetKeyIndex(Number(e.target.value))} 
                    className="select-input"
                    style={{ padding: '3px 6px', fontSize: '11px' }}
                  >
                    {NOTE_NAMES.map((note, idx) => (
                      <option key={idx} value={idx}>{note}</option>
                    ))}
                  </select>
                  <select
                    value={targetMode ? 'Major' : 'Minor'}
                    onChange={(e) => setTargetMode(e.target.value === 'Major')}
                    className="select-input"
                    style={{ padding: '3px 6px', fontSize: '11px' }}
                  >
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
              </div>

              {/* Difference readout */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginTop: '2px', color: 'var(--text-muted)' }}>
                <span>Interval Diff</span>
                <span style={{ fontWeight: 700, color: semitoneDiff === 0 ? 'var(--text-secondary)' : 'var(--secondary)' }}>
                  {semitoneDiff === 0 ? 'Same Key' : semitoneDiff > 0 ? `+${semitoneDiff} semitones (Up)` : `${semitoneDiff} semitones (Down)`}
                </span>
              </div>
            </div>

            {/* Transposition chord layout comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Original Chords */}
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  Source Key ({NOTE_NAMES[sourceRoot]} {sourceIsMajor ? 'maj' : 'min'})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {sourceChords.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px' }}>
                      <span style={{ width: '24px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '10px' }}>{c.degree}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.chord}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Chords */}
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--primary)', display: 'block', marginBottom: '6px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  Target Key ({NOTE_NAMES[targetKeyIndex]} {targetMode ? 'maj' : 'min'})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {targetChords.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '12px' }}>
                      <span style={{ width: '24px', fontWeight: 600, color: 'var(--primary)', fontSize: '10px' }}>{c.degree}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.chord}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 12-Key Code Matrix Table */}
        {activeTab === 'matrix' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowX: 'auto' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
              * Diatonic Chord Matrix for 12 Keys in {sourceIsMajor ? 'Major' : 'Minor'} Scale
            </span>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '11px', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600 }}>Key</th>
                  {matrixDegrees.map((deg, idx) => (
                    <th key={idx} style={{ padding: '6px 2px', fontWeight: 600 }}>{deg}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, idx) => (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      background: row.isCurrent ? 'var(--primary-glow)' : 'transparent',
                      fontWeight: row.isCurrent ? 700 : 400,
                      borderLeft: row.isCurrent ? '3px solid var(--primary)' : 'none'
                    }}
                  >
                    <td style={{ padding: '6px 4px', textAlign: 'left', color: row.isCurrent ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {row.keyName.replace(' Major', '').replace(' Minor', row.keyName.includes('Major') ? '' : 'm')}
                    </td>
                    {row.chords.map((c, cIdx) => (
                      <td key={cIdx} style={{ padding: '6px 2px', color: row.isCurrent ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {c.chord}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: Suggested Chord Progressions */}
        {activeTab === 'progressions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
              * Popular chord progressions in the active {sourceIsMajor ? 'Major' : 'Minor'} key.
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {(sourceIsMajor ? MAJOR_PROGRESSIONS : MINOR_PROGRESSIONS).map((prog, idx) => {
                const chordsList = prog.indices.map(i => sourceChords[i]?.chord || '');
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      background: 'rgba(128,128,128,0.01)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{prog.name}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 6px', borderRadius: '4px' }}>
                        {prog.degrees}
                      </span>
                    </div>
                    
                    {/* Chords Flow */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', margin: '2px 0' }}>
                      {chordsList.map((chord, cIdx) => (
                        <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ 
                            background: 'var(--bg-secondary, rgba(128,128,128,0.08))', 
                            color: 'var(--primary)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '6px', 
                            padding: '3px 8px', 
                            fontSize: '12px', 
                            fontWeight: 700 
                          }}>
                            {chord}
                          </span>
                          {cIdx < chordsList.length - 1 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', userSelect: 'none' }}>→</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                      {prog.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
