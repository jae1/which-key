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
            title="Move Left"
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
            title="Move Right"
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
          title={widget.isCollapsed ? 'Expand' : 'Collapse'}
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
  const [view, setView] = useState<'dashboard' | 'about' | 'privacy' | 'terms'>('dashboard');

  // 2-tier layout layout v9 (chroma/key top, transposition/bpm/metronome bottom)
  const [layout, setLayout] = useState<{
    top: Widget[];
    bottom: Widget[];
  }>(() => {
    const saved = localStorage.getItem('dashboard_layout_v9');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      top: [
        { id: 'key', title: 'Detected Key', isCollapsed: false },
        { id: 'chroma', title: 'Chroma Wheel', isCollapsed: false }
      ],
      bottom: [
        { id: 'transposition', title: 'Transposition', isCollapsed: false },
        { id: 'bpm', title: 'Tempo (BPM)', isCollapsed: false },
        { id: 'metronome', title: 'Metronome', isCollapsed: false }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('dashboard_layout_v9', JSON.stringify(layout));
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
        { id: 'key', title: 'Detected Key', isCollapsed: false },
        { id: 'chroma', title: 'Chroma Wheel', isCollapsed: false }
      ],
      bottom: [
        { id: 'transposition', title: 'Transposition', isCollapsed: false },
        { id: 'bpm', title: 'Tempo (BPM)', isCollapsed: false },
        { id: 'metronome', title: 'Metronome', isCollapsed: false }
      ]
    };
    setLayout(defaultLayout);
    localStorage.removeItem('dashboard_layout_v9');
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
        <div className="logo-area" onClick={() => setView('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="logo-text">WhichKey</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-3px' }}>Instrument Key & BPM Analyzer</p>
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
                Stop Analysis
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '2px' }}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Start Analysis
              </>
            )}
          </button>

          <button onClick={handleResetLayout} className="btn-reset-layout" title="Reset all panels to default sizes and positions">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M16 3h5v5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 21H3v-5" />
            </svg>
            <span className="btn-text">Reset Layout</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Dashboard View */}
        <div style={{ display: view === 'dashboard' ? 'flex' : 'none', flexDirection: 'column', gap: '24px' }}>
          {/* Top tier - 2 columns */}
          <div className="app-grid-top">
            {layout.top.map((w, idx) => renderWidget(w, 'top', idx, layout.top.length))}
          </div>
          
          {/* Bottom tier - 3 columns */}
          <div className="app-grid-bottom">
            {layout.bottom.map((w, idx) => renderWidget(w, 'bottom', idx, layout.bottom.length))}
          </div>
        </div>

        {/* About View */}
        <div style={{ display: view === 'about' ? 'block' : 'none' }} className="panel">
          <button onClick={() => setView('dashboard')} className="btn-secondary" style={{ marginBottom: '20px' }}>
            &larr; Back to Dashboard
          </button>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--primary)' }}>About WhichKey</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
            <p>
              <strong>WhichKey</strong> is a web-based smart audio analysis utility suite designed for musicians, worship leaders, producers, and students. By analyzing microphone or system audio input in real-time, it instantly extracts and displays key musical features.
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>Core Features</h3>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Real-time Key Detection</strong>: Instantly analyzes the pitch and harmonic profile of the music playing in your room to estimate the key (e.g., C Major, A Minor) along with its relative, parallel, and closely related keys.</li>
              <li><strong>Real-time BPM Tracking & Tap Tempo</strong>: Analyzes rhythmic transient energy to track the tempo (BPM) of incoming audio. Includes a large-target manual Tap Tempo interface for instant BPM measurement.</li>
              <li><strong>Smart Metronome</strong>: Synchronizes with the detected or manual BPM, supporting customizable time signatures, subdivisions, and audio-synthesized click tracks.</li>
              <li><strong>12-Key Chord Matrix & Transposition</strong>: Instantly maps out the 7 diatonic chords for any key, allowing seamless transposition and capo calculation for guitarists and keyboardists.</li>
            </ul>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>Technical Details</h3>
            <p style={{ margin: 0 }}>
              The application performs all digital signal processing (DSP) locally inside your web browser using the <strong>Web Audio API</strong> and real-time <strong>Fast Fourier Transform (FFT)</strong>. No audio data is ever recorded or uploaded to external servers, ensuring 100% on-device privacy and zero data usage.
            </p>
          </div>
        </div>

        {/* Privacy Policy View */}
        <div style={{ display: view === 'privacy' ? 'block' : 'none' }} className="panel">
          <button onClick={() => setView('dashboard')} className="btn-secondary" style={{ marginBottom: '20px' }}>
            &larr; Back to Dashboard
          </button>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--primary)' }}>Privacy Policy</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
            <p>
              This Privacy Policy describes how WhichKey (referred to as "the Service") processes audio data and handles user privacy.
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>1. Audio Data Processing & Local Execution</h3>
            <p style={{ margin: 0 }}>
              To analyze musical key and BPM in real-time, the Service requests permission to access your device's microphone (Audio Input). The incoming audio stream is processed entirely inside your browser (Client-Side memory) using real-time Fast Fourier Transform (FFT) analysis, and is instantly discarded. No audio data or recording is ever saved, stored, uploaded to external servers, or shared with third parties.
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>2. Cookies and Advertisements (Google AdSense)</h3>
            <p style={{ margin: 0 }}>
              The Service may display advertisements served by Google AdSense to sustain operations. Google and other third-party vendors use cookies to serve personalized ads based on your previous visits to this and other websites. You can opt-out of personalized advertising by visiting Google's <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Ads Settings</a> page.
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>3. Analytics and Statistics</h3>
            <p style={{ margin: 0 }}>
              To monitor traffic and improve service quality, we may use anonymous analytics tools (such as Google Analytics). The collected information is strictly non-personal and aggregated (e.g., browser type, visit duration, screen resolution).
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>4. Changes to this Policy</h3>
            <p style={{ margin: 0 }}>
              We reserve the right to modify this Privacy Policy. Any updates will be posted on this page.
            </p>
          </div>
        </div>

        {/* Terms of Service View */}
        <div style={{ display: view === 'terms' ? 'block' : 'none' }} className="panel">
          <button onClick={() => setView('dashboard')} className="btn-secondary" style={{ marginBottom: '20px' }}>
            &larr; Back to Dashboard
          </button>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--primary)' }}>Terms of Service</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Article 1 (Purpose)</h3>
            <p style={{ margin: 0 }}>
              These Terms govern your use of the WhichKey web application and its utilities (real-time key detection, BPM tracking, metronome, and transposition tool).
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>Article 2 (Usage & Access)</h3>
            <p style={{ margin: 0 }}>
              1. The Service is free to use and does not require registration or user accounts.<br />
              2. Microphone permission is required to run the real-time pitch and BPM detection algorithms. Users can revoke this permission through browser settings at any time.
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>Article 3 (Disclaimers & Limitations of Liability)</h3>
            <p style={{ margin: 0 }}>
              1. The detected keys, chord maps, and BPM metrics are algorithmic estimates based on digital signal analysis. Environmental noise, room acoustics, or harmonic overtones can lead to estimation margins. The Service does not guarantee 100% accuracy, and the final musical decisions remain the user's responsibility.<br />
              2. The Service is provided "as is" without warranty of any kind. The provider is not liable for any direct or indirect damages resulting from the use or inability to use this website.
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px' }}>Article 4 (Intellectual Property)</h3>
            <p style={{ margin: 0 }}>
              All visual assets, source code, logos, design configurations, and proprietary scripts are the intellectual property of WhichKey and protected by copyright laws.
            </p>
          </div>
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
              WhichKey Music Analysis & Theory Guide
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
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>1. WhichKey Overview & How It Works</h3>
              <p style={{ margin: 0 }}>
                WhichKey is a web service that analyzes real-time audio from your browser to detect the musical key and tempo (BPM), providing musicians with instant transposition guides and diatonic chord matrixes. Without complex hardware setups or server uploads, it leverages the HTML5 Web Audio API and Fast Fourier Transform (FFT) to process audio signals 100% on the client side (On-Device). Audio captured via the microphone is converted to the frequency domain in real-time, then mapped to a Chromagram—a representation of the twelve semitone pitch classes.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Musical Keys and Scales</h3>
              <p style={{ margin: 0, marginBottom: '10px' }}>
                In music theory, a key defines the relationship between the tonic (the home pitch or center of gravity of a piece) and the scale (a set of pitches ordered by specific intervals built upon the tonic).
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Major Key</strong>: Built using the interval pattern "W-W-H-W-W-W-H" (whole and half steps) starting from the tonic. It generally evokes a bright, cheerful, and stable character.</li>
                <li><strong>Minor Key</strong>: Built using the interval pattern "W-H-W-W-H-W-W" (natural minor) from the tonic. It generally projects a dark, melancholic, or serious mood.</li>
              </ul>
              <p style={{ margin: 0, marginTop: '10px' }}>
                Knowing the key is essential for performing and arranging. It lets musicians construct melodies within the correct scale, develop harmonic progressions naturally, and transpose chords to match any vocal or instrumental range.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>3. Real-time Chromagram Analysis</h3>
              <p style={{ margin: 0, marginBottom: '10px' }}>
                The Chroma Wheel is an analysis panel that visualizes the octave-independent energy distribution of the 12 chromatic semitones (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) on a circular layout in real-time.
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Frequency Analysis (FFT)</strong>: The incoming audio stream is processed via Discrete Fourier Transform algorithms to generate frequency-domain spectral data.</li>
                <li><strong>Chroma Vector Mapping</strong>: The computed frequency magnitudes are grouped into pitch classes. This means energies from different octaves (e.g., C3, C4, C5) are folded into a single 'C' chroma bin.</li>
                <li><strong>Visual Feedback</strong>: By observing the live Chroma Wheel, you can instantly see which notes make up the sounding chords and identify the dominant pitches shaping the melody.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>4. Krumhansl-Schmuckler Key Finding Algorithm</h3>
              <p style={{ margin: 0 }}>
                To predict the key from chroma data, WhichKey uses the Krumhansl-Schmuckler key-finding model, a standard in cognitive musicology. Each of the 24 major and minor keys has a distinct "Key Profile" distribution representing the hierarchical cognitive hierarchy of pitches. The application calculates the Pearson Correlation Coefficient between the live chroma buffer and these 24 key profiles in real-time. The key with the highest correlation coefficient is chosen as the Primary Key, and closely matching runner-ups are shown as Alternative Keys, minimizing errors caused by background noise or complex instrumental overtones.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>5. Diatonic Chords and Harmonic Functions</h3>
              <p style={{ margin: 0, marginBottom: '10px' }}>
                Once a key is established, it defines seven diatonic chords built sequentially using only the notes belonging to that key's scale. Each chord performs a specific harmonic function:
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>I (Tonic)</strong>: The home chord of the key, providing the ultimate sense of rest, stability, and resolution.</li>
                <li><strong>IV (Subdominant)</strong>: Adds movement and harmonic color, serving as an excellent bridge between the Tonic and the Dominant.</li>
                <li><strong>V (Dominant)</strong>: Contains high tension and naturally drives a strong pull (resolution) back to the stable Tonic (I chord).</li>
              </ul>
              <p style={{ margin: 0, marginTop: '10px' }}>
                Referencing the diatonic chords mapped by WhichKey helps with impromptu jams when sheets are unavailable, coordinating band flow, and guiding songwriting or arrangement tasks.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>6. Transposition & Capo Placement Tips</h3>
              <p style={{ margin: 0 }}>
                The Transposition panel is highly useful when shifting keys to accommodate a singer's vocal range or different instruments. It computes the semitone distance between the original key and the target key. In addition, it provides capo fret recommendations for acoustic guitarists, and transposed pitch references for transposing instruments (such as B-flat and E-flat brass/woodwinds), facilitating rapid collaboration during rehearsals.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>7. Tempo (BPM) Measurement & Metronome Practice</h3>
              <p style={{ margin: 0 }}>
                BPM (Beats Per Minute) is the standard measure of musical tempo. WhichKey supports both auto-detection (which monitors rhythmic transient peaks in drums and bass to calculate speed) and Tap Tempo (which lets users tap to the beat). The measured or typed BPM syncs instantly with the high-precision Web Audio metronome, enabling musicians to practice with perfect timing and maintain a steady tempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <AdSlot type="horizontal" />

      {/* Footer & AdSense Compliance Policies */}
      <footer className="app-footer">
        <div className="footer-links">
          <a href="/about.html" onClick={(e) => { e.preventDefault(); setView('about'); window.scrollTo(0, 0); }}>About</a>
          <a href="/privacy.html" onClick={(e) => { e.preventDefault(); setView('privacy'); window.scrollTo(0, 0); }}>Privacy Policy</a>
          <a href="/terms.html" onClick={(e) => { e.preventDefault(); setView('terms'); window.scrollTo(0, 0); }}>Terms of Service</a>
        </div>
        <p>&copy; {new Date().getFullYear()} WhichKey. All Rights Reserved.</p>
        <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.4 }}>All audio data is analyzed locally in real-time inside your browser and is never sent to a server (100% On-Device).</p>
      </footer>
    </div>
  );
}

export default App;
