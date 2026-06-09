import { useState, useEffect, useRef } from 'react';

interface MetronomeProps {
  currentBpm: number; // Tapped or detected BPM
  getAudioContext: () => AudioContext;
  hideHeader?: boolean;
}

export function Metronome({ currentBpm, getAudioContext }: MetronomeProps) {
  const [bpm, setBpm] = useState(currentBpm > 0 ? currentBpm : 120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4); // Numerator (default 4)
  const [beatValue, setBeatValue] = useState(4); // Denominator (default 4)
  const [currentBeat, setCurrentBeat] = useState(0);

  // Sync with currentBpm if it changes and is valid
  useEffect(() => {
    if (currentBpm > 0) {
      setBpm(currentBpm);
    }
  }, [currentBpm]);

  // Scheduler variables
  const schedulerTimerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatIndexRef = useRef(0); // 0 to beatsPerMeasure-1
  const lookahead = 25.0; // How frequently to call scheduler (ms)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

  // Mutable refs to prevent stale state in scheduling loop
  const stateRef = useRef({ bpm, isPlaying, beatsPerMeasure });
  stateRef.current = { bpm, isPlaying, beatsPerMeasure };

  // Play click sound using Audio Context
  const playClick = (time: number, isAccent: boolean) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Create oscillator and gain node
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // High accent tone (900Hz) on beat 1, normal tone (550Hz) on others
    osc.frequency.setValueAtTime(isAccent ? 900 : 550, time);
    
    // Quick decay envelope to make a click sound
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.1);
  };

  // Scheduler loop: schedules clicks ahead of time
  const scheduler = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // While there are notes to play before the next lookahead window
    while (nextBeatTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const { beatsPerMeasure: bpmMeasure } = stateRef.current;
      const isAccent = beatIndexRef.current === 0;

      // Play the click
      playClick(nextBeatTimeRef.current, isAccent);
      
      // Update UI state synchronized with the schedule time
      const scheduledBeat = beatIndexRef.current;
      const delay = (nextBeatTimeRef.current - ctx.currentTime) * 1000;
      
      // Schedule visual update
      setTimeout(() => {
        if (stateRef.current.isPlaying) {
          setCurrentBeat(scheduledBeat);
        }
      }, Math.max(0, delay));

      // Advance next beat time based on BPM
      const secondsPerBeat = 60.0 / stateRef.current.bpm;
      nextBeatTimeRef.current += secondsPerBeat;

      // Advance beat index
      beatIndexRef.current = (beatIndexRef.current + 1) % bpmMeasure;
    }

    schedulerTimerRef.current = window.setTimeout(scheduler, lookahead);
  };

  const toggleMetronome = async () => {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (isPlaying) {
      // Stop
      if (schedulerTimerRef.current !== null) {
        clearTimeout(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      // Start
      setIsPlaying(true);
      nextBeatTimeRef.current = ctx.currentTime + 0.05;
      beatIndexRef.current = 0;
      setCurrentBeat(0);
      scheduler();
    }
  };

  // Adjust BPM manually
  const adjustBpm = (amount: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + amount)));
  };

  // Cleanup metronome timers
  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current !== null) {
        clearTimeout(schedulerTimerRef.current);
      }
    };
  }, []);

  // Update loop if isPlaying changed externally
  useEffect(() => {
    const { isPlaying: isCurrentlyPlaying } = stateRef.current;
    if (!isPlaying && isCurrentlyPlaying) {
      if (schedulerTimerRef.current !== null) {
        clearTimeout(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
      }
    }
  }, [isPlaying]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', height: '100%', justifyContent: 'center', padding: '8px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        
        {/* BPM Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => adjustBpm(-5)} 
            className="btn-secondary" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, fontSize: '12px', fontWeight: 600 }}
            title="5 BPM 감소"
          >
            -5
          </button>
          <button 
            onClick={() => adjustBpm(-1)} 
            className="btn-secondary" 
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0, fontSize: '16px', fontWeight: 600 }}
            title="1 BPM 감소"
          >
            -
          </button>
          
          <div style={{ textAlign: 'center', minWidth: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="number"
              value={bpm === 0 ? '' : bpm}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  // Allow typing, clamp loosely to 300 during typing
                  setBpm(Math.min(300, Math.max(0, val)));
                } else {
                  setBpm(0); // Allow clearing input temporary
                }
              }}
              onBlur={() => {
                const clamped = Math.min(240, Math.max(40, bpm === 0 ? 120 : bpm));
                setBpm(clamped);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const clamped = Math.min(240, Math.max(40, bpm === 0 ? 120 : bpm));
                  setBpm(clamped);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              style={{
                fontSize: '42px',
                fontWeight: 800,
                color: 'var(--primary)',
                lineHeight: 1,
                width: '90px',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                borderBottom: '2.5px dashed var(--border-color)',
                outline: 'none',
                fontFamily: 'Outfit, var(--font-sans)',
                padding: '2px 0',
                margin: 0
              }}
              title="BPM을 직접 숫자로 입력할 수 있습니다."
            />
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>BPM</span>
          </div>
          
          <button 
            onClick={() => adjustBpm(1)} 
            className="btn-secondary" 
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0, fontSize: '16px', fontWeight: 600 }}
            title="1 BPM 증가"
          >
            +
          </button>
          <button 
            onClick={() => adjustBpm(5)} 
            className="btn-secondary" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, fontSize: '12px', fontWeight: 600 }}
            title="5 BPM 증가"
          >
            +5
          </button>
        </div>

        {/* Large, High-Visibility Beat Ticks */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          margin: '12px 0', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          width: '100%',
          maxWidth: '280px',
          padding: '4px',
          background: 'rgba(128,128,128,0.01)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px'
        }}>
          {Array.from({ length: beatsPerMeasure }).map((_, i) => {
            const isActive = isPlaying && currentBeat === i;
            const isAccent = i === 0;
            return (
              <div
                key={i}
                style={{
                  flexGrow: 1,
                  minWidth: '40px',
                  maxWidth: '60px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: isActive 
                    ? (isAccent ? 'var(--accent)' : 'var(--primary)')
                    : 'var(--border-color)',
                  border: isAccent ? '2px solid var(--accent)' : 'none',
                  boxShadow: isActive 
                    ? `0 0 16px ${isAccent ? 'var(--accent)' : 'var(--primary)'}`
                    : 'none',
                  transition: 'all 0.08s ease'
                }}
              />
            );
          })}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: '16px', width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
          
          {/* Custom Time Signature Selector (Numerator / Denominator separately) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>박자:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <select 
                value={beatsPerMeasure} 
                onChange={(e) => {
                  setBeatsPerMeasure(Number(e.target.value));
                  beatIndexRef.current = 0;
                  setCurrentBeat(0);
                }} 
                className="select-input"
                style={{ padding: '6px 8px', fontSize: '13px', minWidth: '48px', textAlign: 'center' }}
                title="마디당 비트 수 (분자)"
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 'bold' }}>/</span>
              <select 
                value={beatValue} 
                onChange={(e) => setBeatValue(Number(e.target.value))} 
                className="select-input"
                style={{ padding: '6px 8px', fontSize: '13px', minWidth: '48px', textAlign: 'center' }}
                title="비트 단위 (분모)"
              >
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="16">16</option>
              </select>
            </div>
          </div>

          {/* Play / Stop Button */}
          <button
            onClick={toggleMetronome}
            className={isPlaying ? 'btn-danger' : 'btn-primary'}
            style={{ flexGrow: 1, maxWidth: '140px', padding: '8px 18px', fontSize: '14px', borderRadius: '8px' }}
          >
            {isPlaying ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                정지
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                시작
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
