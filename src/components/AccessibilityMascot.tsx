import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { animated, config, useTransition } from '@react-spring/web';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { CircleHalf } from '@phosphor-icons/react/dist/csr/CircleHalf';
import { CursorClick } from '@phosphor-icons/react/dist/csr/CursorClick';
import { Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { SpeakerSimpleX } from '@phosphor-icons/react/dist/csr/SpeakerSimpleX';
import { TextAa } from '@phosphor-icons/react/dist/csr/TextAa';
import { X } from '@phosphor-icons/react/dist/csr/X';

type AccessibilityMascotProps = {
  isSoundOn: boolean;
  onSoundToggle: () => void;
};

type Preferences = {
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  enhancedFocus: boolean;
};

const defaultPreferences: Preferences = {
  reduceMotion: false,
  largeText: false,
  highContrast: false,
  enhancedFocus: false,
};

const preferenceKey = 'portfolio-accessibility-preferences';
const frameDuration = 220;
const curlFrames = [
  '/mascot/Curl_01.png',
  '/mascot/Curl_02.png',
  '/mascot/Curl_03.png',
  '/mascot/Curl_04.png',
  '/mascot/Curl_05.png',
  '/mascot/Curl_06.png',
  '/mascot/Curl_05.png',
  '/mascot/Curl_04.png',
  '/mascot/Curl_03.png',
  '/mascot/Curl_02.png',
] as const;
const attentionFrame = '/mascot/attentive.png';

function loadPreferences() {
  try {
    const saved = window.localStorage.getItem(preferenceKey);
    return saved
      ? { ...defaultPreferences, ...(JSON.parse(saved) as Partial<Preferences>) }
      : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export default function AccessibilityMascot({
  isSoundOn,
  onSoundToggle,
}: AccessibilityMascotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [systemReducedMotion, setSystemReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [isPageVisible, setIsPageVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const [panelMotionAllowed, setPanelMotionAllowed] = useState(true);
  const controlRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const motionIsReduced = preferences.reduceMotion || systemReducedMotion;
  const shouldLoop = !isOpen && !motionIsReduced && isPageVisible;

  useEffect(() => {
    const images = [...new Set([...curlFrames, attentionFrame])].map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });

    return () => images.forEach((image) => (image.src = ''));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setSystemReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () =>
      setIsPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!shouldLoop) return;

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % curlFrames.length);
    }, frameDuration);

    return () => window.clearInterval(timer);
  }, [shouldLoop]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.userMotion = preferences.reduceMotion ? 'reduced' : 'full';
    root.dataset.textSize = preferences.largeText ? 'large' : 'default';
    root.dataset.contrast = preferences.highContrast ? 'high' : 'default';
    root.dataset.focus = preferences.enhancedFocus ? 'enhanced' : 'default';
    window.localStorage.setItem(preferenceKey, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!isOpen) return;
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isOpen]);

  const closeMenu = useCallback((animate = false) => {
    setPanelMotionAllowed(animate);
    setIsOpen(false);
    setFrameIndex(0);
    window.requestAnimationFrame(() => mascotRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMenu(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !controlRef.current?.contains(target)) {
        closeMenu(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [closeMenu, isOpen]);

  const togglePreference = (key: keyof Preferences) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const activateMascot = (pointerInitiated: boolean) => {
    setPanelMotionAllowed(pointerInitiated);

    if (isOpen) {
      closeMenu(pointerInitiated);
      return;
    }

    setFrameIndex(0);
    setIsOpen(true);
  };

  const onMascotActivate = (event: ReactMouseEvent<HTMLButtonElement>) => {
    activateMascot(event.detail > 0);
  };

  const onMascotKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activateMascot(false);
  };

  const panelTransition = useTransition(isOpen, {
    from: { opacity: 0, transform: 'translate3d(-6px, 8px, 0) scale(0.97)' },
    enter: { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
    leave: { opacity: 0, transform: 'translate3d(-4px, 6px, 0) scale(0.98)' },
    config: config.stiff,
    immediate: motionIsReduced || !panelMotionAllowed,
  });

  const currentFrame = isOpen ? attentionFrame : curlFrames[frameIndex];

  return (
    <div
      ref={controlRef}
      className="mascot-control"
      data-open={isOpen}
      data-motion={motionIsReduced ? 'static' : 'animated'}
    >
      {panelTransition((style, item) =>
        item ? (
          <animated.section
            id="accessibility-preferences"
            className="accessibility-panel"
            role="dialog"
            aria-label="Accessibility preferences"
            aria-hidden={!isOpen}
            inert={!isOpen}
            style={{ ...style, pointerEvents: isOpen ? 'auto' : 'none' }}
          >
            <div className="accessibility-panel-heading">
              <div>
                <p className="accessibility-panel-title">
                  You caught me mid set! Alright...make this site yours
                </p>
                <p className="accessibility-panel-caption">
                  These settings stay on your device
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="panel-close interactive-control"
                onClick={(event) => closeMenu(event.detail > 0)}
                aria-label="Close accessibility settings"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="preference-list">
              <PreferenceToggle
                label="Reduced motion"
                icon={<Eye size={24} aria-hidden="true" />}
                checked={preferences.reduceMotion}
                onClick={() => togglePreference('reduceMotion')}
              />
              <PreferenceToggle
                label="Larger text"
                icon={<TextAa size={24} aria-hidden="true" />}
                checked={preferences.largeText}
                onClick={() => togglePreference('largeText')}
              />
              <PreferenceToggle
                label="Higher contrast"
                icon={<CircleHalf size={24} aria-hidden="true" />}
                checked={preferences.highContrast}
                onClick={() => togglePreference('highContrast')}
              />
              <PreferenceToggle
                label="Stronger focus"
                icon={<CursorClick size={24} aria-hidden="true" />}
                checked={preferences.enhancedFocus}
                onClick={() => togglePreference('enhancedFocus')}
              />
              <PreferenceToggle
                label="No sound"
                icon={<SpeakerSimpleX size={24} aria-hidden="true" />}
                checked={!isSoundOn}
                onClick={onSoundToggle}
              />
            </div>

            <button
              type="button"
              className="reset-preferences"
              onClick={() => setPreferences(defaultPreferences)}
            >
              <ArrowCounterClockwise size={24} aria-hidden="true" />
              Reset visual preferences
            </button>
          </animated.section>
        ) : null,
      )}

      <button
        ref={mascotRef}
        type="button"
        className="mascot-button"
        aria-label={
          isOpen ? 'Close accessibility settings' : 'Open accessibility settings'
        }
        aria-expanded={isOpen}
        aria-controls="accessibility-preferences"
        onClick={onMascotActivate}
        onKeyDown={onMascotKeyDown}
      >
        <span className="mascot-art" aria-hidden="true">
          <img
            src={currentFrame}
            alt=""
            className="mascot-pose"
            draggable="false"
            decoding="async"
          />
        </span>
      </button>
    </div>
  );
}

type PreferenceToggleProps = {
  label: string;
  icon: ReactNode;
  checked: boolean;
  onClick: () => void;
};

function PreferenceToggle({
  label,
  icon,
  checked,
  onClick,
}: PreferenceToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="preference-toggle"
      onClick={onClick}
    >
      <span className="preference-label">
        {icon}
        {label}
      </span>
      <span className="preference-switch" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}
