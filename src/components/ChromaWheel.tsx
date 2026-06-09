import { useEffect, useRef } from 'react';
import { NOTE_NAMES } from '../utils/KeyFinder';

interface ChromaWheelProps {
  chromagram: number[];
  inputLevel: number; // 0 to 100
  isMonitoring: boolean;
}

// Map 12 notes to a beautiful chromatic color wheel
function getNoteColor(index: number, opacity: number = 1): string {
  // Custom HSL values representing the chromatic color circle
  // Starting at Red for C, and moving around the hue spectrum (360 degrees)
  const hue = (index * 30) % 360; 
  return `hsla(${hue}, 85%, 60%, ${opacity})`;
}

export function ChromaWheel({ chromagram, inputLevel, isMonitoring }: ChromaWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Keep a ref to the latest data to prevent closure staleness in loop
  const dataRef = useRef({ chromagram, inputLevel, isMonitoring });
  dataRef.current = { chromagram, inputLevel, isMonitoring };

  // Setup interpolation arrays for smooth visual rendering
  const prevChroma = useRef<number[]>(new Array(12).fill(0));
  const prevLevel = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { chromagram: currentChroma, inputLevel: currentLevel, isMonitoring: active } = dataRef.current;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY) - 30;

      // Clear with slight alpha to get a subtle motion blur trail
      ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'light' 
        ? 'rgba(248, 250, 252, 0.25)'  // Light theme clear
        : 'rgba(9, 10, 21, 0.25)';      // Dark theme clear
      ctx.fillRect(0, 0, width, height);

      // Smooth the transitions slightly for visuals
      for (let i = 0; i < 12; i++) {
        prevChroma.current[i] += (currentChroma[i] - prevChroma.current[i]) * 0.2;
      }
      prevLevel.current += (currentLevel - prevLevel.current) * 0.15;

      const levelFactor = prevLevel.current / 100;
      const baseRadius = maxRadius * 0.35;

      // 1. Draw input level ripple in the background (glowing pulse)
      if (active && prevLevel.current > 1) {
        ctx.beginPath();
        // Core pulse radius depends on input volume
        const pulseRadius = baseRadius + (maxRadius - baseRadius) * levelFactor * 0.8;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, pulseRadius);
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        
        if (isDark) {
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.08)');
          gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.04)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(124, 58, 237, 0.06)');
          gradient.addColorStop(0.5, 'rgba(8, 145, 178, 0.03)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw concentric guidelines
      ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'light'
        ? 'rgba(15, 23, 42, 0.04)'
        : 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let r = 0.5; r <= 1.0; r += 0.25) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + (maxRadius - baseRadius) * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Draw Chroma Petals (The 12 Notes distribution)
      const angleStep = (Math.PI * 2) / 12;

      // Draw connections/polygon first to fill inside
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        // Rotate C to the top (-90 degrees)
        const angle = i * angleStep - Math.PI / 2;
        const val = active ? prevChroma.current[i] : 0.02; // Show tiny default ring when inactive
        
        // Map 0-1 energy value to radial length
        const radius = baseRadius + (maxRadius - baseRadius) * val;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      // Fill central polygon with semi-transparent primary color
      ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'light'
        ? 'rgba(124, 58, 237, 0.05)'
        : 'rgba(139, 92, 246, 0.03)';
      ctx.fill();
      ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'light'
        ? 'rgba(15, 23, 42, 0.08)'
        : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw individual note lines and colored endpoints
      for (let i = 0; i < 12; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const val = active ? prevChroma.current[i] : 0;
        
        const radius = baseRadius + (maxRadius - baseRadius) * val;
        const xStart = centerX + Math.cos(angle) * baseRadius;
        const yStart = centerY + Math.sin(angle) * baseRadius;
        const xEnd = centerX + Math.cos(angle) * radius;
        const yEnd = centerY + Math.sin(angle) * radius;

        // Draw note spoke line
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.strokeStyle = getNoteColor(i, active ? 0.3 + val * 0.5 : 0.1);
        ctx.lineWidth = active ? 2 + val * 3 : 1;
        ctx.stroke();

        // Draw glowing point at the end of the spoke
        if (active && val > 0.05) {
          ctx.beginPath();
          ctx.arc(xEnd, yEnd, 4 + val * 5, 0, Math.PI * 2);
          ctx.fillStyle = getNoteColor(i, 0.8);
          // Add glow effect in canvas
          ctx.shadowColor = getNoteColor(i, 1);
          ctx.shadowBlur = 10 * val;
          ctx.fill();
          // Reset shadow
          ctx.shadowBlur = 0;
        }

        // 3. Draw Note Labels (A, A#, B...) around the outside
        const labelRadius = maxRadius + 18;
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;

        ctx.font = active && val > 0.4
          ? 'bold 15px var(--font-sans)'
          : '500 13px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Colored label highlighting for active notes
        if (active && val > 0.3) {
          ctx.fillStyle = getNoteColor(i, 1.0);
        } else {
          ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'light'
            ? 'var(--text-secondary)'
            : 'var(--text-secondary)';
        }

        ctx.fillText(NOTE_NAMES[i], labelX, labelY);
      }

      // 4. Center Circle/Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - 2, 0, Math.PI * 2);
      ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'light'
        ? '#ffffff'
        : '#121424';
      ctx.fill();
      ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'light'
        ? 'rgba(0,0,0,0.08)'
        : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center Core Label/Mic Icon
      if (active) {
        // Red flashing record dot
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--danger)';
        ctx.fill();
      } else {
        // Inactive mic status icon placeholder (just a clean dot)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--text-muted)';
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '10px 0' }}>
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        style={{
          width: '340px',
          height: '340px',
          maxWidth: '100%',
        }}
      />
    </div>
  );
}
