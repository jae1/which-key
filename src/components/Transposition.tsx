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

export function Transposition({ detectedKey }: TranspositionProps) {
  const [activeTab, setActiveTab] = useState<'target' | 'matrix'>('target');
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
                실시간 분석 중
              </>
            ) : (
              '수동 변환 모드'
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
            목표 키 변환
          </button>
          <button 
            onClick={() => setActiveTab('matrix')}
            className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
          >
            12키 매트릭스
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
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>기준 키 (Source):</span>
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
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>목표 키 (Target):</span>
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
                <span>이조 차이 (Interval Diff)</span>
                <span style={{ fontWeight: 700, color: semitoneDiff === 0 ? 'var(--text-secondary)' : 'var(--secondary)' }}>
                  {semitoneDiff === 0 ? '동일 키' : semitoneDiff > 0 ? `+${semitoneDiff} 반음 (Up)` : `${semitoneDiff} 반음 (Down)`}
                </span>
              </div>
            </div>

            {/* Transposition chord layout comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Original Chords */}
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  기준 키 ({NOTE_NAMES[sourceRoot]} {sourceIsMajor ? 'maj' : 'min'})
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
                  목표 키 ({NOTE_NAMES[targetKeyIndex]} {targetMode ? 'maj' : 'min'})
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
              * {sourceIsMajor ? 'Major' : 'Minor'} 스케일 모드 기준 12개 키 화성 표
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
      </div>
    </div>
  );
}
