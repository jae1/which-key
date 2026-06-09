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

  const [isGuideCollapsed, setIsGuideCollapsed] = useState(true);

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

      {/* Guide Section - Text-rich content for AdSense SEO compliance */}
      <section className="panel" style={{ marginTop: '24px', padding: '20px' }}>
        <div 
          onClick={() => setIsGuideCollapsed(!isGuideCollapsed)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📖</span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              WhichKey 음악 분석 및 이론 가이드
            </h2>
          </div>
          <button
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
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {isGuideCollapsed ? '+' : '−'}
          </button>
        </div>
        
        <div style={{ 
          display: isGuideCollapsed ? 'none' : 'block',
          marginTop: '20px', 
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>1. WhichKey 서비스 개요 및 동작 원리</h3>
              <p style={{ margin: 0 }}>
                WhichKey는 브라우저를 통해 실시간으로 흘러나오는 소리를 분석하여 음악의 조성(Key)과 템포(BPM)를 감지하고, 연주자를 위한 조바꿈(Transposition) 정보와 다이아토닉 코드를 즉각적으로 제공하는 웹 서비스입니다. 이 서비스는 복잡한 하드웨어 설치나 서버 업로드 없이, HTML5 Web Audio API와 Fast Fourier Transform(고속 푸리에 변환) 기술을 활용하여 100% 클라이언트(On-Device) 내에서 오디오 신호를 처리합니다. 마이크를 통해 수집된 소리는 주파수 영역으로 실시간 변환된 뒤, 음악의 주요 화성적 특징인 크로마그램(Chromagram)으로 매핑됩니다.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>2. 음악에서의 조성(Key)과 음계(Scale)</h3>
              <p style={{ margin: 0, marginBottom: '10px' }}>
                음악 이론에서 조성(Key)이란 곡의 중심이 되는 주음(으뜸음, Tonic)과 그 주음을 바탕으로 일정한 간격으로 배열된 음들의 집합인 음계(Scale) 사이의 관계를 의미합니다.
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>장조 (Major Key)</strong>: 으뜸음으로부터 '온음-온음-반음-온음-온음-온음-반음'의 간격으로 구성된 7개의 음을 사용하며, 일반적으로 밝고 경쾌하며 안정적인 느낌을 줍니다.</li>
                <li><strong>단조 (Minor Key)</strong>: 으뜸음으로부터 '온음-반음-온음-온음-반음-온음-온음' (자연단음계 기준)의 간격으로 음이 배치되며, 다소 어둡고 슬프거나 진지한 감정을 자아냅니다.</li>
              </ul>
              <p style={{ margin: 0, marginTop: '10px' }}>
                곡의 조성을 명확히 아는 것은 연주나 편곡 시 매우 중요합니다. 올바른 스케일 상의 음들을 활용하여 멜로디를 구성하고, 코드 진행을 자연스럽게 전개하거나 원하는 음역대에 맞춰 키를 이조(Transposition)할 수 있기 때문입니다.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>3. 실시간 크로마 휠(Chroma Wheel) 분석 기법</h3>
              <p style={{ margin: 0, marginBottom: '10px' }}>
                크로마 휠은 인간이 느끼는 12가지 반음(C, C#, D, D#, E, F, F#, G, G#, A, A#, B)의 옥타브 독립적 에너지 분포를 동심원 상에 실시간으로 시각화한 분석 패널입니다.
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>주파수 분석(FFT)</strong>: 수집된 오디오 신호는 이산 푸리에 변환 알고리즘을 거쳐 주파수 영역의 스펙트럼 데이터로 수치화됩니다.</li>
                <li><strong>크로마 벡터 매핑</strong>: 계산된 각 주파수 세기는 피치 클래스(Pitch Class)별로 정렬됩니다. 이 과정을 거치며 옥타브가 다른 동일 음역대(예: C3, C4, C5)의 에너지는 하나의 'C' 크로마 성분으로 합산됩니다.</li>
                <li><strong>시각 피드백</strong>: 실시간 크로마 휠을 관찰함으로써 곡의 조성을 형성하는 화음 구성음들과 지배적인 선율 피치를 한눈에 확인할 수 있습니다.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>4. Krumhansl-Schmuckler 조성 분석 알고리즘</h3>
              <p style={{ margin: 0 }}>
                입력된 크로마 데이터를 기반으로 실제 음악의 키를 예측할 때 인지 음악학 분야에서 공인된 Krumhansl-Schmuckler 조성 프로필 상관분석 모델이 적용됩니다. 각 24개 장/단조는 역사적/인지적 중요도에 따른 고유의 키 프로필(Key Profile) 분포도를 가지고 있습니다. 서비스는 실시간 축적되는 입력 크로마 성분과 24개 키 프로필 분포 간의 피어슨 상관계수(Pearson Correlation Coefficient)를 실시간으로 계산하여 가장 매칭도가 높은 조성을 기본 키(Primary Key)로 선출하며, 유사한 다른 후보군들을 대체 키(Alternative Keys)로 제시하여 잡음 및 배음으로 인한 오동작 확률을 현저히 낮춥니다.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>5. 다이아토닉 코드(Diatonic Chords)와 화성적 기능</h3>
              <p style={{ margin: 0, marginBottom: '10px' }}>
                특정 조성이 정해지면 해당 스케일의 음만으로 순차적으로 쌓아 올린 7개의 다이아토닉 코드(Diatonic Chords)가 정의됩니다. 각 화음은 곡의 전개 과정에서 아래와 같은 고유한 화성적 역할을 수행합니다.
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>I도 (Tonic, 으뜸화음)</strong>: 조성의 출발점이자 최종 도착점 역할을 하는 가장 안정적인 화음입니다.</li>
                <li><strong>IV도 (Subdominant, 버금딸림화음)</strong>: 조성에 풍부한 진행감을 더하며, 으뜸화음에서 딸림화음으로 전개할 때 매끄러운 징검다리 다리 역할을 수행합니다.</li>
                <li><strong>V도 (Dominant, 딸림화음)</strong>: 강한 긴장감을 내포하고 있으며, 자연스럽게 안정적인 으뜸화음(I도)으로 해결하려는 강력한 성질(진행력)을 가집니다.</li>
              </ul>
              <p style={{ margin: 0, marginTop: '10px' }}>
                WhichKey가 매핑해주는 다이아토닉 코드 표를 참고하면 복잡한 악보가 없는 즉석 잼 연주, 찬양팀 인도 시 유연한 연주 조율, 작곡 및 편곡 작업을 직관적으로 수월하게 이끌어갈 수 있습니다.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>6. 조바꿈(Transposition) 및 이조 연주 팁</h3>
              <p style={{ margin: 0 }}>
                가창자의 음역 대역이나 사용하는 악기 종류에 맞추어 연주 키를 바꿀 때 조바꿈 패널을 유용하게 쓸 수 있습니다. 반음(Semitone) 단위의 정밀한 이조 계산 기능을 탑재하여 현재 감지된 오리지널 키와 이조할 타겟 키 간의 세부 간격을 즉각 계산해 주며, 특히 어쿠스틱 기타리스트를 위한 카포(Capo) 프렛 매핑 정보와 이조악기(Bb, Eb) 연주자들을 위한 실음 환산 정보를 지원하여 리허설 현장에서 신속한 협업을 이끌어 냅니다.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>7. 템포(BPM) 측정 및 메트로놈 활용법</h3>
              <p style={{ margin: 0 }}>
                BPM(Beats Per Minute)은 음악의 템포(속도)를 나타내는 국제적 정량 단위로, 1분당 박자 반복 횟수를 의미합니다. WhichKey는 드럼 타악 비트의 실시간 트랜지언트(Transient) 에너지를 포착하여 곡의 대략적인 속도를 자동 산출하는 자동 감지 모드와 연주를 들으며 탭 동작을 취해 측정하는 탭 템포(Tap Tempo) 모드를 지원합니다. 이렇게 측정 및 입력된 BPM 정보는 고정밀 웹 오디오 기반의 클릭 사운드 메트로놈과 즉각 동기화되어, 사용자가 완벽한 템포 감각으로 박자 흔들림 없는 개인 악기 연습 및 밴드 지휘를 영위하도록 지원합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <AdSlot type="horizontal" />

      {/* Footer & AdSense Compliance Policies */}
      <footer className="app-footer">
        <div className="footer-links">
          <a href="/about.html" target="_blank" rel="noopener noreferrer">서비스 소개</a>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer">이용약관</a>
        </div>
        <p>&copy; {new Date().getFullYear()} WhichKey. All Rights Reserved.</p>
        <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.4 }}>모든 오디오 데이터는 브라우저 내부에서 실시간 로컬 분석을 거치며 서버로 전송되지 않습니다. (100% On-Device)</p>
      </footer>
    </div>
  );
}

export default App;
