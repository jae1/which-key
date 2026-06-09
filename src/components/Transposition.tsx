import { useState } from 'react';
import { NOTE_NAMES } from '../utils/KeyFinder';

interface TranspositionProps {
  detectedKey: string | null;
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
  const [targetKeyIndex, setTargetKeyIndex] = useState<number>(0); // Index in NOTE_NAMES (0=C)
  const [targetMode, setTargetMode] = useState<boolean>(true); // true = Major, false = Minor

  // Parse detected key details
  let detectedRoot = -1;
  let detectedIsMajor = true;

  if (detectedKey) {
    const parts = detectedKey.split(' ');
    const note = parts[0];
    detectedIsMajor = parts[1] === 'Major';
    detectedRoot = NOTE_NAMES.indexOf(note);
  }

  // Chords for detected key
  const detectedChords = detectedRoot !== -1 
    ? getDiatonicChords(detectedRoot, detectedIsMajor) 
    : [];

  // Chords for target key
  const targetChords = getDiatonicChords(targetKeyIndex, targetMode);

  // Calculate interval difference in semitones
  let semitoneDiff = 0;
  if (detectedRoot !== -1) {
    semitoneDiff = (targetKeyIndex - detectedRoot + 12) % 12;
    if (semitoneDiff > 6) {
      semitoneDiff -= 12; // e.g. instead of +10, show -2 semitones
    }
  }

  // Helper to get chord matrix for 12 keys
  const getMatrixRows = () => {
    // Generate rows for all 12 roots in the same mode (Major or Minor) as detected key
    const mode = detectedRoot !== -1 ? detectedIsMajor : true;
    return NOTE_NAMES.map((_, index) => {
      const chords = getDiatonicChords(index, mode);
      const keyName = `${NOTE_NAMES[index]} ${mode ? 'Major' : 'Minor'}`;
      const isCurrent = detectedRoot === index && detectedIsMajor === mode;
      return {
        keyName,
        chords,
        isCurrent
      };
    });
  };

  const matrixRows = getMatrixRows();
  const matrixDegrees = (detectedRoot !== -1 ? detectedIsMajor : true) 
    ? CHORD_DEGREES_MAJOR 
    : CHORD_DEGREES_MINOR;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>찬양팀 조바꿈 (Transposition)</h3>
        
        {/* Toggle tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(128,128,128,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('target')}
            className={`tab-btn ${activeTab === 'target' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
          >
            목표 키 변환
          </button>
          <button 
            onClick={() => setActiveTab('matrix')}
            className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
          >
            12키 코드 매트릭스
          </button>
        </div>
      </div>

      {!detectedKey ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '13px' }}>
          실시간 키가 감지되면 조바꿈 코드 정보가 자동으로 활성화됩니다.
        </p>
      ) : (
        <div>
          {/* TAB 1: Target Key Transposer */}
          {activeTab === 'target' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Select Target Key controls */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(128,128,128,0.01)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>목표 키 선택:</span>
                  <select 
                    value={targetKeyIndex} 
                    onChange={(e) => setTargetKeyIndex(Number(e.target.value))} 
                    className="select-input"
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    {NOTE_NAMES.map((note, idx) => (
                      <option key={idx} value={idx}>{note}</option>
                    ))}
                  </select>
                  <select
                    value={targetMode ? 'Major' : 'Minor'}
                    onChange={(e) => setTargetMode(e.target.value === 'Major')}
                    className="select-input"
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
                
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  이조 차이:{' '}
                  <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                    {semitoneDiff === 0 ? '같음' : semitoneDiff > 0 ? `+${semitoneDiff} 키` : `${semitoneDiff} 키`}
                  </span>
                </div>
              </div>

              {/* Transposition chord layout comparison */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Original Chords */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                      현재 감지된 키 ({detectedKey})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {detectedChords.map((c, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px' }}>
                          <span style={{ width: '30px', fontWeight: 600, color: 'var(--text-muted)' }}>{c.degree}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.chord}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Target Chords */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                      변환할 목표 키 ({NOTE_NAMES[targetKeyIndex]} {targetMode ? 'Major' : 'Minor'})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {targetChords.map((c, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyItems: 'center', padding: '6px 10px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '13px' }}>
                          <span style={{ width: '30px', fontWeight: 600, color: 'var(--primary)' }}>{c.degree}</span>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.chord}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 12-Key Code Matrix Table */}
          {activeTab === 'matrix' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowX: 'auto' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                * 감지된 스케일 모드({detectedIsMajor ? 'Major' : 'Minor'}) 기준으로 모든 12개 키의 화성 코드를 표시합니다.
              </span>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', minWidth: '480px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Key</th>
                    {matrixDegrees.map((deg, idx) => (
                      <th key={idx} style={{ padding: '8px', fontWeight: 600 }}>{deg}</th>
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
                      <td style={{ padding: '8px', textAlign: 'left', color: row.isCurrent ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {row.keyName}
                      </td>
                      {row.chords.map((c, cIdx) => (
                        <td key={cIdx} style={{ padding: '8px', color: row.isCurrent ? 'var(--primary)' : 'var(--text-secondary)' }}>
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
      )}
    </div>
  );
}
