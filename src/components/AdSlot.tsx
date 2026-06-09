import { useEffect } from 'react';

interface AdSlotProps {
  type: 'horizontal' | 'sidebar';
}

export function AdSlot({ type }: AdSlotProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (err) {
      // Quietly ignore in development
    }
  }, []);

  const style = type === 'horizontal' 
    ? { minHeight: '90px', width: '100%', display: 'flex', justifyContent: 'center', margin: '8px 0' }
    : { minHeight: '250px', width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 0' };

  return (
    <div style={style}>
      {/* 
        Google AdSense Unit:
        Below is the placeholder where AdSense will inject the actual advertisement.
        No artificial borders or placeholders are shown in production to keep the design clean.
      */}
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', height: '100%' }}
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with real Publisher ID
           data-ad-slot="XXXXXXXXXX"               // Replace with real Slot ID
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
