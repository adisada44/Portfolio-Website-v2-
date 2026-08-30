import { useCallback, useEffect, useRef, useState } from 'react';
import AccessibilityMascot from './components/AccessibilityMascot';
import MumbaiStatus from './components/MumbaiStatus';
import { ProfileBio, ProfileInterests } from './components/ProfileRail';
import QuickLinks from './components/QuickLinks';
import SoundToggle from './components/SoundToggle';
import WorkspaceGrid from './components/WorkspaceGrid';

type WebkitWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

function App() {
  const [isSoundOn, setIsSoundOn] = useState(false);
  const soundStateRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;

    const AudioContextConstructor =
      window.AudioContext || (window as WebkitWindow).webkitAudioContext;

    if (!AudioContextConstructor) return null;

    audioContextRef.current = new AudioContextConstructor();
    return audioContextRef.current;
  }, []);

  const toggleSound = useCallback(() => {
    const nextState = !soundStateRef.current;
    soundStateRef.current = nextState;
    setIsSoundOn(nextState);

    const audioContext = getAudioContext();
    if (!audioContext) return;

    if (nextState && audioContext.state === 'suspended') {
      void audioContext.resume();
    }

    if (!nextState && audioContext.state === 'running') {
      void audioContext.suspend();
    }
  }, [getAudioContext]);

  useEffect(() => {
    const playClickSound = () => {
      if (!soundStateRef.current) return;

      const audioContext = getAudioContext();
      if (!audioContext || audioContext.state !== 'running') return;

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        100,
        audioContext.currentTime + 0.05,
      );

      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.14, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.1,
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    };

    window.addEventListener('click', playClickSound);

    return () => {
      window.removeEventListener('click', playClickSound);
      const audioContext = audioContextRef.current;
      audioContextRef.current = null;
      if (audioContext && audioContext.state !== 'closed') {
        void audioContext.close();
      }
    };
  }, [getAudioContext]);

  return (
    <div className="app-shell min-h-dvh bg-canvas text-ink">
      <div className="app-layout">
        <div className="sound-region">
          <SoundToggle isSoundOn={isSoundOn} onToggle={toggleSound} />
        </div>

        <ProfileBio />

        <div className="workspace-shell">
          <WorkspaceGrid />
        </div>

        <ProfileInterests />
        <QuickLinks />

        <div className="weather-region">
          <MumbaiStatus />
        </div>
      </div>

      <AccessibilityMascot
        isSoundOn={isSoundOn}
        onSoundToggle={toggleSound}
      />
    </div>
  );
}

export default App;
