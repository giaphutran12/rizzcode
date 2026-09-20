import { verifyAndConsumeLaunchToken } from "../../../../../server/mythos/shim";
import { issueMythosPass } from "../../../../../server/mythos/pass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exchanges the single-use `?lt=` launch token Mythos appends to the app URL
 * for a RizzCode-signed pass the browser sends on later API calls.
 */
export async function GET(request: Request) {
  const launchToken = new URL(request.url).searchParams.get("lt");
  if (!launchToken) {
    return Response.json(
      { error: "Missing launch token" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await verifyAndConsumeLaunchToken(launchToken);
  if (result.status !== 200 || !result.session) {
    console.warn(
      "[mythos] launch rejected",
      JSON.stringify({ status: result.status, body: result.body }),
    );
    return Response.json(result.body, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { session } = result;
  console.info(
    "[mythos] launch consumed",
    JSON.stringify({
      listingId: session.listingId,
      sessionJtiLength: session.sessionJti.length,
    }),
  );
  return Response.json(
    { ok: true, session, pass: issueMythosPass(session) },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
