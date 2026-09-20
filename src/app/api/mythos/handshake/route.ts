import { runHandshake } from "../../../../../server/mythos/shim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mythos publish gate. Reached at /.well-known/mythos-handshake through the
 * rewrite in next.config.ts; a 200 here is what lets the listing go live.
 */
export async function GET(request: Request) {
  const launchToken = new URL(request.url).searchParams.get("lt");
  const { status, body } = await runHandshake(launchToken);
  console.info(
    "[mythos] handshake",
    JSON.stringify({ status, tokenPresent: Boolean(launchToken) }),
  );
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
