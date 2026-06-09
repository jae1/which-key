import { useState, useEffect } from 'react';

interface BpmDisplayProps {
  bpm: number | null;
  isBeat: boolean;
  manualBpm: number;
  tapTempo: () => void;
  resetBpm: () => void;
  isMonitoring: boolean;
}

export function BpmDisplay({ bpm, isBeat, manualBpm, tapTempo, resetBpm, isMonitoring }: BpmDisplayProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isBeat) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isBeat]);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '340px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>템포 (BPM)</h3>
        {(bpm || manualBpm > 0) && (
          <button 
            onClick={resetBpm} 
            className="btn-secondary" 
            style={{ padding: '3px 6px', fontSize: '10px', borderRadius: '4px' }}
          >
            초기화
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexGrow: 1, alignItems: 'center', marginBottom: '16px' }}>
        {/* Live Auto BPM */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(128,128,128,0.01)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px',
          padding: '16px 8px',
          height: '100%',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            AUTO
          </span>
          <div style={{ 
            fontSize: '40px', 
            fontWeight: 700, 
            color: bpm ? 'var(--primary)' : 'var(--text-secondary)',
            margin: '4px 0',
            lineHeight: 1
          }}>
            {isMonitoring && bpm ? bpm : '--'}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {isMonitoring ? '자동 비트 감지' : '대기 중'}
          </span>
        </div>

        {/* Manual Tap BPM */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: manualBpm > 0 ? 'var(--primary-glow)' : 'rgba(128,128,128,0.01)', 
          border: manualBpm > 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)', 
          borderRadius: '8px',
          padding: '16px 8px',
          height: '100%',
          textAlign: 'center',
          transition: 'all 0.15s ease'
        }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: manualBpm > 0 ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TAP
          </span>
          <div style={{ 
            fontSize: '40px', 
            fontWeight: 700, 
            color: manualBpm > 0 ? 'var(--primary)' : 'var(--text-secondary)',
            margin: '4px 0',
            lineHeight: 1
          }}>
            {manualBpm > 0 ? manualBpm : '--'}
          </div>
          <span style={{ fontSize: '10px', color: manualBpm > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
            {manualBpm > 0 ? '탭 입력값' : '수동 입력'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '6px', borderRadius: '6px', background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)' }}>
          <div 
            className={pulse ? 'beat-pulse' : ''} 
            style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: isMonitoring && bpm ? 'var(--secondary)' : 'var(--text-muted)'
            }} 
          />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isMonitoring && bpm ? '템포 감지 작동 중' : '박자에 맞춰 클릭해 템포를 측정하세요'}
          </span>
        </div>

        <button
          onClick={tapTempo}
          className="btn-primary"
          style={{ 
            padding: '12px', 
            fontSize: '15px', 
            borderRadius: '8px',
            background: 'var(--primary)'
          }}
        >
          TAP TEMPO
        </button>
      </div>
    </div>
  );
}
