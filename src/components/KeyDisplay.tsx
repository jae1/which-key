import { useState } from 'react';
import { getRelativeKey, getParallelKey, getRelatedKeys } from '../utils/KeyFinder';

interface KeyDisplayProps {
  detectedKey: string | null;
  detectedChord: string | null;
  confidence: number;
  isMonitoring: boolean;
  inputLevel: number;
  onStartMonitoring?: () => void;
  onStopMonitoring?: () => void;
  hideHeader?: boolean;
  isAnalyzingSong?: boolean;
  analysisSecondsElapsed?: number;
  onStartSongAnalysis?: (duration: number) => void;
}

export function KeyDisplay({ 
  detectedKey, 
  detectedChord,
  confidence, 
  isMonitoring, 
  inputLevel,
  onStartMonitoring, 
  onStopMonitoring,
  isAnalyzingSong = false,
  analysisSecondsElapsed = 0,
  onStartSongAnalysis
}: KeyDisplayProps) {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'live'>('analyzer');

  // Parse detected key details if available
  let root = 0;
  let isMajor = true;
  let keyName = '';

  if (detectedKey && detectedKey !== 'No Key Detected') {
    const parts = detectedKey.split(' ');
    keyName = detectedKey;
    const note = parts[0];
    isMajor = parts[1] === 'Major';
    
    // Simple lookup for root pitch index
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    root = noteNames.indexOf(note);
    if (root === -1) root = 0;
  }

  const relativeKey = detectedKey && detectedKey !== 'No Key Detected' ? getRelativeKey(root, isMajor) : '';
  const parallelKey = detectedKey && detectedKey !== 'No Key Detected' ? getParallelKey(root, isMajor) : '';
  const { subdominant, dominant } = detectedKey && detectedKey !== 'No Key Detected' ? getRelatedKeys(root, isMajor) : { subdominant: '', dominant: '' };

  const renderMicLevel = () => {
    return (
      <div style={{ width: '100%', margin: '4px 0 6px', opacity: (isMonitoring || isAnalyzingSong) ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Mic Level</span>
          <span>{(isMonitoring || isAnalyzingSong) ? `${inputLevel}%` : 'Idle'}</span>
        </div>
        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div 
            style={{ 
              width: (isMonitoring || isAnalyzingSong) ? `${inputLevel}%` : '0%', 
              height: '100%', 
              background: 'var(--primary)',
              borderRadius: '2px',
              transition: 'width 0.1s ease'
            }} 
          />
        </div>
      </div>
    );
  };

  const renderModeTabs = () => {
    return (
      <div style={{ display: 'flex', background: 'var(--border-color)', padding: '2px', borderRadius: '6px', marginBottom: '8px' }}>
        <button 
          onClick={() => {
            if (isMonitoring || isAnalyzingSong) onStopMonitoring?.();
            setActiveTab('analyzer');
          }}
          style={{
            flex: 1,
            padding: '4px 0',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            background: activeTab === 'analyzer' ? 'var(--panel-bg)' : 'transparent',
            color: activeTab === 'analyzer' ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          🎵 Song Analyzer
        </button>
        <button 
          onClick={() => {
            if (isMonitoring || isAnalyzingSong) onStopMonitoring?.();
            setActiveTab('live');
          }}
          style={{
            flex: 1,
            padding: '4px 0',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            background: activeTab === 'live' ? 'var(--panel-bg)' : 'transparent',
            color: activeTab === 'live' ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          ⚡ Live Monitor
        </button>
      </div>
    );
  };

  // Render content depending on selected mode
  const renderContent = () => {
    if (activeTab === 'analyzer') {
      // SONG ANALYZER MODE
      if (isAnalyzingSong) {
        // STATE 1: Analyzing in progress
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '208px', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center' }}>
              <div className="loader-spin" style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '2px solid var(--border-color)',
                borderTopColor: 'var(--primary)',
                marginBottom: '8px'
              }} />
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '13px' }}>Listening...</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Analyzing spectrum (auto-locks when stable)
              </p>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--primary-glow)',
                padding: '4px 14px',
                borderRadius: '20px',
                border: '1px solid var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary)' }} />
                <span>Listening: <strong>{analysisSecondsElapsed}s</strong></span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: 'auto' }}>
              {renderMicLevel()}
              <button
                onClick={onStopMonitoring}
                className="btn-danger"
                style={{ width: '100%', padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', height: '36px' }}
              >
                Cancel Analysis
              </button>
            </div>
          </div>
        );
      }

      if (detectedKey) {
        // STATE 2: Analysis Complete & Locked
        const isFailed = detectedKey === 'No Key Detected';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '208px', width: '100%', gap: '6px' }}>
            <div style={{ textAlign: 'center', padding: '1px 0' }}>
              <span style={{ 
                fontSize: '8px', 
                fontWeight: 700, 
                color: isFailed ? 'var(--text-muted)' : 'var(--primary)', 
                background: isFailed ? 'rgba(128,128,128,0.1)' : 'var(--primary-glow)',
                border: '1px solid ' + (isFailed ? 'var(--border-color)' : 'var(--primary)'),
                padding: '2px 8px',
                borderRadius: '10px',
                letterSpacing: '0.5px' 
              }}>
                {isFailed ? '⚠️ ANALYSIS COMPLETE' : '🔒 ANALYSIS COMPLETE (LOCKED)'}
              </span>
              <div style={{ 
                fontSize: isFailed ? '20px' : '24px', 
                fontWeight: 800, 
                color: isFailed ? 'var(--text-secondary)' : 'var(--text-primary)', 
                fontFamily: 'Outfit, var(--font-sans)', 
                margin: '4px 0 2px', 
                lineHeight: 1.1 
              }}>{isFailed ? 'No Key Detected' : keyName}</div>
              
              {!isFailed && (
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Confidence: <strong style={{ color: 'var(--primary)' }}>{confidence}%</strong>
                </div>
              )}
            </div>

            {isFailed ? (
              <div style={{ 
                flexGrow: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                textAlign: 'center', 
                padding: '0 8px', 
                fontSize: '11px', 
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                The audio was too quiet or lacked clear musical notes. Please play louder or closer to the microphone.
              </div>
            ) : (
              /* Key Relationship Cards */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Relative Key</span>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)' }}>{relativeKey}</div>
                </div>
                <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Parallel Key</span>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{parallelKey}</div>
                </div>
                <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Subdominant (IV)</span>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{subdominant}</div>
                </div>
                <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Dominant (V)</span>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{dominant}</div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: 'auto' }}>
              <button
                onClick={() => onStartSongAnalysis?.(15)}
                className="btn-primary"
                style={{ width: '100%', padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', height: '36px' }}
              >
                {isFailed ? 'Try Again' : 'Analyze New Song'}
              </button>
            </div>
          </div>
        );
      }

      // STATE 3: Idle waiting to analyze
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '208px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '4px 0' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '6px',
              border: '1px solid var(--panel-border)'
            }}>
              🎵
            </div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '13px' }}>Song Analyzer Mode</h4>
            <p style={{ fontSize: '11px', maxWidth: '240px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
              Locks the overall key and BPM of the song. Automatically stops listening once resolved.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: 'auto' }}>
            {renderMicLevel()}
            <button
              onClick={() => onStartSongAnalysis?.(15)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                height: '36px',
                boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.15)'
              }}
            >
              Analyze Song Key & BPM
            </button>
          </div>
        </div>
      );
    } else {
      // LIVE MONITOR MODE
      if (!detectedKey && !isMonitoring) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '208px', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '4px 0' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '6px',
                border: '1px solid var(--panel-border)'
              }}>
                ⚡
              </div>
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '13px' }}>Live Monitor Mode</h4>
              <p style={{ fontSize: '11px', maxWidth: '240px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                Tracks key and chord changes continuously in real-time.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: 'auto' }}>
              {renderMicLevel()}
              <button
                onClick={onStartMonitoring}
                className="btn-primary"
                style={{ width: '100%', padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', height: '36px' }}
              >
                Start Live Monitor
              </button>
            </div>
          </div>
        );
      }

      if (isMonitoring && !detectedKey) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '208px', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center' }}>
              <div className="loader-spin" style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid var(--border-color)',
                borderTopColor: 'var(--primary)',
                marginBottom: '8px'
              }} />
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '13px' }}>Listening...</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Play instruments to detect live pitches.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: 'auto' }}>
              {renderMicLevel()}
              <button
                onClick={onStopMonitoring}
                className="btn-danger"
                style={{ width: '100%', padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', height: '36px' }}
              >
                Stop Live Monitor
              </button>
            </div>
          </div>
        );
      }

      // Live key detected
      const isFailed = detectedKey === 'No Key Detected';

      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '208px', width: '100%', gap: '4px' }}>
          <div style={{ textAlign: 'center', padding: '1px 0' }}>
            <span style={{ 
              fontSize: '8px', 
              fontWeight: 700, 
              color: isMonitoring ? 'var(--primary)' : 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px' 
            }}>
              {isMonitoring ? 'LIVE DETECTED KEY' : 'LAST DETECTED KEY (HOLD)'}
            </span>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              fontFamily: 'Outfit, var(--font-sans)', 
              margin: '2px 0 0', 
              lineHeight: 1.1 
            }}>{detectedKey}</div>
            
            {/* Confidence Progress Bar */}
            {!isFailed && (
              <div style={{ maxWidth: '160px', margin: '2px auto 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '2px', fontWeight: 500 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Confidence</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{confidence}%</span>
                </div>
                <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--border-color)', borderRadius: '1.5px', overflow: 'hidden' }}>
                  <div style={{ width: `${confidence}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '1.5px' }} />
                </div>
              </div>
            )}

            {/* Small Live Chord Indicator */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              fontSize: '10px', 
              fontWeight: 600, 
              color: isMonitoring ? 'var(--text-secondary)' : 'var(--text-muted)',
              background: 'var(--border-color)',
              padding: '1px 6px',
              borderRadius: '10px',
              marginTop: '1px'
            }}>
              {isMonitoring && <span className="pulse-dot" style={{ width: '3px', height: '3px', backgroundColor: 'var(--primary)' }} />}
              <span>Live Chord: <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{detectedChord || (isMonitoring ? '...' : 'None')}</strong></span>
            </div>
          </div>

          {/* Key Relationship Cards */}
          {!isFailed && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Relative Key</span>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)' }}>{relativeKey}</div>
              </div>
              <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Parallel Key</span>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{parallelKey}</div>
              </div>
              <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Subdominant (IV)</span>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{subdominant}</div>
              </div>
              <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Dominant (V)</span>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{dominant}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: 'auto' }}>
            {renderMicLevel()}
            {isMonitoring ? (
              <button
                onClick={onStopMonitoring}
                className="btn-danger"
                style={{ width: '100%', padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', height: '36px' }}
              >
                Stop Live Monitor
              </button>
            ) : (
              <button
                onClick={onStartMonitoring}
                className="btn-primary"
                style={{ width: '100%', padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', height: '36px' }}
              >
                Start New Monitor
              </button>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '248px', width: '100%', padding: '2px 0' }}>
      {renderModeTabs()}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {renderContent()}
      </div>
    </div>
  );
}
