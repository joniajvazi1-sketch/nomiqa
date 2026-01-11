import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Enhanced sound effects hook with distinct sounds for different app events
 * Provides premium audio feedback for key interactions
 */
export const useEnhancedSounds = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEffectsEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('soundEffectsEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (iOS requirement)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // ===== SOUND FUNCTIONS =====

  /**
   * Light tick - for navigation and light interactions
   */
  const playTick = useCallback(() => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.04, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.025);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.025);
  }, [soundEnabled, initAudioContext]);

  /**
   * Pop sound - for add to cart, toggles
   */
  const playPop = useCallback(() => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const now = context.currentTime;
    
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Start high and drop (pop effect)
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }, [soundEnabled, initAudioContext]);

  /**
   * Coin/ding sound - for earning points
   */
  const playCoin = useCallback(() => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const now = context.currentTime;
    
    // Two-tone coin sound
    const frequencies = [1200, 1500];
    
    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = now + index * 0.08;
      const volume = 0.08;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.25);
    });
  }, [soundEnabled, initAudioContext]);

  /**
   * Success ding - for confirmations
   */
  const playSuccess = useCallback(() => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const now = context.currentTime;
    
    // Pleasant chord: C5 + E5 + G5
    const frequencies = [523.25, 659.25, 783.99];
    
    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const volume = 0.08 / (index + 1);
      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      oscillator.start(now);
      oscillator.stop(now + 0.4);
    });
  }, [soundEnabled, initAudioContext]);

  /**
   * Achievement fanfare - for unlocks and milestones
   */
  const playCelebration = useCallback(() => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const now = context.currentTime;
    
    // Ascending arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    
    notes.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = now + index * 0.1;
      const volume = 0.1;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  }, [soundEnabled, initAudioContext]);

  /**
   * Error buzz - for validation errors
   */
  const playError = useCallback(() => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const now = context.currentTime;
    
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Low buzz
    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }, [soundEnabled, initAudioContext]);

  /**
   * Swoosh - for page transitions
   */
  const playSwoosh = useCallback(() => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const now = context.currentTime;
    
    // White noise filtered for swoosh effect
    const bufferSize = context.sampleRate * 0.15;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gainNode = context.createGain();
    
    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    filter.Q.value = 1;
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);
    
    gainNode.gain.setValueAtTime(0.03, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    noise.start(now);
    noise.stop(now + 0.15);
  }, [soundEnabled, initAudioContext]);

  /**
   * Notification ping - for alerts
   */
  const playNotification = useCallback(() => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const now = context.currentTime;
    
    // Two-tone notification
    const frequencies = [880, 1100];
    
    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = now + index * 0.12;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }, [soundEnabled, initAudioContext]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev: boolean) => !prev);
  }, []);

  return {
    soundEnabled,
    toggleSound,
    // Sounds
    playTick,
    playPop,
    playCoin,
    playSuccess,
    playCelebration,
    playError,
    playSwoosh,
    playNotification,
  };
};
