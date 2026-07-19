import { useCallback, useSyncExternalStore } from "react";

/**
 * Minimal pathname router. No dependency, deep-linkable, and enough for the
 * MVP's eight routes. Navigation uses the History API and a custom event so
 * same-document navigations re-render subscribed components.
 */

const NAVIGATE_EVENT = "rizzcode:navigate";

export function currentPath(): string {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

export function navigate(to: string) {
  if (currentPath() === to) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAVIGATE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(NAVIGATE_EVENT, callback);
  };
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, currentPath, () => "/");
}

export type Route =
  | { name: "landing" }
  | { name: "onboarding" }
  | { name: "curriculum" }
  | { name: "practice"; scenarioId: string }
  | { name: "progress" }
  | { name: "leaderboard" }
  | { name: "control" }
  | { name: "compare" }
  | { name: "not-found"; path: string };

export function parseRoute(path: string): Route {
  if (path === "/") return { name: "landing" };
  if (path === "/onboarding") return { name: "onboarding" };
  if (path === "/practice") return { name: "curriculum" };
  if (path === "/progress") return { name: "progress" };
  if (path === "/leaderboard") return { name: "leaderboard" };
  if (path === "/control") return { name: "control" };
  if (path === "/compare") return { name: "compare" };

  const practiceMatch = path.match(/^\/practice\/([A-Za-z0-9-]+)$/);
  if (practiceMatch) {
    return { name: "practice", scenarioId: practiceMatch[1] };
  }

  return { name: "not-found", path };
}

export function useRoute(): Route {
  return parseRoute(usePathname());
}

/** Link that navigates through the SPA router instead of reloading. */
export function useLinkClick() {
  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, to: string) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      if (to.startsWith("#")) return; // in-page anchors keep native behavior
      event.preventDefault();
      navigate(to);
    },
    [],
  );
}
