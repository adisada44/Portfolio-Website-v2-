// Curved-ray rendering of a thin accretion disk. This is an artistic lensing
// approximation: rays bend towards the centre, revealing the disk above and
// below its physical plane and leaving a dark capture region between them.
export const rayVertexShader = /* glsl */ `
  varying vec2 vPoint;
  void main() {
    vPoint = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const rayFragmentShader = /* glsl */ `
  varying vec2 vPoint;
  uniform float uTime;
  uniform float uFeed;
  uniform float uSpeed;
  uniform float uCaptureRadius;
  uniform float uGravity;
  uniform float uDiskInner;
  uniform float uDiskOuter;
  uniform float uViewScale;
  uniform float uInclination;
  uniform float uShadowRadius;
  uniform float uPulse;
  uniform float uPulsePeriod;
  uniform vec3 uHot;
  uniform vec3 uWarm;
  uniform vec3 uEdge;
  uniform float uSaturation, uExposure, uEdgeFade, uEdgeNoise, uEdgeFrequency;
  uniform float uStreakFrequency, uFineFrequency, uStreakContrast, uFineContrast, uRotationBlur;
  uniform float uLowerBrightness;
  uniform float uRingRadius, uRingWidth, uRingCleanWidth, uRingIntensity;
  uniform vec3 uRingColor;
  uniform float uRingBandY, uRingBandWidth;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 cell = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1, 0)), f.x), mix(hash(cell + vec2(0, 1)), hash(cell + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    // Trace the actual lower rays, rather than mirroring the upper arch.
    // Inclination places the foreground disk below the circular horizon.
    vec3 position = vec3(vPoint.x * uViewScale, vPoint.y * uViewScale + 7.0 * uInclination, 7.0);
    vec3 direction = normalize(vec3(0.0, -uInclination, -1.0));
    vec3 light = vec3(0);
    float opacity = 0.0;
    float closest = 20.0;
    bool captured = false;
    for (int index = 0; index < 160; index++) {
      float distance = length(position);
      closest = min(closest, distance);
      if (distance < uCaptureRadius) { captured = true; break; }
      if (distance > 11.0) break;
      float stepSize = clamp(distance * 0.12, 0.035, 0.22);
      vec3 previous = position;
      direction = normalize(direction - position * (uGravity * stepSize / (distance * distance * distance)));
      position += direction * stepSize;
      if (previous.y * position.y <= 0.0) {
        float crossing = previous.y / (previous.y - position.y);
        vec3 hit = mix(previous, position, crossing);
        float radius = length(hit.xz);
        if (radius > uDiskInner && radius < uDiskOuter) {
          float radial = (radius - uDiskInner) / (uDiskOuter - uDiskInner);
          float angle = atan(hit.z, hit.x);
          float flow = angle + uTime * uSpeed / (radius * radius);
          float warp = noise(vec2(flow * 3.0, radius * 8.0)) * 0.05;
          float streaks = noise(vec2((radius + warp) * uStreakFrequency, flow * 2.0));
          // Three angular taps soften rotation-direction detail, without
          // another render target or full-screen post-processing pass.
          vec2 detailUV = vec2((radius + warp) * uFineFrequency, flow * 5.0);
          float detail = (noise(detailUV) + noise(detailUV + vec2(0, uRotationBlur)) + noise(detailUV - vec2(0, uRotationBlur))) / 3.0;
          vec3 color = mix(uHot, uWarm, smoothstep(0.15, 0.65, radial));
          color = mix(color, uEdge, smoothstep(0.45, 1.0, radial));
          color *= 1.0 + streaks * uStreakContrast + detail * uFineContrast;
          color *= mix(uLowerBrightness, 1.0, smoothstep(-0.35, 0.1, vPoint.y));
          // A travelling luminous wave and a slow breath change the light,
          // never the silhouette or the fixed event horizon.
          float beat = uTime * 6.283185 / uPulsePeriod;
          float ripple = 0.5 + 0.5 * sin(radial * 18.0 - beat * 2.0 + angle * 2.0);
          color *= 1.0 + uPulse * (0.65 * sin(beat) + 0.8 * ripple);
          color = mix(color, uHot * 1.5, uPulse * ripple * exp(-radial * 1.8));
          color *= 0.83 + 0.17 * cos(angle - 0.3);
          color += uHot * uFeed * exp(-radial * 7.0) * 0.25;
          color = mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, uSaturation) * uExposure;
          float erodedRadius = radial + (noise(vec2(flow * uEdgeFrequency, radius * uEdgeFrequency)) - 0.5) * uEdgeNoise;
          float density = smoothstep(0.0, 0.045, radial) * (1.0 - smoothstep(uEdgeFade, 1.0, erodedRadius));
          // Remove the sampled, broken critical-ray ring behind the disk.
          // Foreground intersections remain free to cross the core and ring.
          if (uRingCleanWidth > 0.0 && abs(vPoint.y - uRingBandY) > uRingBandWidth) density *= smoothstep(uRingCleanWidth / 2.0, uRingCleanWidth, abs(length(vPoint) - uRingRadius));
          light += (1.0 - opacity) * color * density;
          opacity += (1.0 - opacity) * density;
          if (opacity > 0.995) break;
        }
      }
    }
    float ringDistance = abs(length(vPoint) - uRingRadius);
    float ring = (1.0 - smoothstep(uRingWidth, uRingWidth + fwidth(length(vPoint)), ringDistance)) * min(1.0, uRingIntensity);
    // Analytic antialiasing yields a continuous, crisp ring behind the belt.
    light += (1.0 - opacity) * uRingColor * uRingIntensity * ring;
    opacity += (1.0 - opacity) * ring;
    // Version 1's ray-derived shadow: the disk and its dark interior share
    // the same lensing geometry, without the later hard circular stencil.
    float shadow = captured ? 1.0 : 1.0 - smoothstep(uShadowRadius, uShadowRadius + 0.035, closest);
    if (shadow > 0.0) {
      light += (1.0 - opacity) * vec3(0.0006, 0.0003, 0.0001) * shadow;
      opacity += (1.0 - opacity) * shadow;
    }
    if (opacity < 0.003) discard;
    gl_FragColor = vec4(light / max(opacity, 0.001), opacity);
    #include <colorspace_fragment>
  }
`;
