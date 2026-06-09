import { useEffect } from 'react';

interface AdSlotProps {
  type: 'horizontal' | 'sidebar';
}

export function AdSlot({ type }: AdSlotProps) {
  useEffect(() => {
    // Proactively initialize Google Adsense unit if the adsbygoogle script is loaded in window
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('Google AdSense initialization failed (this is normal before verification):', err);
    }
  }, []);

  const slotClass = type === 'horizontal' ? 'ad-slot-horizontal' : 'ad-slot-sidebar';
  const displayLabel = type === 'horizontal' ? '광고 영역 (Horizontal Ad Unit)' : '추천 링크 (Sidebar Ad Unit)';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 
        DEVELOPER NOTE:
        구글 애드센스 연동 시 아래 주석을 풀고 본인의 client, slot 번호를 입력하세요.
        또한 public/index.html 헤더 부분에 애드센스 스크립트가 로드되어 있어야 작동합니다.
      */}
      
      {/*
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="XXXXXXXXXX"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      */}

      {/* Placeholder visually matching our Midnight Glow/Nordic Clean glassmorphism styling */}
      <div className={slotClass}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2px' }}>{displayLabel}</span>
          <span style={{ fontSize: '9px', opacity: 0.5 }}>AdSense Ready</span>
        </div>
      </div>
    </div>
  );
}
