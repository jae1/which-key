import { useState, useEffect, useRef } from 'react';

interface MetronomeProps {
  currentBpm: number; // Tapped or detected BPM
  getAudioContext: () => AudioContext;
}

export function Metronome({ currentBpm, getAudioContext }: MetronomeProps) {
  const [bpm, setBpm] = useState(currentBpm > 0 ? currentBpm : 120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
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

    // High accent tone (1000Hz) on beat 1, normal tone (600Hz) on others
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

  // Handle beats per measure selector
  const handleMeasureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBeatsPerMeasure(Number(e.target.value));
    beatIndexRef.current = 0;
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
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700 }}>연습용 메트로놈 (Metronome)</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {/* BPM Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => adjustBpm(-5)} 
            className="btn-secondary" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
            title="5 BPM 감소"
          >
            -5
          </button>
          <button 
            onClick={() => adjustBpm(-1)} 
            className="btn-secondary" 
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
            title="1 BPM 감소"
          >
            -
          </button>
          
          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{bpm}</span>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>BPM</span>
          </div>
          
          <button 
            onClick={() => adjustBpm(1)} 
            className="btn-secondary" 
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
            title="1 BPM 증가"
          >
            +
          </button>
          <button 
            onClick={() => adjustBpm(5)} 
            className="btn-secondary" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
            title="5 BPM 증가"
          >
            +5
          </button>
        </div>

        {/* Beat ticks visualization */}
        <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
          {Array.from({ length: beatsPerMeasure }).map((_, i) => {
            const isActive = isPlaying && currentBeat === i;
            const isAccent = i === 0;
            return (
              <div
                key={i}
                style={{
                  width: '24px',
                  height: '12px',
                  borderRadius: '4px',
                  backgroundColor: isActive 
                    ? (isAccent ? 'var(--accent)' : 'var(--primary)')
                    : 'var(--border-color)',
                  border: isAccent ? '1px solid var(--accent)' : 'none',
                  boxShadow: isActive 
                    ? `0 0 10px ${isAccent ? 'var(--accent)' : 'var(--primary)'}`
                    : 'none',
                  transition: 'all 0.1s ease'
                }}
              />
            );
          })}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Beats Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>박자:</span>
            <select 
              value={beatsPerMeasure} 
              onChange={handleMeasureChange} 
              className="select-input"
              style={{ padding: '6px 12px', fontSize: '13px', minWidth: '80px' }}
            >
              <option value="2">2 / 4</option>
              <option value="3">3 / 4</option>
              <option value="4">4 / 4</option>
              <option value="6">6 / 8</option>
            </select>
          </div>

          {/* Play / Stop Button */}
          <button
            onClick={toggleMetronome}
            className={isPlaying ? 'btn-danger' : 'btn-primary'}
            style={{ flexGrow: 1, maxWidth: '140px', padding: '8px 16px' }}
          >
            {isPlaying ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                정지
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
