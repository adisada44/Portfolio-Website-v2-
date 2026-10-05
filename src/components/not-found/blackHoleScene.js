import * as THREE from 'three';
import { rayVertexShader, rayFragmentShader } from './blackHoleRayShader';

export function createBlackHoleScene(container, config, reducedMotion) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 2.25, -2.25, 0.1, 30);
  camera.position.z = 10;
  const geometry = new THREE.PlaneGeometry(config.cameraWidth, config.cameraWidth * 0.75);
  const material = new THREE.ShaderMaterial({
    vertexShader: rayVertexShader,
    fragmentShader: rayFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 }, uFeed: { value: 0 },
      uSpeed: { value: config.rotationSpeed },
      uCaptureRadius: { value: config.rayCaptureRadius },
      uGravity: { value: config.lensingStrength },
      uDiskInner: { value: config.diskInnerRadius },
      uDiskOuter: { value: config.diskRadius },
      uViewScale: { value: config.rayViewScale },
      uInclination: { value: config.viewInclination },
      uShadowRadius: { value: config.shadowRadius },
      uPulse: { value: config.pulseAmount }, uPulsePeriod: { value: config.pulsePeriod },
      uHot: { value: new THREE.Color(config.hotColor) },
      uWarm: { value: new THREE.Color(config.warmColor) },
      uEdge: { value: new THREE.Color(config.edgeColor) },
      uSaturation: { value: config.diskSaturation },
      uExposure: { value: config.diskExposure },
      uEdgeFade: { value: config.diskEdgeFade },
      uEdgeNoise: { value: config.diskEdgeNoise },
      uEdgeFrequency: { value: config.diskEdgeFrequency },
      uStreakFrequency: { value: config.streakFrequency },
      uFineFrequency: { value: config.fineStreakFrequency },
      uStreakContrast: { value: config.streakContrast },
      uFineContrast: { value: config.fineStreakContrast },
      uRotationBlur: { value: config.rotationBlur },
      uLowerBrightness: { value: config.lowerArcBrightness },
      uRingRadius: { value: config.photonRingRadius },
      uRingWidth: { value: config.photonRingWidth },
      uRingCleanWidth: { value: config.photonRingCleanWidth },
      uRingIntensity: { value: config.photonRingIntensity },
      uRingColor: { value: new THREE.Color(config.photonRingColor) },
      uRingBandY: { value: config.photonRingBandY },
      uRingBandWidth: { value: config.photonRingBandWidth },
    },
  });
  const disk = new THREE.Mesh(geometry, material);
  disk.rotation.z = -config.diskTiltDegrees * Math.PI / 180;
  scene.add(disk);
  let active = true, reduced = reducedMotion, disposed = false;
  let frame = 0, previousTime = 0, elapsed = 0, feed = 0, bob = 0, pixelScale = 1;
  let outline = null;
  const listeners = new Set();
  const target = { x: 0, y: 0 };
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function resize() {
    if (disposed) return;
    // CSS transforms move/grow the wrapper without reallocating GPU buffers.
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    const halfWidth = config.cameraWidth / 2;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfWidth * height / width;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    pixelScale = width / config.cameraWidth;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    outline = null;
    renderer.render(scene, camera);
  }

  function draw(timestamp) {
    frame = 0;
    if (disposed || !active) return;
    const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 0;
    previousTime = timestamp;
    if (!reduced) elapsed += delta;
    feed *= Math.exp(-delta * 3 / config.feedDecay);
    bob = reduced ? 0 : Math.sin(elapsed * Math.PI * 2 / config.bobPeriod) * config.bobPixels;
    disk.position.y = bob / pixelScale;
    const tilt = config.cursorTiltDegrees * Math.PI / 180;
    const blend = 1 - Math.exp(-delta * config.smoothing);
    const idleX = finePointer.matches ? target.x : Math.sin(elapsed * 0.3) * 0.25;
    const idleY = finePointer.matches ? target.y : Math.cos(elapsed * 0.25) * 0.25;
    disk.rotation.x += ((reduced ? 0 : idleY * tilt) - disk.rotation.x) * blend;
    disk.rotation.y += ((reduced ? 0 : idleX * tilt) - disk.rotation.y) * blend;
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uFeed.value = reduced ? 0 : feed;
    renderer.render(scene, camera);
    const beat = reduced ? 0 : Math.sin(elapsed * Math.PI * 2 / config.pulsePeriod);
    listeners.forEach(listener => listener({ time: elapsed, pulse: beat, feed: reduced ? 0 : feed, reduced }));
    if (!reduced) frame = requestAnimationFrame(draw);
  }

  function schedule() {
    previousTime = 0;
    if (!frame && active && !disposed) frame = requestAnimationFrame(draw);
  }

  function getArtExtents() {
    if (outline) return outline;
    // Read the actual rendered silhouette once per layout size. This measures
    // light-bent edges, including the tilt, instead of estimating canvas padding.
    renderer.render(scene, camera);
    const gl = renderer.getContext();
    const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let minX = width, maxX = -1, minY = height, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pixels[(y * width + x) * 4 + 3] < 20) continue;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    const ratio = renderer.getPixelRatio();
    const halfWidth = container.clientWidth / 2, halfHeight = container.clientHeight / 2;
    outline = maxX >= minX ? {
      left: minX / ratio - halfWidth,
      right: (maxX + 1) / ratio - halfWidth,
      top: (height - 1 - maxY) / ratio - halfHeight,
      bottom: (height - minY) / ratio - halfHeight,
    } : { left: -halfWidth, right: halfWidth, top: -halfHeight, bottom: halfHeight };
    return outline;
  }

  function pointerMove(event) {
    if (!finePointer.matches || reduced) return;
    const bounds = container.getBoundingClientRect();
    target.x = THREE.MathUtils.clamp((event.clientX - bounds.left - bounds.width / 2) / bounds.width, -1, 1);
    target.y = THREE.MathUtils.clamp((event.clientY - bounds.top - bounds.height / 2) / bounds.height, -1, 1);
  }
  function pointerLeave() { target.x = 0; target.y = 0; }
  window.addEventListener('pointermove', pointerMove, { passive: true });
  document.addEventListener('pointerleave', pointerLeave);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  schedule();

  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    getArtExtents,
    getHoleCenter() {
      const bounds = container.getBoundingClientRect();
      const scale = bounds.width / Math.max(1, container.clientWidth);
      return { x: bounds.left + bounds.width / 2 + window.scrollX, y: bounds.top + bounds.height / 2 - bob * scale + window.scrollY };
    },
    getHoleRadius() { return config.holeRadius * container.getBoundingClientRect().width / config.cameraWidth; },
    feed() { feed = Math.min(1, feed + 0.8); },
    setActive(value) {
      active = value;
      cancelAnimationFrame(frame);
      frame = 0;
      if (active) schedule();
    },
    setReducedMotion(value) {
      reduced = value;
      if (value) { elapsed = 0; disk.rotation.x = 0; disk.rotation.y = 0; }
      cancelAnimationFrame(frame);
      frame = 0;
      schedule();
    },
    refresh() { resize(); schedule(); },
    dispose() {
      disposed = true;
      listeners.clear();
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', pointerMove);
      document.removeEventListener('pointerleave', pointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
