import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMythosSession,
  getMythosPass,
  getMythosSession,
  initMythosFromUrl,
  resetMythosLaunchForTests,
} from "./mythos";

const session = {
  userId: "consumer-1",
  email: "consumer@example.com",
  displayName: "Consumer One",
  listingId: "listing-1",
  sessionJti: "jti-1",
};

describe("Mythos launch in the browser", () => {
  beforeEach(() => {
    resetMythosLaunchForTests();
    clearMythosSession();
    window.history.replaceState({}, "", "/practice?lt=launch-token&x=1");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("exchanges the launch token, keeps the pass, scrubs the URL and signals the frame", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ ok: true, session, pass: "signed-pass" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const post = vi.spyOn(window.parent, "postMessage");

    const result = await initMythosFromUrl();

    expect(result).toEqual({ launched: true, ok: true, session });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/mythos/session?lt=launch-token",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(getMythosPass()).toBe("signed-pass");
    expect(getMythosSession()).toEqual(session);
    expect(window.location.search).toBe("?x=1");
    expect(post).toHaveBeenCalledWith({ type: "mythos:handshake" }, "*");
  });

  it("scrubs the URL and keeps no pass when the token is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "Invalid" }, { status: 401 })),
    );
    const result = await initMythosFromUrl();
    expect(result).toEqual({ launched: true, ok: false, status: 401 });
    expect(getMythosPass()).toBeNull();
    expect(window.location.search).toBe("?x=1");
  });

  it("shares one exchange between concurrent callers", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ ok: true, session, pass: "signed-pass" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const [first, second] = await Promise.all([
      initMythosFromUrl(),
      initMythosFromUrl(),
    ]);
    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stays out of the way on ordinary visits", async () => {
    window.history.replaceState({}, "", "/practice");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await initMythosFromUrl()).toEqual({ launched: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
