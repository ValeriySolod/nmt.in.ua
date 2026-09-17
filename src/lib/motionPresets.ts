/** Matches `--ease` / `--t` / `--t-slow` in globals.css. No bounce — this is a study tool. */
export const easeOutSoft = [0.22, 1, 0.36, 1] as const;

export const tweenFast = {
  duration: 0.22,
  ease: easeOutSoft,
} as const;

export const tweenSlow = {
  duration: 0.5,
  ease: easeOutSoft,
} as const;

export const popoverHidden = {
  opacity: 0,
  transform: "translate3d(0, -6px, 0)",
} as const;

export const popoverShown = {
  opacity: 1,
  transform: "translate3d(0, 0, 0)",
} as const;

export const popoverExit = {
  opacity: 0,
  transform: "translate3d(0, -4px, 0)",
} as const;

export const overlayHidden = { opacity: 0 } as const;
export const overlayShown = { opacity: 1 } as const;

export const dialogHidden = {
  opacity: 0,
  transform: "translate3d(0, 14px, 0)",
} as const;

export const dialogShown = {
  opacity: 1,
  transform: "translate3d(0, 0, 0)",
} as const;

export const revealHidden = {
  opacity: 0,
  transform: "translate3d(0, 18px, 0)",
} as const;

export const revealShown = {
  opacity: 1,
  transform: "translate3d(0, 0, 0)",
} as const;
