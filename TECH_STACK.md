# Portfolio V2 — Tech Stack

Last updated: 2 October 2026

This is a living implementation reference. Update it whenever a dependency, integration, build tool, hosting target, or architectural decision changes.

## 1. Product shape

Portfolio V2 is a client-rendered, single-page personal portfolio. The current release is a responsive portfolio shell based on the Portfolio V2 Figma file. It has no backend, database, account system, or server-side application code.

```text
index.html
  → React entry point
    → App shell
      → Identity and biography
      → Experience and interests
      → Workspace / progress state
      → Contextual Mumbai weather
      → Quick-link footer
      → Frame-sequenced accessibility mascot
      → Optional interface sound in the accessibility panel
```

## 2. Core runtime

| Technology | Current version | Role |
| --- | ---: | --- |
| React | 19.2.8 | Component model, state, effects, and client rendering |
| React DOM | 19.2.8 | Mounts the React tree into the browser DOM |
| TypeScript | 6.0.x | Static typing for components, API responses, and configuration |
| Browser Web APIs | Native | Web Audio, Fetch, AbortController, timers, and `Intl.DateTimeFormat` |
| React Spring (`@react-spring/web`) | 10.1.2 | Accessibility-panel entrance and exit motion |
| Three.js | 0.186.1 | Transparent procedural black-hole scene on the 404 page |
| GSAP | 3.15.0 | HTML-character swallowing timeline on the 404 page |
| lil-gui | 0.21.0 | Dynamically loaded 404 tuning panel, only with `?debug` |

## 3. Build and development tooling

| Technology | Current version | Role |
| --- | ---: | --- |
| Vite | 8.2.x | Development server, HMR, and production bundling |
| `@vitejs/plugin-react` | 6.0.x | React integration for Vite |
| Tailwind CSS | 4.3.x | Utility styling and theme-token generation |
| `@tailwindcss/postcss` | 4.3.x | Tailwind/PostCSS integration |
| PostCSS | 8.5.x | CSS processing pipeline |
| Autoprefixer | 10.5.x | Browser-prefix generation |
| Oxlint | 1.75.x | Static linting |
| npm | Lockfile-managed | Canonical package manager |

## 4. UI and visual assets

| Asset/library | Usage |
| --- | --- |
| `@phosphor-icons/react` 2.1.10 | Contextual weather and accessibility-panel iconography |
| Figma-exported SVG assets | Social icons, hammer, and external-link arrow |
| `/public/profile-avatar.png` | Exact 28px identity portrait exported from Figma |
| Supplied PNG mascot sequence | Six curl frames plus the attentive state |

## 5. Styling architecture

Tailwind CSS v4 tokens and project-owned component styles live in `src/index.css`.

```css
--color-canvas: #faf9f6;
--color-ink: #303030;
--color-copy: #666666;
--color-stroke: #e4e4e4;
--color-link-hover: #4ac29a;
--color-progress-start: #bdfff3;
--color-progress-end: #4ac29a;
--font-sans: "Inter", sans-serif;
```

Inter is the sole typeface across editorial content, utility information, metadata, navigation, and interactive text. Google Fonts supplies the 400, 500, 600, and 700 weights.

Component-specific motion and interaction classes also live in `src/index.css`, including link states, the progress runner, hammer animation, mascot control, and accessibility panel. Reduced motion is handled through both `prefers-reduced-motion` and a site preference.

## 6. Component map

| File | Responsibility |
| --- | --- |
| `src/main.tsx` | React bootstrapping and strict mode |
| `src/PageRouter.tsx` | Homepage selection and lazy loading of the custom 404 screen |
| `src/App.tsx` | Page composition and optional click-sound lifecycle |
| `src/components/ProfileRail.tsx` | Identity, biography, experience, interests, captions, and contextual links |
| `src/components/WorkspaceGrid.tsx` | Centered construction state, progress, and Behance route |
| `src/components/QuickLinks.tsx` | GitHub, LinkedIn, email, Behance, and résumé footer |
| `src/components/MumbaiStatus.tsx` | Mumbai weather retrieval, fallback copy, and contextual icon selection |
| `src/components/AccessibilityMascot.tsx` | Image sequence, preference panel, focus behavior, sound toggle, and persistent visual settings |
| `src/components/not-found/NotFoundPage.tsx` | 404 layout, accessible text, playback lifecycle, fallback, and debug controls |
| `src/components/not-found/blackHoleScene.js` | Three.js renderer, visible alpha bounds, pointer response, and GPU-resource cleanup |
| `src/components/not-found/blackHoleRayShader.js` | Curved-ray integration, disk emission, shadow, and front-to-back alpha compositing |
| `src/components/not-found/blackHoleScene.d.ts` | Typed public interface for the scene without an additional dependency |
| `src/components/not-found/tension.ts` | Anchored, ordered word deformation, bounded strain, fixed artwork placement, and phase-preserving resize measurement |
| `src/components/not-found/worldEffects.ts` | Runtime radial SVG maps, horizon clipping, and shared-clock page lighting |
| `src/components/not-found/config.ts` | Shared composition, color, motion, and timing controls |
| `src/components/not-found/not-found.css` | Responsive 404 typography, layout, and canvas layering |

The Three.js/GSAP scene is loaded only for unknown paths. `lil-gui` is dynamically imported only for debug URLs. DPR remains capped at 2; hidden/offscreen playback pauses, and unmount disposes GPU resources, clocks, observers and listeners. A single-plane curved-ray shader renders a thin 3D disk with front-to-back emission and shadow compositing: this remains an artistic approximation, not a relativistic solver. Noise dissolves the outer density, higher-frequency streaks add detail, and three angular samples soften their rotation direction without another render target.

`heroLayout.ts` centres the combined text and visible artwork bounds rather than the transparent canvas. The artwork aligns with the animated tail and overlaps its fading tip, matching the supplied version 1 reference. Below 768px, a smaller 28vw canvas sits beside a single-line sentence whose font is measured to fit the remaining width. Explicit large-text preferences retain wrapping instead. Mobile uses bounded sideways letter tension and lighter text displacement; progressive fading and horizon-triggered feed work on both layouts. The grid warp is unchanged, with opacity raised to 10% baseline and 15% near the hole. The image fallback shares the same centring logic. Ordered GSAP characters remain grey and gently stretch, without the later compression and proximity-based double stretch. The SVG core cutout remains a debug option but is disabled by default. Real HTML text remains selectable and has one complete accessible label. The home link and arrow are outside the warped row.

`worldEffects.ts` builds small radial RG maps only during layout measurement, applying SVG filters directly to the loose grid and heading/sentence row. Quadratic falloff ends at 2.5 horizon widths; the grid uses 220px strength and the text 35% of that. A radial opacity mask emphasizes the same filtered grid near the hole. Orange spill is a tilted ellipse with its centre shifted toward the disk band. A subscription to the existing Three clock updates SVG strength and glow/shadow opacity at a configurable 24Hz, adding no second RAF loop. Alpha silhouette reads remain cached per layout size. The reference-matched version 1 disk uses unreflected inclined rays, a ray-derived dark interior, larger upper arch, smaller dimmer lower arc and a faint sampled inner ring. Later analytic ring/cleanup controls remain optional but default off. Static SVG-turbulence grain is a cached tile. Reduced motion disables displacement and letter strain/fade and renders a still disk. High contrast hides decorative page layers. Fallback/unmount cleanup removes filter, clipping, opacity masks and light-layer styles. All new values live in `config.ts` and the debug panel. Current verification targets Chromium only; results are recorded in `docs/404-world-integration.md`.

`/public/figma/black-hole.png` and `/public/figma/404-arrow.svg` remain the local fallback and arrow assets. `home planet` and the current-color arrow share one link, matching hover color and a reduced-motion-aware 180ms transform transition.

## 7. Time and weather integration

The browser’s clock is used internally to derive the current hour in `Asia/Kolkata`. No clock is rendered. The time value updates once per minute so fallback copy and dawn/sunset/night icon states can change without a page reload.

Weather provider: Open-Meteo Forecast API.
Location: fixed Mumbai coordinates (`19.0760`, `72.8777`).

Requested current variables:

- WMO weather code
- Total cloud cover
- Precipitation
- Day/night indicator
- Temperature at two metres

The client refreshes every 15 minutes. No API key, user location, cookies, or personal information are sent. If the request fails, the interface uses a time-of-day fallback. The visible Phosphor glyph is derived from the same classification as the sentence: clear day/night, sunrise, sunset, partial cloud, cloud, fog, rain, or thunder.

## 8. Audio implementation

The interface is silent by default. Sound can be enabled only from the accessibility panel.

- `AudioContext` is created lazily after a user action.
- Subsequent clicks synthesize a short sine-wave click.
- Turning sound off suspends the context.
- The sound state is session-only and is not tracked.

## 9. Accessibility preferences

The mascot is a button that opens a non-modal, keyboard-operable preference panel. Visual preferences are stored locally under `portfolio-accessibility-preferences`; they never leave the browser.

| Preference | Implementation |
| --- | --- |
| Reduce motion | Stops progress, hammer, mascot-loop, and hover displacement motion |
| Larger text | Raises key body, status, and weather text to 16px |
| Higher contrast | Uses a white canvas, darker copy, and stronger dividers |
| Stronger focus | Uses a 3px blue focus indicator with 5px offset |
| No sound | Reuses the opt-in Web Audio state; sound stays off by default |
| Reset | Restores persisted visual preferences to authored defaults |

The mascot uses `/public/mascot/Curl_01.png` through `Curl_06.png` and `/public/mascot/attentive.png`. The curl frames play as a ping-pong sequence at 180ms per step. Playback pauses while the menu is open, the tab is hidden, or reduced motion is active. React Spring is limited to the panel transition.

## 10. External services and destinations

| Integration | Purpose |
| --- | --- |
| Google Fonts | Inter |
| Open-Meteo | Current Mumbai weather |
| Behance | Existing portfolio projects |
| LinkedIn | Professional profile |
| GitHub | Code profile |
| Gmail web compose | Prefilled email destination |
| Google Docs | Hosted résumé |
| Optimas.AI | Employer context |
| Three.js | Current 3D-web exploration link |
| The Decision Lab | Cognitive-bias reference |

External links open in a new tab with `noopener noreferrer`.

## 11. Local commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## 12. Deployment model

Vite generates a static `dist/` directory suitable for Vercel and other static hosting platforms.

`vercel.json` rewrites deep links to the React entry point. `/` and `/index.html` render the homepage; other application paths render the custom 404 screen. This is a client-rendered not-found page: the SPA rewrite serves the entry document with HTTP 200. A server-level HTTP 404 response would require an additional hosting/server routing decision.

Recommended deployment requirements:

- HTTPS only
- Immutable caching for hashed files under `dist/assets/`
- Short caching for `index.html`
- Security headers configured at the hosting layer
- Recheck homepage, unknown-path, and asset handling after hosting changes

## 13. Maintenance checklist

1. Update package versions and regenerate `package-lock.json` when dependencies change.
2. Run `npm audit`, `npm run lint`, and `npm run build`.
3. Remove libraries that are no longer imported.
4. Update this document and `DESIGN_SPEC.md` when implementation decisions change.
5. Recheck bundle size, typography at 200% zoom, and reduced-motion behavior.
6. Recheck external links and API terms before deployment.
