# Portfolio V2 — Tech Stack

Last updated: 29 August 2026

This is a living document. Update it whenever a dependency, integration, build tool, hosting target, or architectural decision changes.

## 1. Product Shape

Portfolio V2 is a client-rendered, single-page personal portfolio. The current release is a responsive “work in progress” homepage based on the Portfolio V2 Figma file. It has no backend, database, account system, or server-side application code.

The runtime flow is:

```text
index.html
  → React entry point
    → App shell
      → Profile rail
      → Workspace / progress state
      → Mumbai time and weather
      → Fixed quick-link footer
      → Frame-sequenced accessibility mascot
      → Optional interface sound
```

## 2. Core Runtime

| Technology | Current version | Role |
| --- | ---: | --- |
| React | 19.2.8 | Component model, state, effects, and client rendering |
| React DOM | 19.2.8 | Mounts the React tree into the browser DOM |
| TypeScript | 6.0.x | Static typing for components, API responses, and build configuration |
| Browser Web APIs | Native | Web Audio, Fetch, AbortController, timers, and `Intl.DateTimeFormat` |
| React Spring (`@react-spring/web`) | 10.1.2 | Interruptible accessibility-panel entrance and exit motion |

## 3. Build and Development Tooling

| Technology | Current version | Role |
| --- | ---: | --- |
| Vite | 8.2.x | Development server, hot-module replacement, and production bundling |
| `@vitejs/plugin-react` | 6.1.x | React integration for Vite |
| Tailwind CSS | 4.3.x | Utility styling and theme-token generation |
| `@tailwindcss/postcss` | 4.3.x | Tailwind/PostCSS integration |
| PostCSS | 8.5.x | CSS processing pipeline |
| Autoprefixer | 10.5.x | Browser-prefix generation |
| Oxlint | 1.79.x | Fast static linting |
| npm | Lockfile-managed | Canonical project package manager and reproducible dependency install |

The repository currently contains `package-lock.json`, so npm is the canonical package manager even though pnpm was used as a one-off runner for the requested Shadcn registry command.

## 4. UI and Visual Libraries

| Library | Current version | Usage |
| --- | ---: | --- |
| `@phosphor-icons/react` | 2.1.10 | Sound, weather, and accessibility-panel iconography |
| Figma-exported assets | Local files | Social icons, hammer, and external-link arrow |
| Supplied PNG frame sequence | 7 local images | Six registered curl frames plus the attentive state for the accessibility mascot |

The following previously installed libraries were removed because no production source imported them: Framer Motion, GSAP, Lucide React, and Zustand. Removing unused packages reduces bundle work, maintenance load, and dependency risk.

### Skiper UI status

The requested component is Skiper UI component 42, “Animated icons 001.” The supplied command was attempted with the current Shadcn CLI and its recommended compatible release. Skiper’s registry now returns a missing-license response for this component.

Current fallback:

- `SoundToggle.tsx` isolates the control behind a stable local component boundary.
- It uses the exact open-source Phosphor glyphs shown in Figma.
- The transition is project-owned CSS and does not reproduce or copy premium Skiper source.
- When a valid Skiper Pro license is available, only the icon implementation inside `SoundToggle.tsx` needs replacing.

Never commit `SKIPER_LICENSE_KEY`. If a license is added later, store it in `.env.local`, which is ignored by Git.

## 5. Styling Architecture

The site uses Tailwind CSS v4 with design tokens declared in `src/index.css` through `@theme`.

Primary tokens:

```css
--color-canvas: #faf9f6;
--color-ink: #111111;
--color-copy: #666666;
--color-stroke: #e4e4e4;
--color-link-hover: #4ac29a;
--color-progress-start: #bdfff3;
--color-progress-end: #4ac29a;
--font-sans: "Noto Sans Display", "Noto Sans", sans-serif;
```

Component-specific motion and interaction classes also live in `src/index.css`:

- `.link-hover`
- `.interactive-control`
- `.sound-toggle-icon`
- `.progress-runner`
- `.hammer-motion`
- `.mascot-control` and `.accessibility-panel`

Reduced-motion preferences are respected through `prefers-reduced-motion`.

## 6. Component Map

| File | Responsibility |
| --- | --- |
| `src/main.tsx` | React bootstrapping and strict mode |
| `src/App.tsx` | Page composition and optional click-sound lifecycle |
| `src/components/ProfileRail.tsx` | Biography, interests, and contextual external links |
| `src/components/WorkspaceGrid.tsx` | Layered workspace canvas with a centered empty/project state and top utility bar |
| `src/components/QuickLinks.tsx` | Viewport-fixed GitHub, LinkedIn, email, Behance, and résumé footer |
| `src/components/SoundToggle.tsx` | Sound-control UI and Phosphor icon transition |
| `src/components/MumbaiStatus.tsx` | Mumbai clock, weather retrieval, fallback copy, and time-sensitive messages |
| `src/components/AccessibilityMascot.tsx` | Preloaded image-sequence loop, attentive state, React Spring panel transition, focus behavior, and persistent visual settings |

## 7. Time and Weather Integration

### Time

The clock does not depend on an API. The browser supplies the current instant, and `Intl.DateTimeFormat` formats it in the fixed IANA timezone `Asia/Kolkata` using a 24-hour `HH:mm:ss` representation. It updates once per second.

This means the displayed Mumbai time remains correct for visitors anywhere in the world and does not depend on their device timezone.

### Weather

Provider: Open-Meteo Forecast API.

Location: fixed Mumbai coordinates (`19.0760`, `72.8777`).

Requested current variables:

- WMO weather code
- Total cloud cover
- Precipitation
- Day/night indicator
- Temperature at 2 metres

The client refreshes weather every 15 minutes. No API key, user location, cookies, or personal information are sent. When the network or API is unavailable, the UI falls back to a creative time-of-day message instead of exposing an error.

The clock intentionally remains independent from the weather request, so a weather outage cannot stop the time display.

The visible weather glyph is selected from direct Phosphor icon imports for clear day, clear night, cloudy day, cloudy night, fog, rain, and thunder. This keeps the icon synchronized with the same weather classification used to generate the sentence.

## 8. Audio Implementation

The interface is silent by default.

- No sound is played until the visitor explicitly enables it.
- The `AudioContext` is created lazily from a user action.
- Subsequent page clicks synthesize a short sine-wave click.
- Turning sound off suspends the context immediately.
- The preference is session-only and is not stored or tracked.

This design avoids surprise audio and respects browser autoplay policies.

## 9. Accessibility Preference Architecture

The mascot is a real button that opens a non-modal, keyboard-operable preference panel. Visual preferences are stored locally under `portfolio-accessibility-preferences`; they never leave the browser.

| Preference | Implementation |
| --- | --- |
| Reduce motion | Stops the progress shimmer, hammer loop, and hover displacement while preserving short opacity/color feedback |
| Larger text | Raises key body, status, weather, and sound-label text to 16px with more line height |
| Higher contrast | Replaces the cream/gray surface pair with white and darker gray, and strengthens dividers |
| Stronger focus | Uses a 3px blue focus indicator with 5px offset |
| No sound | Reuses the existing opt-in Web Audio state; sound remains off by default and session-only |
| Reset | Restores the four persisted visual preferences to their defaults |

The mascot uses `/public/mascot/Curl_01.png` through `Curl_06.png` and `/public/mascot/attentive.png`. The six unique curl assets are preloaded, then played as a 10-step ping-pong sequence (`01 → 02 → 03 → 04 → 05 → 06 → 05 → 04 → 03 → 02`) at 180ms per step. Every source image is 1254 × 1254px and renders inside one fixed viewport without per-frame transforms. The interval is removed while the menu is open, the tab is hidden, the operating system requests reduced motion, or the site-level Reduced motion setting is active. Closing always restarts at frame 01.

React Spring is deliberately limited to the panel transition. The illustration itself remains a predictable source swap with no skeletal or procedural limb animation.

## 10. External Services and Destinations

| Integration | Purpose |
| --- | --- |
| Google Fonts | Delivers Noto Sans Display |
| Open-Meteo | Current Mumbai weather |
| Behance | Existing portfolio projects |
| LinkedIn | Professional profile |
| GitHub | Code profile |
| Gmail web compose | Prefilled email destination |
| Optimas.ai | Current employer context |
| Rive | Current motion-design exploration link |
| The Decision Lab | Cognitive-bias reference |

All external links open in a new tab with `noopener noreferrer` protections.

## 11. Local Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## 12. Deployment Model

The production output is the static `dist/` directory generated by Vite. It can be hosted on static platforms such as GitHub Pages, Cloudflare Pages, Netlify, Vercel, or an object-storage/CDN setup.

Recommended deployment requirements:

- HTTPS only
- Immutable caching for hashed files under `dist/assets/`
- Short caching for `index.html`
- Security headers configured at the hosting layer
- SPA fallback only if future client-side routes are introduced

## 13. Maintenance Checklist

When the stack changes:

1. Update version ranges in `package.json` and regenerate `package-lock.json`.
2. Run `npm audit`, `npm run lint`, and `npm run build`.
3. Remove libraries that are no longer imported.
4. Update this document’s tables and integration notes.
5. Recheck bundle size and reduced-motion behavior.
6. Recheck external API terms before commercial deployment.
