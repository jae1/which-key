import { getRelativeKey, getParallelKey, getRelatedKeys } from '../utils/KeyFinder';
import type { KeyPrediction } from '../utils/KeyFinder';

interface KeyDisplayProps {
  detectedKey: string | null;
  confidence: number;
  alternativeKeys: KeyPrediction[];
  isMonitoring: boolean;
  onStartMonitoring?: () => void;
  onStopMonitoring?: () => void;
  hideHeader?: boolean;
}

export function KeyDisplay({ 
  detectedKey, 
  confidence, 
  alternativeKeys, 
  isMonitoring, 
  onStartMonitoring, 
  onStopMonitoring 
}: KeyDisplayProps) {
  // Parse detected key details if available
  let root = 0;
  let isMajor = true;
  let keyName = '';

  if (detectedKey) {
    const parts = detectedKey.split(' ');
    keyName = detectedKey;
    const note = parts[0];
    isMajor = parts[1] === 'Major';
    
    // Simple lookup for root pitch index
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    root = noteNames.indexOf(note);
    if (root === -1) root = 0;
  }

  const relativeKey = detectedKey ? getRelativeKey(root, isMajor) : '';
  const parallelKey = detectedKey ? getParallelKey(root, isMajor) : '';
  const { subdominant, dominant } = detectedKey ? getRelatedKeys(root, isMajor) : { subdominant: '', dominant: '' };

  // 1. Idle state (no key detected and not monitoring)
  if (!detectedKey && !isMonitoring) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '12px 0 4px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--primary-glow)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          border: '1px solid var(--panel-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </div>
        <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', fontSize: '15px' }}>오디오 입력 대기 중</h4>
        <p style={{ fontSize: '13px', maxWidth: '280px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
          마이크 권한을 수락하고 분석을 시작하면 주변 기기나 연주 소리를 실시간으로 분석합니다.
        </p>
        <button
          onClick={onStartMonitoring}
          className="btn-primary"
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '8px',
            width: '100%',
            maxWidth: '220px',
            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)'
          }}
        >
          실시간 키 감지 시작
        </button>
      </div>
    );
  }

  // 2. Monitoring started, but no key detected yet
  if (isMonitoring && !detectedKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '40px 20px' }}>
        <div className="loader-spin" style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '2.5px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          marginBottom: '16px'
        }} />
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>음향 신호 대기 중...</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>마이크나 악기 소리를 연주해 보세요.</p>
        <button
          onClick={onStopMonitoring}
          className="btn-secondary"
          style={{
            marginTop: '20px',
            padding: '6px 16px',
            fontSize: '12px',
            borderRadius: '6px'
          }}
        >
          중지
        </button>
      </div>
    );
  }

  // 3. Active key detected (shows real-time results or last-held results)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, gap: '16px' }}>
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <span style={{ 
          fontSize: '10px', 
          fontWeight: 700, 
          color: isMonitoring ? 'var(--primary)' : 'var(--text-muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '1px' 
        }}>
          {isMonitoring ? 'LIVE DETECTED KEY' : 'LAST DETECTED KEY (HOLD)'}
        </span>
        <div className="key-hero" style={{ margin: '12px 0' }}>{keyName}</div>
        
        {/* Confidence Progress Bar */}
        <div style={{ maxWidth: '240px', margin: '0 auto 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px', fontWeight: 500 }}>
            <span style={{ color: 'var(--text-secondary)' }}>신뢰도</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{confidence}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${confidence}%`, 
                height: '100%', 
                backgroundColor: 'var(--primary)',
                borderRadius: '2px',
                transition: 'width 0.4s ease'
              }} 
            />
          </div>
        </div>
      </div>

      {/* Key Relationship Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 10px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>나란한 조 (Relative)</span>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>{relativeKey}</div>
        </div>
        <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 10px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>같은으뜸음조 (Parallel)</span>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{parallelKey}</div>
        </div>
        <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 10px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>버금딸림음 (IV)</span>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{subdominant}</div>
        </div>
        <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 10px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>딸림음 (V)</span>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{dominant}</div>
        </div>
      </div>

      {/* Alternative Candidates */}
      <div>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
          후보 키 (Candidates)
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {alternativeKeys.map((item, idx) => {
            const pct = Math.min(100, Math.max(0, Math.round((item.correlation - 0.2) * 166)));
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '3px 6px', borderRadius: '4px' }}>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{item.keyName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '90px' }}>
                  <div style={{ flexGrow: 1, height: '3px', backgroundColor: 'var(--border-color)', borderRadius: '1.5px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--text-muted)' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '20px', textAlign: 'right' }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action button inside panel */}
      <div style={{ marginTop: '4px' }}>
        {isMonitoring ? (
          <button
            onClick={onStopMonitoring}
            className="btn-danger"
            style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '8px' }}
          >
            분석 중지
          </button>
        ) : (
          <button
            onClick={onStartMonitoring}
            className="btn-primary"
            style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '8px' }}
          >
            새 분석 시작
          </button>
        )}
      </div>
    </div>
  );
}
