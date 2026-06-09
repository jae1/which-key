import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useAudioEngine } from './hooks/useAudioEngine';
import { ThemeToggle } from './components/ThemeToggle';
import { ChromaWheel } from './components/ChromaWheel';
import { KeyDisplay } from './components/KeyDisplay';
import { BpmDisplay } from './components/BpmDisplay';
import { Metronome } from './components/Metronome';
import { Transposition } from './components/Transposition';
import { AdSlot } from './components/AdSlot';

interface Widget {
  id: string;
  title: string;
  isCollapsed: boolean;
}

function WidgetHeader({ 
  widget, 
  rowKey, 
  index, 
  totalInRow, 
  onToggleCollapse, 
  onMove,
  onDragStart,
  isMonitoring,
  detectedKey,
  bpm
}: {
  widget: Widget;
  rowKey: 'top' | 'bottom';
  index: number;
  totalInRow: number;
  onToggleCollapse: (id: string) => void;
  onMove: (id: string, direction: 'left' | 'right') => void;
  onDragStart: (id: string, sourceRow: 'top' | 'bottom') => void;
  isMonitoring: boolean;
  detectedKey: string | null;
  bpm: number | null;
}) {
  // Determine if this widget is active and has live data
  const isWidgetLive = isMonitoring && (
    (widget.id === 'key' && detectedKey !== null) ||
    (widget.id === 'chroma') ||
    (widget.id === 'bpm' && bpm !== null)
  );

  const isWidgetHold = !isMonitoring && (
    (widget.id === 'key' && detectedKey !== null) ||
    (widget.id === 'bpm' && bpm !== null)
  );

  return (
    <div 
      draggable
      onDragStart={() => onDragStart(widget.id, rowKey)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: widget.isCollapsed ? 'none' : '1px solid var(--border-color)',
        paddingBottom: widget.isCollapsed ? '0' : '8px',
        marginBottom: widget.isCollapsed ? '0' : '12px',
        cursor: 'grab',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 'bold' }}>⋮⋮</span>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{widget.title}</h3>
        {isWidgetLive && (
          <span className="live-badge" style={{ fontSize: '9px', padding: '1px 5px', gap: '4px' }}>
            <span className="pulse-dot" />
            LIVE
          </span>
        )}
        {isWidgetHold && (
          <span className="hold-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
            HOLD
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
        {index > 0 && (
          <button 
            onClick={() => onMove(widget.id, 'left')}
            style={{ 
              width: '26px',
              height: '26px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              borderRadius: '4px'
            }}
            title="왼쪽으로 이동"
          >
            ←
          </button>
        )}
        {index < totalInRow - 1 && (
          <button 
            onClick={() => onMove(widget.id, 'right')}
            style={{ 
              width: '26px',
              height: '26px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              borderRadius: '4px'
            }}
            title="오른쪽으로 이동"
          >
            →
          </button>
        )}
        
        <button
          onClick={() => onToggleCollapse(widget.id)}
          style={{ 
            width: '28px',
            height: '28px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px', 
            background: 'var(--border-color)', 
            border: 'none', 
            color: 'var(--text-primary)',
            borderRadius: '6px',
            marginLeft: '2px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          title={widget.isCollapsed ? '펼치기' : '접기'}
        >
          {widget.isCollapsed ? '+' : '−'}
        </button>
      </div>
    </div>
  );
}

function App() {
  const {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    detectedKey,
    confidence,
    alternativeKeys,
    chromagram,
    bpm,
    isBeat,
    manualBpm,
    tapTempo,
    resetBpm,
    inputLevel,
    getAudioContext,
  } = useAudioEngine();

  const [activeModal, setActiveModal] = useState<'privacy' | 'about' | 'terms' | null>(null);

  // 2-tier layout layout v7 (chroma/key top, transposition/bpm/metronome bottom)
  const [layout, setLayout] = useState<{
    top: Widget[];
    bottom: Widget[];
  }>(() => {
    const saved = localStorage.getItem('dashboard_layout_v8');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      top: [
        { id: 'key', title: '감지된 키 (Key)', isCollapsed: false },
        { id: 'chroma', title: '크로마 휠 (Chroma Wheel)', isCollapsed: false }
      ],
      bottom: [
        { id: 'transposition', title: '조바꿈 (Transpose)', isCollapsed: false },
        { id: 'bpm', title: '템포 (BPM)', isCollapsed: false },
        { id: 'metronome', title: '메트로놈', isCollapsed: false }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('dashboard_layout_v8', JSON.stringify(layout));
  }, [layout]);

  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [draggedSourceRow, setDraggedSourceRow] = useState<'top' | 'bottom' | null>(null);

  const handleDragStart = (id: string, sourceRow: 'top' | 'bottom') => {
    setDraggedWidgetId(id);
    setDraggedSourceRow(sourceRow);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetRow: 'top' | 'bottom', targetIndex: number) => {
    if (!draggedWidgetId || !draggedSourceRow) return;
    // Disallow dragging across rows to keep layout structured
    if (draggedSourceRow !== targetRow) return;

    setLayout(prev => {
      const list = [...prev[targetRow]];
      const sourceIndex = list.findIndex(w => w.id === draggedWidgetId);
      if (sourceIndex === -1) return prev;

      // Swap the source and target widgets
      const temp = list[sourceIndex];
      list[sourceIndex] = list[targetIndex];
      list[targetIndex] = temp;

      return {
        ...prev,
        [targetRow]: list
      };
    });

    setDraggedWidgetId(null);
    setDraggedSourceRow(null);
  };

  const toggleCollapse = useCallback((id: string) => {
    setLayout(prev => {
      const updated = { ...prev };
      for (const rowKey of ['top', 'bottom'] as const) {
        updated[rowKey] = updated[rowKey].map(w => 
          w.id === id ? { ...w, isCollapsed: !w.isCollapsed } : w
        );
      }
      return updated;
    });
  }, []);

  const moveWidget = useCallback((id: string, direction: 'left' | 'right') => {
    setLayout(prev => {
      const updated = {
        top: [...prev.top],
        bottom: [...prev.bottom],
      };
      
      let currentRowKey: 'top' | 'bottom' | null = null;
      let currentIndex = -1;
      
      for (const rowKey of ['top', 'bottom'] as const) {
        const idx = updated[rowKey].findIndex(w => w.id === id);
        if (idx !== -1) {
          currentRowKey = rowKey;
          currentIndex = idx;
          break;
        }
      }
      
      if (!currentRowKey || currentIndex === -1) return prev;
      
      const list = updated[currentRowKey];
      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex >= 0 && targetIndex < list.length) {
        // Swap
        const temp = list[currentIndex];
        list[currentIndex] = list[targetIndex];
        list[targetIndex] = temp;
      }
      
      return updated;
    });
  }, []);

  const handleResetLayout = () => {
    const defaultLayout = {
      top: [
        { id: 'key', title: '감지된 키 (Key)', isCollapsed: false },
        { id: 'chroma', title: '크로마 휠 (Chroma Wheel)', isCollapsed: false }
      ],
      bottom: [
        { id: 'transposition', title: '조바꿈 (Transpose)', isCollapsed: false },
        { id: 'bpm', title: '템포 (BPM)', isCollapsed: false },
        { id: 'metronome', title: '메트로놈', isCollapsed: false }
      ]
    };
    setLayout(defaultLayout);
    localStorage.removeItem('dashboard_layout_v8');
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  const handleCloseModal = () => setActiveModal(null);

  const renderWidget = (widget: Widget, rowKey: 'top' | 'bottom', index: number, totalInRow: number) => {
    const header = (
      <WidgetHeader 
        widget={widget}
        rowKey={rowKey}
        index={index}
        totalInRow={totalInRow}
        onToggleCollapse={toggleCollapse}
        onMove={moveWidget}
        onDragStart={handleDragStart}
        isMonitoring={isMonitoring}
        detectedKey={detectedKey}
        bpm={bpm}
      />
    );

    if (widget.isCollapsed) {
      return (
        <div 
          key={widget.id} 
          className="panel" 
          style={{ padding: '12px 16px' }}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(rowKey, index)}
        >
          {header}
        </div>
      );
    }

    const innerContent = (() => {
      switch (widget.id) {
        case 'chroma':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
              <ChromaWheel 
                chromagram={chromagram} 
                inputLevel={inputLevel} 
                isMonitoring={isMonitoring} 
              />
            </div>
          );
        case 'bpm':
          return (
            <BpmDisplay 
              bpm={bpm}
              isBeat={isBeat}
              manualBpm={manualBpm}
              tapTempo={tapTempo}
              resetBpm={resetBpm}
              isMonitoring={isMonitoring}
              hideHeader={true}
            />
          );
        case 'key':
          return (
            <KeyDisplay 
              detectedKey={detectedKey}
              confidence={confidence}
              alternativeKeys={alternativeKeys}
              isMonitoring={isMonitoring}
              inputLevel={inputLevel}
              onStartMonitoring={startMonitoring}
              onStopMonitoring={stopMonitoring}
              hideHeader={true}
            />
          );
        case 'metronome':
          return (
            <Metronome 
              currentBpm={manualBpm > 0 ? manualBpm : (bpm || 120)}
              getAudioContext={getAudioContext}
              hideHeader={true}
            />
          );
        case 'transposition':
          return (
            <Transposition detectedKey={detectedKey} hideHeader={true} />
          );
        default:
          return null;
      }
    })();

    return (
      <div 
        key={widget.id} 
        className="panel" 
        style={{ display: 'flex', flexDirection: 'column' }}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(rowKey, index)}
      >
        {header}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {innerContent}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-area">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="logo-text">WhichKey</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-3px' }}>악기 키 & BPM 분석</p>
          </div>
        </div>
        
        <div className="header-controls">
          <button 
            onClick={toggleMonitoring} 
            className={isMonitoring ? 'btn-danger' : 'btn-primary'}
            style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              padding: '6px 14px', 
              borderRadius: '8px',
              boxShadow: isMonitoring ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
            }}
          >
            {isMonitoring ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '2px' }}>
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                분석 중지
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '2px' }}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                분석 시작
              </>
            )}
          </button>

          <button onClick={handleResetLayout} className="btn-reset-layout" title="모든 패널 크기와 위치를 기본값으로 되돌립니다.">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M16 3h5v5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 21H3v-5" />
            </svg>
            <span className="btn-text">레이아웃 초기화</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top tier - 2 columns */}
        <div className="app-grid-top">
          {layout.top.map((w, idx) => renderWidget(w, 'top', idx, layout.top.length))}
        </div>
        
        {/* Bottom tier - 3 columns */}
        <div className="app-grid-bottom">
          {layout.bottom.map((w, idx) => renderWidget(w, 'bottom', idx, layout.bottom.length))}
        </div>
      </main>

      <AdSlot type="horizontal" />

      {/* Footer & AdSense Compliance Policies */}
      <footer className="app-footer">
        <div className="footer-links">
          <a href="#about" onClick={(e) => { e.preventDefault(); setActiveModal('about'); }}>서비스 소개</a>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>개인정보처리방침</a>
          <a href="#terms" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>이용약관</a>
        </div>
        <p>&copy; {new Date().getFullYear()} WhichKey. All Rights Reserved.</p>
        <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.4 }}>모든 오디오 데이터는 브라우저 내부에서 실시간 로컬 분석을 거치며 서버로 전송되지 않습니다. (100% On-Device)</p>
      </footer>

      {/* Modals for Policy Compliance (Google AdSense Requirements) */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }} onClick={handleCloseModal}>
          <div style={{
            background: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#121424',
            border: '1px solid var(--panel-border)',
            borderRadius: '16px',
            boxShadow: 'var(--panel-shadow)',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              &times;
            </button>

            {/* About Modal */}
            {activeModal === 'about' && (
              <div>
                <h2 style={{ fontSize: '22px', marginBottom: '16px', color: 'var(--primary)' }}>WhichKey 서비스 소개</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', lineHeight: '1.6' }}>
                  <p><strong>WhichKey</strong>는 찬양팀 인도자와 연주자들(특히 베이스 기타리스트 및 세컨 건반 반주자)을 위해 설계된 실시간 음악 키(Key) 및 BPM 측정 도구입니다.</p>
                  <p>절대음감이 없어도 실시간으로 연주되는 음악이나 마이크 입력 소리만으로 즉시 조표(Key)를 파악할 수 있으며, 이에 해당하는 주요 관계조(나란한 조, 같은 으뜸음 조, 딸림음, 버금딸림음) 및 다이아토닉 코드를 12키 전체 일람표나 변환 탭을 통해 즉각 매핑하여 드립니다.</p>
                  <p><strong>주요 특징:</strong></p>
                  <ul>
                    <li><strong>로컬 프라이버시</strong>: 모든 오디오 프로세싱은 브라우저(Client-side)의 Web Audio API만을 사용합니다. 오디오 스트림이나 녹음 파일이 외부 서버로 업로드되지 않으므로 데이터와 프라이버시가 안전하게 보장됩니다.</li>
                    <li><strong>정밀한 크로마그램 알고리즘</strong>: Krumhansl-Schmuckler 화성 분석 상관분석을 사용하여 코드나 곡의 조성(Key)을 실시간으로 추정합니다.</li>
                    <li><strong>탭 템포 및 메트로놈 내장</strong>: 실시간 드럼 비트 감지 기술과 수동 탭 템포 기능을 결합하여 정확한 박자 연습을 돕습니다.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Privacy Policy Modal */}
            {activeModal === 'privacy' && (
              <div>
                <h2 style={{ fontSize: '22px', marginBottom: '16px', color: 'var(--primary)' }}>개인정보처리방침 (Privacy Policy)</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  <p>본 개인정보처리방침은 WhichKey(이하 '서비스')가 제공하는 웹 애플리케이션의 오디오 데이터 이용 및 개인정보 취급 정책을 설명합니다.</p>
                  <p><strong>1. 오디오 데이터 수집 및 처리 거부</strong><br />
                  본 서비스는 실시간 음악 키 및 BPM 측정을 위하여 사용자 기기의 마이크(Audio Input) 권한을 요청합니다. 권한 수락 시 사용되는 오디오 데이터는 브라우저 내부(사용자 기기 메모리)에서만 실시간으로 신호 분석(FFT 연산 등)을 수행한 뒤 즉시 파기됩니다. 서버로 전송, 영구 저장, 또는 제3자에게 전송되지 않습니다.</p>
                  <p><strong>2. 쿠키 및 광고 제공에 대한 사항 (구글 애드센스)</strong><br />
                  본 서비스는 서비스 유지 관리를 위한 광고 게재를 위해 Google AdSense를 이용할 수 있습니다. 구글을 포함한 제3자 제공업체는 사용자가 웹사이트를 방문한 방문 기록을 토대로 맞춤형 광고를 제공하기 위해 쿠키(Cookies)를 사용합니다. 맞춤설정 광고 게재가 원치 않으실 경우, 사용자는 구글의 <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">광고 설정 페이지</a>에서 맞춤설정 광고를 사용 중지할 수 있습니다.</p>
                  <p><strong>3. 통계 분석 도구</strong><br />
                  서비스 품질 개선 및 트래픽 분석을 위해 익명의 트래픽 통계 도구(예: Google Analytics)를 이용할 수 있으며, 수집되는 정보는 비개인적 통계 정보에 한정됩니다.</p>
                  <p><strong>문의 사항:</strong> 기타 문의사항은 도메인 웹마스터 메일을 통해 전달해 주시기 바랍니다.</p>
                </div>
              </div>
            )}

            {/* Terms of Service Modal */}
            {activeModal === 'terms' && (
              <div>
                <h2 style={{ fontSize: '22px', marginBottom: '16px', color: 'var(--primary)' }}>이용약관 (Terms of Service)</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  <p><strong>제 1 조 (목적)</strong><br />
                  본 약관은 WhichKey가 제공하는 음악 보조 유틸리티 웹서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.</p>
                  <p><strong>제 2 조 (서비스 이용 및 제한)</strong><br />
                  1. 서비스는 비로그인 상태에서 무료로 이용할 수 있으며, 마이크 권한 동의를 전제로 작동합니다.<br />
                  2. 본 서비스에서 분석되어 나타나는 음악의 Key 및 BPM 정보는 디지털 신호 알고리즘에 기반한 추정치로, 환경적 잡음 또는 배음 구조에 의해 100%의 정확성을 보장하지 않습니다. 연주 결과물에 대한 최종 판단은 연주자 본인에게 있습니다.</p>
                  <p><strong>제 3 조 (책임의 한계 및 면책)</strong><br />
                  서비스 제공자는 웹사이트 이용과 관련하여 발생할 수 있는 직접적, 간접적 데이터 손실 또는 브라우저 작동 문제에 대해 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</p>
                </div>
              </div>
            )}

            <button 
              onClick={handleCloseModal}
              className="btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '10px' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
