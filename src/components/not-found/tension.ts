import { gsap } from 'gsap';
import type { HoleScene } from './blackHoleScene';
import type { BlackHoleConfig } from './config';
import { placeHero } from './heroLayout';

export function setRestingLetters(letters: HTMLElement[]) {
  gsap.set(letters, {
    x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
    opacity: 1, filter: 'none', color: '',
  });
  letters.forEach(letter => {
    const ink = letter.querySelector<HTMLElement>('.swallow-letter-ink');
    if (ink) ink.style.opacity = '1';
  });
}

function smoothRange(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function createTensionTimeline(letters: HTMLElement[], scene: HoleScene, config: BlackHoleConfig, visual: HTMLElement) {
  const glyphs = letters.map(letter => ({ letter, ink: letter.querySelector<HTMLElement>('.swallow-letter-ink')!, x: 0, y: 0 }));
  const clock = { phase: 0 };
  const stage = visual.parentElement!;
  const sentence = letters[0].closest<HTMLElement>('.not-found-sentence')!;
  let mobile = false;
  let wasCaptured = false;
  const heat = gsap.utils.interpolate(getComputedStyle(sentence).color, config.letterHeatColor);

  const measure = () => {
    setRestingLetters(letters);
    mobile = placeHero(visual, scene, config);
    glyphs.forEach(glyph => {
      const bounds = glyph.letter.getBoundingClientRect();
      glyph.x = bounds.left + bounds.width / 2 + window.scrollX;
      glyph.y = bounds.top + bounds.height / 2 + window.scrollY;
    });
  };
  measure();

  const render = () => {
    stage.dataset.phase = 'tension';
    const centre = scene.getHoleCenter();
    const holeRadius = scene.getHoleRadius();
    // Ease into strain once. Then breathe within a narrow tension range,
    // never releasing back to rest or recycling individual characters.
    const entry = smoothRange(0, 1.2, timeline.totalTime());
    const strength = entry * (0.88 + 0.12 * Math.sin(clock.phase * Math.PI * 2));
    let captured = false;
    glyphs.forEach((glyph, index) => {
      // One shared field preserves order and gives the word an anchored start.
      const fraction = index / Math.max(1, glyphs.length - 1);
      const strain = fraction * fraction * strength;
      const dx = centre.x - glyph.x;
      const dy = centre.y - glyph.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      // Mobile now pulls sideways toward its smaller neighbouring hole.
      // Bound the vertical component while retaining the desktop tail effect.
      const pull = mobile ? Math.min(config.pullDistance, config.mobilePullPixels) : config.pullDistance;
      const yLimit = mobile ? config.mobileVerticalPull : 10;
      const x = pull * dx / distance * strain;
      const y = Math.max(-yLimit, Math.min(yLimit, pull * dy / distance)) * strain;
      const remaining = Math.hypot(dx - x, dy - y);
      const proximity = smoothRange(holeRadius * config.letterHeatRadius, holeRadius, remaining) * strain;
      if (remaining < holeRadius * config.horizonMaskRatio) captured = true;
      gsap.set(glyph.letter, {
        x, y,
        rotation: (mobile ? -3 : Math.max(-config.letterRotationLimit, Math.min(config.letterRotationLimit, Math.atan2(dy, dx) * 180 / Math.PI))) * strain,
        scaleX: 1 + (mobile ? Math.min(config.stretch - 1, config.mobileStretchLimit) : config.stretch - 1) * strain,
        scaleY: 1 - config.letterCompression * proximity,
        color: config.letterHeatAmount ? heat(proximity * config.letterHeatAmount) : '',
        opacity: 1,
      });
      // Fade the letter ink only: the attached "by" keeps its original faint
      // opacity instead of being multiplied into invisibility with the tail.
      glyph.ink.style.opacity = `${1 - (1 - config.tailOpacity) * Math.pow(fraction, config.tailFadePower) * entry}`;
    });
    if (captured && !wasCaptured) scene.feed();
    wasCaptured = captured;
  };

  // The clock holds the word under tension; only geometric horizon crossings
  // feed the light. The grey tail stays ordered and progressively faint,
  // without recycling letters, extra compression or proximity-driven stretch.
  const timeline = gsap.timeline({ paused: true, repeat: -1, onUpdate: render });
  timeline.to(clock, { phase: 1, duration: config.tensionPeriod, ease: 'none' });

  return {
    timeline,
    refresh() { measure(); if (timeline.totalTime() > 0) render(); },
    reset() {
      timeline.pause(0);
      clock.phase = 0;
      wasCaptured = false;
      measure();
      stage.dataset.phase = 'resting';
    },
    dispose() {
      timeline.kill();
      gsap.killTweensOf(letters);
      gsap.set(visual, { clearProps: 'transform' });
      gsap.set(visual.closest('.not-found')!.querySelector('.not-found-content'), { clearProps: 'transform' });
      sentence.style.fontSize = '';
    },
  };
}
