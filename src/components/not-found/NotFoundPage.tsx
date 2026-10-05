import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createBlackHoleScene } from './blackHoleScene';
import { blackHoleConfig } from './config';
import { createTensionTimeline, setRestingLetters } from './tension';
import { createWorldEffects } from './worldEffects';
import { createFallbackHeroLayout } from './heroLayout';
import './not-found.css';

const SENTENCE = 'The contents here are missing because they were swallowed';

// Preserve each word's wrapping boundary while splitting only the requested tail.
function splitSentence(letterCount: number) {
  const words = SENTENCE.split(' ');
  const lastWord = words.pop()!;
  const count = Math.min(lastWord.length, Math.max(1, Math.round(letterCount)));
  return { prefix: words.join(' '), stem: lastWord.slice(0, -count), tail: lastWord.slice(-count) };
}

export default function NotFoundPage() {
  const filterId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const stageRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const sentenceRef = useRef<HTMLParagraphElement>(null);
  const configRef = useRef({ ...blackHoleConfig });
  const [settings, setSettings] = useState(() => ({ ...blackHoleConfig }));
  const { prefix, stem, tail } = splitSentence(settings.tensionLetters);
  const config = settings;
  // A cached, static tile: it adds no animation or per-frame noise generation.
  const grain = `<svg xmlns="http://www.w3.org/2000/svg" width="${config.grainTileSize}" height="${config.grainTileSize}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${config.grainFrequency}" numOctaves="${config.grainOctaves}" seed="${config.grainSeed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
  // Explicit vector strokes avoid subpixel gradient strips disappearing after
  // SVG displacement/rasterisation. Both axes remain on the same warped layer.
  const grid = `<svg xmlns="http://www.w3.org/2000/svg" width="${config.verticalLineSpacing}" height="${config.lineSpacing}" viewBox="0 0 ${config.verticalLineSpacing} ${config.lineSpacing}"><path d="M0 ${config.lineSpacing - config.lineThickness / 2}H${config.verticalLineSpacing}" fill="none" stroke="#666" stroke-width="${config.lineThickness}"/><path d="M${config.verticalLineSpacing - config.verticalLineThickness / 2} 0V${config.lineSpacing}" fill="none" stroke="#666" stroke-width="${config.verticalLineThickness}"/></svg>`;
  const pageStyle = {
    '--hole-width': `${config.stageWidthVw}vw`,
    '--hole-max-width': `${config.stageMaxWidth}px`,
    '--hole-mobile-width': `${config.mobileWidthVw}vw`,
    '--hero-content-width': `${config.contentWidthVw}vw`,
    '--hero-content-max-width': `${config.contentMaxWidth}px`,
    '--mobile-page-padding': `${config.mobilePagePadding}px`,
    '--mobile-text-reserve': `${config.mobileTextReserveVw}vw`,
    '--mobile-code-size': `${config.mobileCodeSize}px`,
    '--mobile-sentence-size': `${config.mobileSentenceSize}px`,
    '--mobile-sentence-line-height': config.mobileSentenceLineHeight,
    '--mobile-suffix-space': `${config.mobileSuffixSpaceEm}em`,
    '--text-warp-ratio': config.textWarpRatio,
    '--mobile-text-warp-ratio': config.mobileTextWarpRatio,
    '--hole-x': `${config.centerXPercent}%`,
    '--hole-y': `${config.centerYPercent}%`,
    '--hole-tilt': `${config.tiltDegrees}deg`,
    '--hole-asset-width': `${config.diskRadius * 2 / (config.cameraWidth * config.rayViewScale) * 100}%`,
    '--gravity-line-opacity': config.lineOpacity,
    '--gravity-line-spacing': `${config.lineSpacing}px`,
    '--gravity-vertical-spacing': `${config.verticalLineSpacing}px`,
    '--gravity-line-thickness': `${config.lineThickness}px`,
    '--gravity-grid-image': `url("data:image/svg+xml,${encodeURIComponent(grid)}")`,
    '--hole-spill-color': config.spillColor,
    '--hole-spill-fade': `${config.spillFadeStop * 100}%`,
    '--hole-shadow-inner': `${config.shadowInnerStop * 100}%`,
    '--hole-shadow-peak': `${config.shadowPeakStop * 100}%`,
    '--hole-shadow-color': config.shadowColor,
    '--grain-opacity': config.grainOpacity,
    '--grain-image': `url("data:image/svg+xml,${encodeURIComponent(grain)}")`,
  } as CSSProperties;

  useEffect(() => {
    const stage = stageRef.current;
    const root = rootRef.current;
    const visual = visualRef.current;
    const sentence = sentenceRef.current;
    if (!stage || !visual || !root || !sentence) return;
    const previousTitle = document.title;
    document.title = '404 — Aditya Sadashiv';
    const config = configRef.current;
    const letters = [...sentence.querySelectorAll<HTMLElement>('.swallow-letter')];
    setRestingLetters(letters);
    // Honor preferences saved on the homepage even on a direct deep link.
    try {
      const saved = JSON.parse(window.localStorage.getItem('portfolio-accessibility-preferences') || '{}') as Record<string, unknown>;
      const html = document.documentElement;
      html.dataset.userMotion = saved.reduceMotion === true ? 'reduced' : 'full';
      html.dataset.textSize = saved.largeText === true ? 'large' : 'default';
      html.dataset.contrast = saved.highContrast === true ? 'high' : 'default';
      html.dataset.focus = saved.enhancedFocus === true ? 'enhanced' : 'default';
    } catch { /* Restricted storage leaves system preferences in control. */ }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => config.previewReducedMotion || motion.matches || document.documentElement.dataset.userMotion === 'reduced';
    let scene;
    try {
      if (config.staticFallback) throw new Error('Static fallback preview');
      scene = createBlackHoleScene(visual, config, reduced());
      stage.dataset.webgl = 'ready';
    } catch {
      stage.dataset.webgl = 'unavailable';
      root.dataset.motion = 'static';
      root.dataset.playback = 'paused';
      const disposeFallback = createFallbackHeroLayout(visual, config);
      return () => { disposeFallback(); document.title = previousTitle; };
    }
    const tension = createTensionTimeline(letters, scene, config, visual);
    const world = createWorldEffects(root, scene, config);
    const feed = () => { if (!reduced()) scene.feed(); };
    root.addEventListener('hole-feed', feed);
    let onscreen = true;
    let webglAvailable = true;
    let disposeFallback: (() => void) | undefined;
    const syncPlayback = () => {
      const active = !document.hidden && onscreen && webglAvailable;
      scene.setActive(active);
      if (active && !reduced()) tension.timeline.play();
      else tension.timeline.pause();
      root.dataset.motion = reduced() ? 'reduced' : 'active';
      root.dataset.playback = active && !reduced() ? 'running' : 'paused';
    };
    const changeMotion = () => {
      scene.setReducedMotion(reduced());
      tension.reset();
      world.refresh();
      syncPlayback();
    };
    const resize = () => {
      if (!webglAvailable) return; // The image fallback owns its own layout observer.
      scene.refresh();
      tension.refresh();
      world.refresh();
      syncPlayback();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resizeObserver.observe(sentence);
    const intersectionObserver = new IntersectionObserver(entries => {
      onscreen = entries[0].isIntersecting;
      syncPlayback();
    });
    intersectionObserver.observe(visual);
    const preferenceObserver = new MutationObserver(changeMotion);
    preferenceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-user-motion'] });
    motion.addEventListener('change', changeMotion);
    document.addEventListener('visibilitychange', syncPlayback);
    window.addEventListener('resize', resize);
    const contextLost = (event: Event) => {
      event.preventDefault();
      webglAvailable = false;
      stage.dataset.webgl = 'unavailable';
      scene.setActive(false);
      tension.reset();
      setRestingLetters(letters);
      world.dispose();
      disposeFallback = createFallbackHeroLayout(visual, config);
      root.dataset.motion = 'static';
      root.dataset.playback = 'paused';
    };
    stage.querySelector('canvas')?.addEventListener('webglcontextlost', contextLost);
    syncPlayback();
    let disposed = false;
    void document.fonts.ready.then(() => { if (!disposed) resize(); });
    return () => {
      disposed = true;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      preferenceObserver.disconnect();
      motion.removeEventListener('change', changeMotion);
      document.removeEventListener('visibilitychange', syncPlayback);
      window.removeEventListener('resize', resize);
      stage.querySelector('canvas')?.removeEventListener('webglcontextlost', contextLost);
      tension.dispose();
      world.dispose();
      disposeFallback?.();
      scene.dispose();
      root.removeEventListener('hole-feed', feed);
      document.title = previousTitle;
    };
  }, [settings]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('debug')) return;
    let disposed = false;
    let panel: { destroy: () => void } | undefined;
    void import('lil-gui').then(({ default: GUI }) => {
      if (disposed) return;
      const gui = new GUI({ title: '404 · Black hole' });
      panel = gui;
      const config = configRef.current;
      const apply = () => {
        setSettings({ ...config });
      };
      const layout = gui.addFolder('Composition');
      layout.add(config, 'stageWidthVw', 20, 60);
      layout.add(config, 'stageMaxWidth', 400, 1000);
      layout.add(config, 'mobileWidthVw', 25, 60);
      layout.add(config, 'contentWidthVw', 50, 75);
      layout.add(config, 'contentMaxWidth', 500, 900);
      layout.add(config, 'mobilePagePadding', 12, 32);
      layout.add(config, 'mobileTextReserveVw', 20, 40);
      layout.add(config, 'mobileCodeSize', 32, 48);
      layout.add(config, 'mobileSentenceSize', 14, 18);
      layout.add(config, 'mobileSentenceLineHeight', 1.3, 1.8);
      layout.add(config, 'mobileSuffixSpaceEm', 1, 3);
      layout.add(config, 'mobileTextWarpRatio', 0, 0.35);
      layout.add(config, 'mobilePullPixels', 0, 24);
      layout.add(config, 'mobileVerticalPull', 0, 6);
      layout.add(config, 'mobileHorizonGap', 0, 24);
      layout.add(config, 'mobileHoleInsetRatio', 0, 1);
      layout.add(config, 'textGap', 4, 32);
      layout.add(config, 'centerXPercent', 35, 65);
      layout.add(config, 'centerYPercent', 35, 65);
      layout.add(config, 'holeRadius', 0.4, 1.5);
      layout.add(config, 'diskRadius', 2.5, 3.5);
      layout.add(config, 'diskInnerRadius', 1, 1.8);
      layout.add(config, 'rayCaptureRadius', 0.3, 0.6);
      layout.add(config, 'lensingStrength', 0.25, 0.6);
      layout.add(config, 'rayViewScale', 1.1, 1.5);
      layout.add(config, 'viewInclination', 0.06, 0.2);
      layout.add(config, 'tiltDegrees', -20, 30);
      layout.add(config, 'diskTiltDegrees', -20, 30);
      layout.add(config, 'shadowRadius', 1, 1.5);
      const light = gui.addFolder('Light and motion');
      light.addColor(config, 'hotColor');
      light.addColor(config, 'warmColor');
      light.addColor(config, 'edgeColor');
      light.add(config, 'pulseAmount', 0, 0.5);
      light.add(config, 'pulsePeriod', 2, 8);
      light.add(config, 'rotationSpeed', 0, 0.5);
      light.add(config, 'bobPixels', 0, 8);
      light.add(config, 'bobPeriod', 2, 10);
      light.add(config, 'cursorTiltDegrees', 0, 12);
      light.add(config, 'feedDecay', 0.2, 1);
      const text = gui.addFolder('Text tension');
      text.add(config, 'tensionLetters', 3, 10, 1);
      text.add(config, 'tensionPeriod', 2, 6);
      text.add(config, 'pullDistance', 12, 48);
      text.add(config, 'stretch', 1, 1.4);
      text.add(config, 'textHoleInsetRatio', 0, 1);
      text.add(config, 'textHorizonClip');
      text.add(config, 'tailOpacity', 0, 1);
      text.add(config, 'tailFadePower', 0.5, 3);
      text.add({ replay: apply }, 'replay').name('Restart tension');
      const world = gui.addFolder('Page gravity');
      world.add(config, 'horizonGap', 0, 48);
      world.add(config, 'lineOpacity', 0, 0.15);
      world.add(config, 'lineSpacing', 24, 160);
      world.add(config, 'verticalLineSpacing', 50, 180);
      world.add(config, 'lineThickness', 0.2, 2);
      world.add(config, 'verticalLineThickness', 0.5, 2);
      world.add(config, 'lineNearBoost', 0, 0.1);
      world.add(config, 'lineEmphasisRadiusWidths', 0.5, 2.5);
      world.add(config, 'warpStrength', 0, 320);
      world.add(config, 'textWarpRatio', 0, 1);
      world.add(config, 'warpRadiusWidths', 1, 4);
      world.add(config, 'warpFalloffPower', 1, 6);
      world.add(config, 'warpPulse', 0, 0.3);
      world.add(config, 'warpMapResolution', 128, 1024, 128);
      world.add(config, 'warpPadding', 32, 256);
      world.add(config, 'worldUpdateFps', 8, 60, 1);
      text.addColor(config, 'letterHeatColor');
      text.add(config, 'letterHeatAmount', 0, 1);
      text.add(config, 'letterCompression', 0, 0.4);
      text.add(config, 'letterRotationLimit', 0, 30);
      text.add(config, 'horizonMaskRatio', 0.7, 1.2);
      const spill = gui.addFolder('Page light');
      spill.addColor(config, 'spillColor');
      spill.add(config, 'spillOpacity', 0, 0.25);
      spill.add(config, 'spillRadiusWidths', 0.5, 2);
      spill.add(config, 'spillHeightRatio', 0.1, 1);
      spill.add(config, 'spillBandOffsetRadius', -0.5, 0.5);
      spill.add(config, 'spillPulse', 0, 0.4);
      spill.add(config, 'spillFeed', 0, 0.2);
      spill.add(config, 'shadowOpacity', 0, 0.3);
      spill.add(config, 'shadowRadiusRatio', 1, 1.8);
      spill.add(config, 'shadowPulse', 0, 0.3);
      spill.add(config, 'shadowFeed', 0, 0.2);
      spill.add({ feed: () => rootRef.current?.dispatchEvent(new Event('hole-feed')) }, 'feed').name('Preview feed flare');
      spill.add(config, 'spillFadeStop', 0.3, 1);
      spill.add(config, 'shadowInnerStop', 0.3, 0.7);
      spill.add(config, 'shadowPeakStop', 0.7, 0.95);
      spill.addColor(config, 'shadowColor');
      text.add(config, 'letterHeatRadius', 1.1, 5);
      text.add(config, 'mobileStretchLimit', 0, 0.25);
      const disk = gui.addFolder('Disk material');
      disk.add(config, 'diskSaturation', 0, 1);
      disk.add(config, 'diskExposure', 0.4, 1.5);
      disk.add(config, 'lowerArcBrightness', 0.5, 1.5);
      disk.add(config, 'photonRingRadius', 0.6, 1.2);
      disk.add(config, 'photonRingWidth', 0.005, 0.04);
      disk.add(config, 'photonRingCleanWidth', 0, 0.15);
      disk.add(config, 'photonRingIntensity', 0, 1.5);
      disk.addColor(config, 'photonRingColor');
      disk.add(config, 'photonRingBandY', -0.5, 0);
      disk.add(config, 'photonRingBandWidth', 0.05, 0.25);
      disk.add(config, 'diskEdgeFade', 0.3, 1);
      disk.add(config, 'diskEdgeNoise', 0, 0.3);
      disk.add(config, 'diskEdgeFrequency', 8, 80);
      disk.add(config, 'streakFrequency', 50, 300);
      disk.add(config, 'fineStreakFrequency', 200, 700);
      disk.add(config, 'streakContrast', 0, 1);
      disk.add(config, 'fineStreakContrast', 0, 0.5);
      disk.add(config, 'rotationBlur', 0, 0.3);
      const grain = gui.addFolder('Shared film grain');
      grain.add(config, 'grainOpacity', 0, 0.08);
      grain.add(config, 'grainFrequency', 0.2, 1);
      grain.add(config, 'grainOctaves', 1, 4, 1);
      grain.add(config, 'grainSeed', 0, 100, 1);
      grain.add(config, 'grainTileSize', 64, 256, 64);
      const access = gui.addFolder('Accessibility checks');
      access.add(config, 'previewReducedMotion').name('Preview reduced motion');
      access.add(config, 'staticFallback').name('Force image fallback');
      gui.onFinishChange(apply);
      gui.close();
    });
    return () => { disposed = true; panel?.destroy(); };
  }, []);

  return (
    <main ref={rootRef} className="not-found" aria-label="Page not found" style={pageStyle}>
      <svg className="gravity-defs" aria-hidden="true">
        <defs>
          {['lines', 'text'].map(name => (
            <filter key={name} id={`${filterId}-${name}`} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feImage result="radial-map" preserveAspectRatio="none" />
              <feDisplacementMap in="SourceGraphic" in2="radial-map" scale="0" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          ))}
          <clipPath id={`${filterId}-core`} clipPathUnits="userSpaceOnUse"><path clipRule="evenodd" /></clipPath>
        </defs>
      </svg>
      <div className="gravity-lines" data-gravity-filter={`${filterId}-lines`} aria-hidden="true" />
      <div className="hole-light-spill" aria-hidden="true" />
      <div className="hole-contact-shadow" aria-hidden="true" />
      <div ref={stageRef} className="black-hole-stage" aria-hidden="true">
        <div ref={visualRef} className="black-hole-visual">
          <img className="black-hole-fallback" src="/figma/black-hole.png" alt="" />
        </div>
      </div>
      <div className="not-found-content">
        <div className="not-found-line" data-gravity-filter={`${filterId}-text`} data-core-clip={`${filterId}-core`}>
          <h1 className="not-found-code">404<span>.</span></h1>
          <p ref={sentenceRef} className="not-found-sentence" aria-label={`${SENTENCE} by the black hole`}>
            <span aria-hidden="true">{prefix} </span>
            <span className="swallow-word" aria-hidden="true">
                {stem}
                {[...tail].map((letter, letterIndex) => (
                  <span key={letterIndex} className="swallow-letter">
                    <span className="swallow-letter-ink">{letter}</span>
                    {letterIndex === tail.length - 1 && <span className="swallow-by">by</span>}
                  </span>
                ))}
            </span>
          </p>
        </div>
        <div className="not-found-home">
          <span>Travel back to </span>
          <a className="not-found-home-link link-hover" href="/">
            home planet
            <span className="not-found-home-arrow external-link-icon" aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="page-film-grain" aria-hidden="true" />
    </main>
  );
}
