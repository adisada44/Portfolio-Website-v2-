# Portfolio

A deliberately minimal, editorial portfolio for UX and product designer Aditya Sadashiv.

> **Personality on the surface. Clarity underneath.**

The experience uses thoughtful interactions and expressive details without making navigation harder or distracting from the work.

## Experience

- A philosophical opening that establishes the tone of the portfolio
- A focused single-page structure with clear routes to work and professional profiles
- A restrained editorial visual language built around typography, spacing, and subtle motion
- A Work section designed to grow into dedicated case-study pages
- An animated accessibility mascot that opens visitor-controlled preferences
- Responsive behavior across desktop, tablet, mobile, keyboard, and touch input

## Current Status

The portfolio shell, responsive layout, and interaction system are implemented as the first intentional stage of the site. Detailed case studies are now being designed and will be added as dedicated experiences. Existing work is currently available on [Behance](https://www.behance.net/adityasadashiv).

## Tech Stack

- React and React DOM
- TypeScript
- Vite
- Tailwind CSS
- React Spring
- Phosphor Icons
- PostCSS and Autoprefixer
- Oxlint

## Accessibility

The interface supports keyboard operation, visible focus behavior, touch input, and responsive layouts. It respects operating-system reduced-motion preferences and includes site-level controls for motion, text size, contrast, focus visibility, and sound. Focus is moved predictably when the accessibility panel opens and returned to the mascot when it closes.

## Running Locally

```bash
npm install
npm run dev
```

Run the production checks with:

```bash
npm run lint
npm run build
```

## Project Structure

```text
src/
  components/  Interface and interaction components
  assets/      Source-controlled visual assets

public/
  figma/       Exported interface assets
  mascot/      Accessibility mascot frames
```

## Links

- [Behance](https://www.behance.net/adityasadashiv)
- [LinkedIn](https://www.linkedin.com/in/aditya-sadashiv-907136222/)
- [GitHub](https://github.com/adisada44)
