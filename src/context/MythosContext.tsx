"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getMythosSession,
  initMythosFromUrl,
  type MythosLaunchSession,
} from "../lib/mythos";

type MythosContextValue = {
  /** True while a `?lt=` exchange is still in flight. */
  loading: boolean;
  /** The launched Mythos consumer, or null for ordinary visitors. */
  session: MythosLaunchSession | null;
  /** Set when Mythos launched us but the token was rejected. */
  launchError: string | null;
};

const MythosContext = createContext<MythosContextValue>({
  loading: false,
  session: null,
  launchError: null,
});

function hasLaunchToken() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("lt")
  );
}

export function MythosProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(hasLaunchToken);
  const [session, setSession] = useState<MythosLaunchSession | null>(() =>
    typeof window === "undefined" ? null : getMythosSession(),
  );
  const [launchError, setLaunchError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void initMythosFromUrl().then((result) => {
      if (!active) return;
      if (result.launched && result.ok) {
        setSession(result.session);
      } else if (result.launched) {
        setLaunchError(
          result.status === 401
            ? "This Mythos launch link was already used. Open RizzCode from Mythos again."
            : "RizzCode could not confirm your Mythos launch. Open it from Mythos again.",
        );
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<MythosContextValue>(
    () => ({ loading, session, launchError }),
    [loading, session, launchError],
  );
  return (
    <MythosContext.Provider value={value}>{children}</MythosContext.Provider>
  );
}

export function useMythos() {
  return useContext(MythosContext);
}
