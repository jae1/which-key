import { useState } from 'react';
import './App.css';
import { useAudioEngine } from './hooks/useAudioEngine';
import { ThemeToggle } from './components/ThemeToggle';
import { ChromaWheel } from './components/ChromaWheel';
import { KeyDisplay } from './components/KeyDisplay';
import { BpmDisplay } from './components/BpmDisplay';
import { Metronome } from './components/Metronome';
import { Transposition } from './components/Transposition';
import { AdSlot } from './components/AdSlot';

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
    errorMsg,
    getAudioContext,
  } = useAudioEngine();

  // Dialog states for Google AdSense compliance (Privacy Policy, About, Terms)
  const [activeModal, setActiveModal] = useState<'privacy' | 'about' | 'terms' | null>(null);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  const handleCloseModal = () => setActiveModal(null);

  return (
    <div className="app-container">
      {/* 1. App Header */}
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
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '-4px' }}>실시간 악기 키 & BPM 분석기</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
        </div>
      </header>

      {/* Top Banner AdSlot */}
      <AdSlot type="horizontal" />

      {/* 2. Error Message Area */}
      {errorMsg && (
        <div style={{ 
          background: 'var(--danger-glow)', 
          border: '1px solid var(--danger)', 
          color: 'var(--text-primary)', 
          padding: '12px 16px', 
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {errorMsg}
        </div>
      )}

      {/* 3. Main Dashboard Grid */}
      <main className="app-grid">
        
        {/* Left Column (Visualizer & Action controls, Transposer) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Visualizer and Control Panel */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>오디오 주파수 분석 (Chroma Wheel)</h2>
            <p style={{ fontSize: '13px', marginBottom: '12px', maxWidth: '320px' }}>
              연주 소리의 음계를 실시간 주파수로 변환하여 12가지 음의 크기를 정밀 시각화합니다.
            </p>

            {/* Circular Canvas Visualizer */}
            <ChromaWheel 
              chromagram={chromagram} 
              inputLevel={inputLevel} 
              isMonitoring={isMonitoring} 
            />

            {/* Input Audio Level Meter (Horizontal Bar) */}
            {isMonitoring && (
              <div style={{ width: '100%', maxWidth: '300px', margin: '12px 0 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>입력 레벨 (Mic Volume)</span>
                  <span>{inputLevel}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: `${inputLevel}%`, 
                      height: '100%', 
                      background: 'linear-gradient(to right, var(--secondary), var(--primary))',
                      borderRadius: '4px',
                      transition: 'width 0.1s ease'
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Start / Stop Button */}
            <button
              onClick={toggleMonitoring}
              className={isMonitoring ? 'btn-danger' : 'btn-primary'}
              style={{ 
                padding: '14px 28px', 
                fontSize: '16px', 
                borderRadius: '12px',
                width: '100%',
                maxWidth: '300px',
                boxShadow: isMonitoring ? 'none' : '0 4px 14px rgba(var(--primary-rgb), 0.3)'
              }}
            >
              {isMonitoring ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                  분석 중지 (Stop Monitoring)
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                  </svg>
                  분석 시작 (Start Monitoring)
                </>
              )}
            </button>
          </div>

          {/* Diatonic Chord Transposer */}
          <Transposition detectedKey={detectedKey} />

        </div>

        {/* Right Column (Detected Key, BPM tracker, Metronome, Ads) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Real-time Key Display */}
          <KeyDisplay 
            detectedKey={detectedKey}
            confidence={confidence}
            alternativeKeys={alternativeKeys}
            isMonitoring={isMonitoring}
          />

          {/* BPM display */}
          <BpmDisplay 
            bpm={bpm}
            isBeat={isBeat}
            manualBpm={manualBpm}
            tapTempo={tapTempo}
            resetBpm={resetBpm}
            isMonitoring={isMonitoring}
          />

          {/* Precision Metronome */}
          <Metronome 
            currentBpm={manualBpm > 0 ? manualBpm : (bpm || 120)}
            getAudioContext={getAudioContext}
          />

          {/* Sidebar Ad Slot */}
          <AdSlot type="sidebar" />

        </div>

      </main>

      {/* Bottom Horizontal Ad Slot */}
      <AdSlot type="horizontal" />

      {/* 4. Footer & AdSense Compliance Policies */}
      <footer className="app-footer">
        <div className="footer-links">
          <a href="#about" onClick={(e) => { e.preventDefault(); setActiveModal('about'); }}>서비스 소개</a>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>개인정보처리방침</a>
          <a href="#terms" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>이용약관</a>
        </div>
        <p>&copy; {new Date().getFullYear()} WhichKey. All Rights Reserved. Designed for Worship Teams.</p>
        <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.5 }}>본 서비스는 기기 마이크의 오디오 데이터를 외부 서버로 전송하지 않고 브라우저 내에서 안전하게 실시간으로 분석합니다.</p>
      </footer>

      {/* 5. Modals for Policy Compliance (Google AdSense Requirements) */}
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
