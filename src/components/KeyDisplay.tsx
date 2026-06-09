import { getRelativeKey, getParallelKey, getRelatedKeys } from '../utils/KeyFinder';
import type { KeyPrediction } from '../utils/KeyFinder';

interface KeyDisplayProps {
  detectedKey: string | null;
  confidence: number;
  alternativeKeys: KeyPrediction[];
  isMonitoring: boolean;
  inputLevel: number;
  onStartMonitoring?: () => void;
  onStopMonitoring?: () => void;
  hideHeader?: boolean;
}

export function KeyDisplay({ 
  detectedKey, 
  confidence, 
  alternativeKeys, 
  isMonitoring, 
  inputLevel,
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

  const renderMicLevel = () => {
    return (
      <div style={{ width: '100%', margin: '4px 0 8px', opacity: isMonitoring ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>마이크 레벨 (Mic Level)</span>
          <span>{isMonitoring ? `${inputLevel}%` : '대기 중'}</span>
        </div>
        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div 
            style={{ 
              width: isMonitoring ? `${inputLevel}%` : '0%', 
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

  // 1. Idle state (no key detected and not monitoring)
  if (!detectedKey && !isMonitoring) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '248px', width: '100%', padding: '2px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '4px 0 0' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '6px',
            border: '1px solid var(--panel-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '13px' }}>오디오 입력 대기 중</h4>
          <p style={{ fontSize: '11px', maxWidth: '240px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: 1.25 }}>
            분석을 시작하면 오디오 소리를 실시간 감지합니다.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
          {renderMicLevel()}
          <button
            onClick={onStartMonitoring}
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
            실시간 키 감지 시작
          </button>
        </div>
      </div>
    );
  }

  // 2. Monitoring started, but no key detected yet
  if (isMonitoring && !detectedKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '248px', width: '100%', padding: '2px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '4px 0 0' }}>
          <div className="loader-spin" style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            marginBottom: '8px'
          }} />
          <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '13px' }}>음향 신호 대기 중...</h4>
          <p style={{ fontSize: '11px', maxWidth: '240px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: 1.25 }}>
            마이크나 악기 소리를 연주해 보세요.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
          {renderMicLevel()}
          <button
            onClick={onStopMonitoring}
            className="btn-danger"
            style={{
              width: '100%',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              height: '36px'
            }}
          >
            분석 중지
          </button>
        </div>
      </div>
    );
  }

  // 3. Active key detected (shows real-time results or last-held results)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '248px', width: '100%', padding: '2px 0', gap: '6px' }}>
      <div style={{ textAlign: 'center', padding: '1px 0' }}>
        <span style={{ 
          fontSize: '9px', 
          fontWeight: 700, 
          color: isMonitoring ? 'var(--primary)' : 'var(--text-muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '1px' 
        }}>
          {isMonitoring ? 'LIVE DETECTED KEY' : 'LAST DETECTED KEY (HOLD)'}
        </span>
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 800, 
          color: 'var(--text-primary)', 
          fontFamily: 'Outfit, var(--font-sans)', 
          margin: '2px 0', 
          lineHeight: 1.1 
        }}>{keyName}</div>
        
        {/* Confidence Progress Bar */}
        <div style={{ maxWidth: '180px', margin: '0 auto 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '2px', fontWeight: 500 }}>
            <span style={{ color: 'var(--text-secondary)' }}>신뢰도</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{confidence}%</span>
          </div>
          <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--border-color)', borderRadius: '1.5px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${confidence}%`, 
                height: '100%', 
                backgroundColor: 'var(--primary)',
                borderRadius: '1.5px',
                transition: 'width 0.4s ease'
              }} 
            />
          </div>
        </div>
      </div>

      {/* Key Relationship Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>나란한 조 (Relative)</span>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)' }}>{relativeKey}</div>
        </div>
        <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>같은으뜸음조 (Parallel)</span>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{parallelKey}</div>
        </div>
        <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>버금딸림음 (IV)</span>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{subdominant}</div>
        </div>
        <div style={{ background: 'rgba(128,128,128,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 6px' }}>
          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>딸림음 (V)</span>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{dominant}</div>
        </div>
      </div>

      {/* Alternative Candidates */}
      <div>
        <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>
          후보 키 (Candidates)
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {alternativeKeys.slice(0, 2).map((item, idx) => {
            const pct = Math.min(100, Math.max(0, Math.round((item.correlation - 0.2) * 166)));
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', padding: '1px 4px', borderRadius: '4px' }}>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{item.keyName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '80px' }}>
                  <div style={{ flexGrow: 1, height: '3px', backgroundColor: 'var(--border-color)', borderRadius: '1.5px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--text-muted)' }} />
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', minWidth: '18px', textAlign: 'right' }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mic Level and Action button inside panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto', width: '100%' }}>
        {renderMicLevel()}
        {isMonitoring ? (
          <button
            onClick={onStopMonitoring}
            className="btn-danger"
            style={{
              width: '100%',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              height: '36px'
            }}
          >
            분석 중지
          </button>
        ) : (
          <button
            onClick={onStartMonitoring}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              height: '36px'
            }}
          >
            새 분석 시작
          </button>
        )}
      </div>
    </div>
  );
}
