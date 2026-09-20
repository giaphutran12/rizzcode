/**
 * Browser side of the Mythos marketplace launch. When Mythos opens RizzCode it
 * appends a single-use `?lt=` token; we trade it for a server-signed pass,
 * scrub the token from the URL, and tell the Mythos frame we are ready.
 * Without `?lt=` nothing here runs and RizzCode behaves exactly as before.
 */

export interface MythosLaunchSession {
  userId: string;
  email: string;
  displayName: string;
  listingId: string;
  sessionJti: string;
}

export const MYTHOS_PASS_HEADER = "x-rizzcode-mythos";
const PASS_KEY = "rizzcode.mythos.pass";
const SESSION_KEY = "rizzcode.mythos.session";

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getMythosPass(): string | null {
  return storage()?.getItem(PASS_KEY) ?? null;
}

export function getMythosSession(): MythosLaunchSession | null {
  const raw = storage()?.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MythosLaunchSession;
  } catch {
    return null;
  }
}

export function clearMythosSession() {
  storage()?.removeItem(PASS_KEY);
  storage()?.removeItem(SESSION_KEY);
}

function rememberSession(session: MythosLaunchSession, pass: string) {
  storage()?.setItem(PASS_KEY, pass);
  storage()?.setItem(SESSION_KEY, JSON.stringify(session));
}

function stripLaunchTokenFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("lt")) return;
  url.searchParams.delete("lt");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}

/** Lets the Mythos dashboard know the embedded app loaded and authenticated. */
export function announceReadyToMythos() {
  try {
    window.parent.postMessage({ type: "mythos:handshake" }, "*");
  } catch {
    // Not embedded or the parent refused the message; nothing to do.
  }
}

export type MythosLaunchResult =
  | { launched: false }
  | { launched: true; ok: true; session: MythosLaunchSession }
  | { launched: true; ok: false; status: number };

let inFlight: Promise<MythosLaunchResult> | null = null;

/**
 * Exchanges `?lt=` for a pass exactly once per page load. The token is
 * single-use on the Mythos side, so concurrent callers (React strict mode
 * runs effects twice) share one exchange. Resolves `{ launched: false }` for
 * ordinary visits.
 */
export function initMythosFromUrl(): Promise<MythosLaunchResult> {
  const launchToken = new URLSearchParams(window.location.search).get("lt");
  if (!launchToken) return Promise.resolve({ launched: false });
  inFlight ??= exchangeLaunchToken(launchToken);
  return inFlight;
}

/** Test hook: forget the shared exchange so the next call starts fresh. */
export function resetMythosLaunchForTests() {
  inFlight = null;
}

async function exchangeLaunchToken(
  launchToken: string,
): Promise<MythosLaunchResult> {

  try {
    const response = await fetch(
      `/api/mythos/session?lt=${encodeURIComponent(launchToken)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      console.warn(
        "[mythos] launch exchange rejected",
        JSON.stringify({ status: response.status }),
      );
      return { launched: true, ok: false, status: response.status };
    }
    const data = (await response.json()) as {
      session?: MythosLaunchSession;
      pass?: string;
    };
    if (!data.session || !data.pass) {
      return { launched: true, ok: false, status: 502 };
    }
    rememberSession(data.session, data.pass);
    announceReadyToMythos();
    return { launched: true, ok: true, session: data.session };
  } catch {
    console.warn("[mythos] launch exchange unreachable");
    return { launched: true, ok: false, status: 0 };
  } finally {
    stripLaunchTokenFromUrl();
  }
}
