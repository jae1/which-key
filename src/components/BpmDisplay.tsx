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
  // Use state to trigger beat pulse class in React
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
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>템포 감지 (BPM & Tap)</h3>
        {/* Reset button */}
        {(bpm || manualBpm > 0) && (
          <button 
            onClick={resetBpm} 
            className="btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
          >
            초기화
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexGrow: 1, alignItems: 'center', marginBottom: '16px' }}>
        {/* Live Auto BPM */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(128,128,128,0.01)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px',
          padding: '20px 10px',
          height: '100%',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            AUTO DETECT
          </span>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 800, 
            color: bpm ? 'var(--secondary)' : 'var(--text-secondary)',
            margin: '8px 0',
            lineHeight: 1
          }}>
            {isMonitoring && bpm ? bpm : '--'}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {isMonitoring ? '실시간 비트 분석 중' : '시작 시 자동 작동'}
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
          borderRadius: '12px',
          padding: '20px 10px',
          height: '100%',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: manualBpm > 0 ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TAP TEMPO
          </span>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 800, 
            color: manualBpm > 0 ? 'var(--primary)' : 'var(--text-secondary)',
            margin: '8px 0',
            lineHeight: 1
          }}>
            {manualBpm > 0 ? manualBpm : '--'}
          </div>
          <span style={{ fontSize: '11px', color: manualBpm > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: manualBpm > 0 ? 500 : 400 }}>
            {manualBpm > 0 ? '탭핑된 템포 적용' : '수동 탭 템포'}
          </span>
        </div>
      </div>

      {/* Action panel (Pulse & Tap Button) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Flash Indicator and beat status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '8px', borderRadius: '10px', background: 'rgba(128,128,128,0.02)', border: '1px solid var(--border-color)' }}>
          <div 
            className={pulse ? 'beat-pulse' : ''} 
            style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              backgroundColor: isMonitoring && bpm ? 'var(--secondary)' : 'var(--text-muted)',
              transition: 'background-color 0.2s'
            }} 
          />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {isMonitoring && bpm ? '음악 템포 동기화 완료' : '박자에 맞춰 아래 버튼을 누르세요'}
          </span>
        </div>

        {/* Tap Button */}
        <button
          onClick={tapTempo}
          className="btn-primary"
          style={{ 
            padding: '16px', 
            fontSize: '18px', 
            borderRadius: '12px',
            background: 'linear-gradient(to right, var(--primary), var(--secondary))',
            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateY(-1px)' }}>
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/>
            <path d="M9 3a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/>
          </svg>
          TAP TEMPO (여기를 클릭)
        </button>
      </div>
    </div>
  );
}
