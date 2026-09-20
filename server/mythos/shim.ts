/**
 * Runs the Express-style handlers from @mythos-work/sdk inside Next.js Route
 * Handlers. The SDK only reads `req.query.lt` and writes `req.mythos`, and the
 * handshake Router matches on `req.method` + `req.url`, so a small fake
 * request and response are enough. Adapted from the SDK's Next.js guide.
 */
import {
  handshakeRoute,
  requireLaunchToken,
  type MythosSession,
} from "@mythos-work/sdk";

export interface HandlerResult {
  status: number;
  body: unknown;
}

type ShimRequest = {
  method: string;
  url: string;
  originalUrl: string;
  baseUrl: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string | undefined>;
  params: Record<string, string>;
  mythos?: MythosSession;
};

type ShimResponse = {
  status: (code: number) => ShimResponse;
  json: (body: unknown) => void;
  end: () => void;
  setHeader: () => ShimResponse;
  getHeader: () => undefined;
};

type ExpressLikeHandler = (
  req: ShimRequest,
  res: ShimResponse,
  next: (error?: unknown) => void,
) => void | Promise<void>;

function runExpressHandler(
  handler: ExpressLikeHandler,
  path: string,
  launchToken: string | null,
): Promise<HandlerResult> {
  return new Promise((resolve) => {
    let statusCode = 200;
    const search = launchToken ? `?lt=${encodeURIComponent(launchToken)}` : "";
    const req: ShimRequest = {
      method: "GET",
      url: `${path}${search}`,
      originalUrl: `${path}${search}`,
      baseUrl: "",
      path,
      headers: {},
      query: { lt: launchToken ?? undefined },
      params: {},
    };
    const res: ShimResponse = {
      status(code) {
        statusCode = code;
        return res;
      },
      json(body) {
        resolve({ status: statusCode, body });
      },
      end() {
        resolve({ status: statusCode, body: null });
      },
      setHeader() {
        return res;
      },
      getHeader() {
        return undefined;
      },
    };
    void handler(req, res, (error) => {
      if (error) {
        resolve({ status: 503, body: { error: "Service unavailable" } });
        return;
      }
      if (!req.mythos) {
        resolve({ status: 404, body: { error: "Not found" } });
        return;
      }
      resolve({ status: 200, body: { ok: true, session: req.mythos } });
    });
  });
}

export async function verifyAndConsumeLaunchToken(
  launchToken: string | null,
): Promise<HandlerResult & { session?: MythosSession }> {
  const result = await runExpressHandler(
    requireLaunchToken() as unknown as ExpressLikeHandler,
    "/api/mythos/session",
    launchToken,
  );
  const body = result.body as { session?: MythosSession } | null;
  return { ...result, session: body?.session };
}

export async function runHandshake(
  launchToken: string | null,
): Promise<HandlerResult> {
  return runExpressHandler(
    handshakeRoute() as unknown as ExpressLikeHandler,
    "/.well-known/mythos-handshake",
    launchToken,
  );
}
