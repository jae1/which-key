import { useEffect } from 'react';

interface AdSlotProps {
  type: 'horizontal' | 'sidebar';
}

export function AdSlot({ type }: AdSlotProps) {
  const adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // User should replace this with real publisher ID
  const isPlaceholder = adClient.includes("XXXXXX");

  useEffect(() => {
    if (isPlaceholder) return;
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (err) {
      // Quietly ignore in development
    }
  }, [isPlaceholder]);

  if (isPlaceholder) {
    return null; // Keep layout completely clean and prevent console errors during AdSense review
  }

  const style = type === 'horizontal' 
    ? { minHeight: '90px', width: '100%', display: 'flex', justifyContent: 'center', margin: '8px 0' }
    : { minHeight: '250px', width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 0' };

  return (
    <div style={style}>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', height: '100%' }}
           data-ad-client={adClient}
           data-ad-slot="XXXXXXXXXX"               // Replace with real Slot ID
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
