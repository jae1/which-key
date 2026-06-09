import { useEffect, useRef } from 'react';
import { NOTE_NAMES } from '../utils/KeyFinder';

interface ChromaWheelProps {
  chromagram: number[];
  inputLevel: number; // 0 to 100
  isMonitoring: boolean;
}

export function ChromaWheel({ chromagram, inputLevel, isMonitoring }: ChromaWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const dataRef = useRef({ chromagram, inputLevel, isMonitoring });
  dataRef.current = { chromagram, inputLevel, isMonitoring };

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

      // Detect current theme to match canvas background
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      
      ctx.fillStyle = isLight ? '#ffffff' : '#16161a';
      ctx.fillRect(0, 0, width, height);

      // Smooth data transition
      for (let i = 0; i < 12; i++) {
        prevChroma.current[i] += (currentChroma[i] - prevChroma.current[i]) * 0.15;
      }
      prevLevel.current += (currentLevel - prevLevel.current) * 0.15;

      const levelFactor = prevLevel.current / 100;
      const baseRadius = maxRadius * 0.35;

      // Brand color palette (minimalist indigo)
      const primaryColor = isLight ? '79, 70, 229' : '99, 102, 241'; // Indigo rgb
      const secondaryColor = isLight ? '37, 99, 235' : '59, 130, 246'; // Blue rgb

      // 1. Draw input level pulse (subtle outer ring outline)
      if (active && prevLevel.current > 1) {
        ctx.beginPath();
        const pulseRadius = baseRadius + (maxRadius - baseRadius) * levelFactor * 0.8;
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${secondaryColor}, ${0.03 + levelFactor * 0.05})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw concentric guidelines
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let r = 0.5; r <= 1.0; r += 0.25) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + (maxRadius - baseRadius) * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Draw Chroma Polygon (Connects all 12 note energies)
      const angleStep = (Math.PI * 2) / 12;

      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const val = active ? prevChroma.current[i] : 0.02;
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
      ctx.fillStyle = `rgba(${primaryColor}, ${active ? 0.04 : 0.01})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${primaryColor}, ${active ? 0.25 : 0.15})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw spoke lines and endpoints
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
        ctx.strokeStyle = `rgba(${primaryColor}, ${active ? 0.1 + val * 0.4 : 0.05})`;
        ctx.lineWidth = active ? 1 + val * 2 : 1;
        ctx.stroke();

        // Draw small dot on peak
        if (active && val > 0.05) {
          ctx.beginPath();
          ctx.arc(xEnd, yEnd, 3 + val * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${primaryColor}, ${0.6 + val * 0.4})`;
          ctx.fill();
        }

        // Draw Note Labels
        const labelRadius = maxRadius + 18;
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;

        ctx.font = active && val > 0.4
          ? '600 13px var(--font-sans)'
          : '400 12px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (active && val > 0.3) {
          ctx.fillStyle = `rgba(${primaryColor}, 1.0)`;
        } else {
          ctx.fillStyle = isLight ? '#71717a' : '#a1a1aa';
        }

        ctx.fillText(NOTE_NAMES[i], labelX, labelY);
      }

      // 3. Center Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - 2, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#ffffff' : '#16161a';
      ctx.fill();
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center Core active dot
      if (active) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5 + Math.sin(Date.now() / 150) * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryColor}, 0.8)`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? '#d4d4d8' : '#3f3f46';
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '4px 0' }}>
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        style={{
          width: '100%',
          maxWidth: '280px',
          height: 'auto',
          aspectRatio: '1 / 1',
        }}
      />
    </div>
  );
}
