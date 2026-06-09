import { getRelativeKey, getParallelKey, getRelatedKeys } from '../utils/KeyFinder';
import type { KeyPrediction } from '../utils/KeyFinder';

interface KeyDisplayProps {
  detectedKey: string | null;
  confidence: number;
  alternativeKeys: KeyPrediction[];
  isMonitoring: boolean;
}

export function KeyDisplay({ detectedKey, confidence, alternativeKeys, isMonitoring }: KeyDisplayProps) {
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

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>실시간 키 감지 (Key Detection)</h3>
        {isMonitoring && detectedKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: 'var(--secondary)', 
                borderRadius: '50%', 
                boxShadow: '0 0 8px var(--secondary)' 
              }} 
            />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>LIVE</span>
          </div>
        )}
      </div>

      {!isMonitoring ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            border: '1px solid var(--panel-border)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>감지 시작 대기 중</p>
          <p style={{ fontSize: '13px', maxWidth: '240px' }}>위의 '분석 시작' 버튼을 눌러 악기나 마이크 소리를 들려주세요.</p>
        </div>
      ) : !detectedKey ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '20px' }}>
          <div className="loader-spin" style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            marginBottom: '16px'
          }} />
          <p style={{ fontWeight: 500 }}>음악 소리를 분석하고 있습니다...</p>
          <p style={{ fontSize: '12px', marginTop: '6px' }}>악기 단음 연주나 찬양 음원을 가까이 대주세요.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              DETECTED KEY
            </span>
            <div className="key-hero">{keyName}</div>
            
            {/* Confidence Progress Bar */}
            <div style={{ maxWidth: '280px', margin: '0 auto 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)' }}>감지 신뢰도</span>
                <span style={{ color: confidence > 60 ? 'var(--secondary)' : 'var(--accent)' }}>{confidence}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${confidence}%`, 
                    height: '100%', 
                    backgroundColor: confidence > 60 ? 'var(--secondary)' : 'var(--accent)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Key Relationship Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(128,128,128,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>나란한 조 (Relative Key)</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>{relativeKey}</div>
            </div>
            <div style={{ background: 'rgba(128,128,128,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>같은으뜸음조 (Parallel Key)</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{parallelKey}</div>
            </div>
            <div style={{ background: 'rgba(128,128,128,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>버금딸림음 (IV / Subdominant)</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{subdominant}</div>
            </div>
            <div style={{ background: 'rgba(128,128,128,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>딸림음 (V / Dominant)</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{dominant}</div>
            </div>
          </div>

          {/* Alternative Candidates */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              후보 키 매칭률 (Candidates)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {alternativeKeys.map((item, idx) => {
                // Map correlation correlation value to a visual percentage (approx 0 to 100)
                const pct = Math.min(100, Math.max(0, Math.round((item.correlation - 0.2) * 166)));
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.01)' }}>
                    <span style={{ fontWeight: 500 }}>{item.keyName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
                      <div style={{ flexGrow: 1, height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--text-muted)' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', minWidth: '24px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
