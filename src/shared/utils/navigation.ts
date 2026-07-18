import { router as expoRouter, Href } from 'expo-router';

// Prevent double-tap navigation bugs globally
let isNavigating = false;
const DEBOUNCE_TIME_MS = 500;

export const safeRouter = {
  ...expoRouter,
  push: (href: Href) => {
    if (isNavigating) return;
    isNavigating = true;
    expoRouter.push(href);
    setTimeout(() => {
      isNavigating = false;
    }, DEBOUNCE_TIME_MS);
  },
  replace: (href: Href) => {
    if (isNavigating) return;
    isNavigating = true;
    expoRouter.replace(href);
    setTimeout(() => {
      isNavigating = false;
    }, DEBOUNCE_TIME_MS);
  },
  back: () => {
    if (expoRouter.canGoBack()) {
      expoRouter.back();
    }
  },
};
