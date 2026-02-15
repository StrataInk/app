/**
 * Environment adapter — single source of truth for web vs desktop detection.
 *
 * The web stub (strata-web-stub.ts) sets __STRATA_WEB__ = true on window
 * when Electron's preload bridge (window.strata) is absent. Import `isWeb`
 * from this module instead of checking the flag directly in UI components.
 */
export const isWeb = !!(window as unknown as Record<string, unknown>).__STRATA_WEB__;
export const isDesktop = !isWeb;
