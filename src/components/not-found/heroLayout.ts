import { gsap } from 'gsap';
import type { BlackHoleConfig } from './config';
import type { HoleScene } from './blackHoleScene';

type LayoutScene = Pick<HoleScene, 'getArtExtents' | 'getHoleRadius'>;

// Centre the actual text/art composition, not the transparent canvas rectangle.
// Transforms are layout-only; neither the shader nor the motion phase changes.
export function placeHero(visual: HTMLElement, scene: LayoutScene, config: BlackHoleConfig) {
  const root = visual.closest<HTMLElement>('.not-found')!;
  const content = root.querySelector<HTMLElement>('.not-found-content')!;
  const sentence = content.querySelector<HTMLElement>('.not-found-sentence')!;
  gsap.set(content, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  gsap.set(visual, { x: 0, y: 0, scale: 1 });
  sentence.style.fontSize = '';

  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const page = root.getBoundingClientRect();
  const stage = visual.parentElement!.getBoundingClientRect();
  const text = content.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(sentence);
  const suffix = sentence.querySelector('.swallow-by');
  if (suffix) range.setEndBefore(suffix);
  const extents = scene.getArtExtents();
  const coreOffset = scene.getHoleRadius() * (mobile ? config.mobileHoleInsetRatio : config.textHoleInsetRatio)
    + (mobile ? config.mobileHorizonGap : config.horizonGap);
  // Fit the complete, unwrapped sentence and neighbouring art as one row.
  // Do this only on layout changes, never on the animation clock. Explicit
  // large-text preferences retain readable wrapping rather than being shrunk.
  if (mobile && document.documentElement.dataset.textSize !== 'large') {
    const available = text.width - coreOffset - extents.right;
    const natural = range.getBoundingClientRect().width;
    const fontSize = Number.parseFloat(getComputedStyle(sentence).fontSize);
    sentence.style.fontSize = `${fontSize * Math.min(1, available / Math.max(1, natural))}px`;
  }
  const rects = [...range.getClientRects()].filter(rect => rect.width && rect.height);
  const paragraph = sentence.getBoundingClientRect();
  const tail = sentence.querySelector<HTMLElement>('.swallow-letter:last-child')?.getBoundingClientRect();
  const right = Math.max(...rects.map(rect => rect.right));
  const centreX = right + coreOffset;
  const centreY = tail ? (tail.top + tail.bottom) / 2 : (paragraph.top + paragraph.bottom) / 2;
  const fittedText = content.getBoundingClientRect();
  const left = Math.min(fittedText.left, centreX + extents.left);
  const top = Math.min(fittedText.top, centreY + extents.top);
  const end = Math.max(fittedText.right, centreX + extents.right);
  const bottom = Math.max(fittedText.bottom, centreY + extents.bottom);
  const offsetX = page.left + page.width * config.centerXPercent / 100 - (left + end) / 2;
  const offsetY = page.top + page.height * config.centerYPercent / 100 - (top + bottom) / 2;

  gsap.set(content, { x: offsetX, y: offsetY });
  gsap.set(visual, {
    x: centreX + offsetX - (stage.left + stage.width / 2),
    y: centreY + offsetY - (stage.top + stage.height / 2),
  });
  return mobile;
}

// WebGL failure still receives the same centring and side-by-side layout.
export function createFallbackHeroLayout(visual: HTMLElement, config: BlackHoleConfig) {
  const image = visual.querySelector<HTMLImageElement>('.black-hole-fallback')!;
  const stage = visual.parentElement!;
  const content = visual.closest('.not-found')!.querySelector<HTMLElement>('.not-found-content')!;
  let disposed = false;
  const refresh = () => {
    if (disposed) return;
    placeHero(visual, {
      getHoleRadius: () => config.holeRadius * stage.clientWidth / config.cameraWidth,
      getArtExtents: () => {
        const bounds = image.getBoundingClientRect();
        const base = stage.getBoundingClientRect();
        const x = base.left + base.width / 2, y = base.top + base.height / 2;
        return { left: bounds.left - x, right: bounds.right - x, top: bounds.top - y, bottom: bounds.bottom - y };
      },
    }, config);
  };
  const observer = new ResizeObserver(refresh);
  observer.observe(stage);
  observer.observe(content);
  window.addEventListener('resize', refresh);
  image.addEventListener('load', refresh);
  void document.fonts.ready.then(refresh);
  refresh();
  return () => {
    disposed = true;
    observer.disconnect();
    window.removeEventListener('resize', refresh);
    image.removeEventListener('load', refresh);
    gsap.set([visual, content], { clearProps: 'transform' });
    content.querySelector<HTMLElement>('.not-found-sentence')!.style.fontSize = '';
  };
}
