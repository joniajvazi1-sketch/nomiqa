import { useEffect, useRef, useState } from 'react';

export const useSoundEffects = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEffectsEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('soundEffectsEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playTick = () => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Subtle tick sound - short, high-pitched
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.05, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.03);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.03);
  };

  const playDing = () => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    
    // Create a pleasant "ding" with multiple harmonics
    const frequencies = [800, 1200, 1600]; // Harmonic series
    const now = context.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      // Volume decreases for higher harmonics
      const volume = 0.15 / (index + 1);
      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      oscillator.start(now);
      oscillator.stop(now + 0.6);
    });
  };

  const playCelebration = () => {
    if (!soundEnabled) return;
    
    const context = initAudioContext();
    const now = context.currentTime;
    
    // Create a celebratory ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = now + index * 0.08;
      const volume = 0.12;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  return {
    soundEnabled,
    toggleSound,
    playTick,
    playDing,
    playCelebration,
  };
};
