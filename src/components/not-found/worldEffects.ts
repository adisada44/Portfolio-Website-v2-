import type { BlackHoleConfig } from './config';
import type { HoleScene } from './blackHoleScene';

// Only layout changes regenerate these small maps. The existing Three clock
// changes a single SVG scale attribute, rather than uploading a map per frame.
export function createWorldEffects(root: HTMLElement, scene: HoleScene, config: BlackHoleConfig) {
  const targets = [...root.querySelectorAll<HTMLElement>('[data-gravity-filter]')];
  const scales: { element: SVGElement; ratio: number }[] = [];
  const spill = root.querySelector<HTMLElement>('.hole-light-spill')!;
  const shadow = root.querySelector<HTMLElement>('.hole-contact-shadow')!;
  let lastTime = -Infinity;
  const refresh = () => {
    const centre = scene.getHoleCenter();
    const radius = scene.getHoleRadius() * 2 * config.warpRadiusWidths;
    const page = root.getBoundingClientRect();
    const extents = scene.getArtExtents();
    const diskWidth = extents.right - extents.left;
    const spillSize = diskWidth * config.spillRadiusWidths * 2;
    const shadowSize = scene.getHoleRadius() * config.shadowRadiusRatio * 2;
    [spill, shadow].forEach((layer, index) => {
      const size = index === 0 ? spillSize : shadowSize;
      const height = index === 0 ? size * config.spillHeightRatio : size;
      const bandOffset = index === 0 ? scene.getHoleRadius() * config.spillBandOffsetRadius : 0;
      layer.style.width = `${size}px`; layer.style.height = `${height}px`;
      layer.style.transform = `translate(${centre.x - window.scrollX - page.left - size/2}px, ${centre.y - window.scrollY - page.top - height/2 + bandOffset}px) rotate(${index === 0 ? config.tiltDegrees : 0}deg)`;
      layer.style.opacity = `${index === 0 ? config.spillOpacity : config.shadowOpacity}`;
    });
    scales.length = 0;
    targets.forEach(target => {
      const filter = root.querySelector<SVGFilterElement>(`#${target.dataset.gravityFilter}`)!;
      const map = filter.querySelector('feImage')!;
      const displacement = filter.querySelector<SVGElement>('feDisplacementMap')!;
      const box = target.getBoundingClientRect();
      const pad = config.warpPadding;
      const width = box.width + pad * 2, height = box.height + pad * 2;
      filter.setAttribute('x', `${-pad}`); filter.setAttribute('y', `${-pad}`);
      filter.setAttribute('width', `${width}`); filter.setAttribute('height', `${height}`);
      map.setAttribute('x', `${-pad}`); map.setAttribute('y', `${-pad}`);
      map.setAttribute('width', `${width}`); map.setAttribute('height', `${height}`);
      const canvas = document.createElement('canvas');
      canvas.width = config.warpMapResolution;
      canvas.height = Math.max(1, Math.round(canvas.width * height / width));
      const context = canvas.getContext('2d')!;
      const pixels = context.createImageData(canvas.width, canvas.height);
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const dx = box.left + window.scrollX - pad + (x + 0.5) * width / canvas.width - centre.x;
          const dy = box.top + window.scrollY - pad + (y + 0.5) * height / canvas.height - centre.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const t = Math.min(1, distance / radius);
          const falloff = (1 - t) ** config.warpFalloffPower;
          const offset = (y * canvas.width + x) * 4;
          // Positive source offsets make rendered features move inward.
          pixels.data[offset] = Math.round(128 + 127 * dx / distance * falloff);
          pixels.data[offset + 1] = Math.round(128 + 127 * dy / distance * falloff);
          pixels.data[offset + 2] = 128;
          pixels.data[offset + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      const url = canvas.toDataURL();
      map.setAttribute('href', url);
      target.style.filter = `url(#${filter.id})`;
      const responsiveRatio = Number.parseFloat(getComputedStyle(target).getPropertyValue('--text-warp-ratio'));
      const ratio = target.dataset.coreClip ? (Number.isFinite(responsiveRatio) ? responsiveRatio : config.textWarpRatio) : 1;
      displacement.setAttribute('scale', `${config.warpStrength * ratio}`);
      scales.push({ element: displacement, ratio });
      if (!target.dataset.coreClip) {
        // Emphasize the same warped grid close to the core, not a separate
        // unfiltered overlay. Baseline ink remains at the edge of the field.
        const opacity = config.lineOpacity + config.lineNearBoost;
        const base = opacity > 0 ? config.lineOpacity / opacity : 1;
        const x = centre.x - window.scrollX - box.left, y = centre.y - window.scrollY - box.top;
        const emphasisRadius = scene.getHoleRadius() * 2 * config.lineEmphasisRadiusWidths;
        target.style.opacity = `${opacity}`;
        target.style.maskImage = `radial-gradient(circle at ${x}px ${y}px, #000, rgba(0,0,0,${base}) ${emphasisRadius}px)`;
      }
      if (target.dataset.coreClip && config.textHorizonClip) {
        const clip = root.querySelector<SVGClipPathElement>(`#${target.dataset.coreClip}`)!;
        const x = centre.x - window.scrollX - box.left, y = centre.y - window.scrollY - box.top;
        const r = scene.getHoleRadius() * config.horizonMaskRatio;
        // Subtract the core from an oversized rectangle: only crossing pixels
        // disappear, as if behind the circle, never before they arrive.
        clip.querySelector('path')!.setAttribute('d', `M ${-pad} ${-pad} H ${box.width + pad} V ${box.height + pad} H ${-pad} Z M ${x-r} ${y} a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 ${-r*2} 0 Z`);
        target.style.clipPath = `url(#${clip.id})`;
      }
    });
  };
  refresh();
  const unsubscribe = scene.subscribe(state => {
    if (!state.reduced && state.time - lastTime < 1 / config.worldUpdateFps) return;
    lastTime = state.time;
    const strength = config.warpStrength * (1 + config.warpPulse * state.pulse);
    scales.forEach(({ element, ratio }) => element.setAttribute('scale', `${state.reduced ? 0 : strength * ratio}`));
    spill.style.opacity = `${config.spillOpacity * (1 + config.spillPulse * state.pulse) + config.spillFeed * state.feed}`;
    shadow.style.opacity = `${config.shadowOpacity * (1 + config.shadowPulse * state.pulse) + config.shadowFeed * state.feed}`;
  });
  return {
    refresh,
    dispose() {
      unsubscribe();
      targets.forEach(target => { target.style.filter = ''; target.style.clipPath = ''; target.style.opacity = ''; target.style.maskImage = ''; });
      [spill, shadow].forEach(layer => layer.removeAttribute('style'));
    },
  };
}
