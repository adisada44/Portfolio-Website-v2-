import type { BlackHoleConfig } from './config';

export type HoleScene = {
  subscribe: (listener: (state: { time: number; pulse: number; feed: number; reduced: boolean }) => void) => () => void;
  getHoleCenter: () => { x: number; y: number };
  getHoleRadius: () => number;
  getArtExtents: () => { left: number; right: number; top: number; bottom: number };
  feed: () => void;
  setActive: (active: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  refresh: () => void;
  dispose: () => void;
};

export function createBlackHoleScene(
  container: HTMLElement,
  config: BlackHoleConfig,
  reducedMotion: boolean,
): HoleScene;
