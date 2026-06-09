import { useState, useEffect } from 'react';

interface BpmDisplayProps {
  bpm: number | null;
  isBeat: boolean;
  manualBpm: number;
  tapTempo: () => void;
  resetBpm: () => void;
  isMonitoring: boolean;
  hideHeader?: boolean;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', height: '100%' }}>
      {/* Small top utility bar for resetting - fixed height to prevent layout shifts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', height: '24px', marginBottom: '4px' }}>
        {(bpm || manualBpm > 0) && (
          <button 
            onClick={resetBpm} 
            className="btn-secondary" 
            style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px' }}
          >
            Reset
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexGrow: 1, alignItems: 'center', marginBottom: '8px' }}>
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
            {bpm ? bpm : '--'}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {isMonitoring ? 'Auto Beat Detection' : bpm ? 'Last Detected' : 'Idle'}
          </span>
        </div>

        {/* Manual Tap BPM - Clickable Card for Tap Tempo */}
        <div 
          onClick={tapTempo}
          className="tap-card"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: manualBpm > 0 ? 'var(--primary-glow)' : 'rgba(128,128,128,0.01)', 
            border: manualBpm > 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)', 
            borderRadius: '8px',
            padding: '16px 8px',
            height: '100%',
            textAlign: 'center'
          }}
          title="Click or tap this card to set tempo manually"
        >
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
          <span style={{ fontSize: '10px', color: manualBpm > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 500 }}>
            {manualBpm > 0 ? 'Tapped BPM' : 'Click/Tap Here'}
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
              backgroundColor: bpm ? 'var(--secondary)' : 'var(--text-muted)'
            }} 
          />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isMonitoring && bpm ? 'Tempo tracking active' : 'Tap the card or button to the beat'}
          </span>
        </div>

        <button
          onClick={tapTempo}
          className="btn-primary"
          style={{ 
            padding: '14px', 
            fontSize: '15px', 
            fontWeight: 'bold',
            borderRadius: '8px',
            background: 'var(--primary)',
            boxShadow: '0 4px 10px rgba(var(--primary-rgb), 0.12)'
          }}
        >
          TAP TEMPO
        </button>
      </div>
    </div>
  );
}
