#!/usr/bin/env node
/**
 * Runs the fake Mythos API from server/mythos/testing.ts as a real HTTP server
 * so a browser can rehearse a marketplace launch without a Mythos account.
 *
 *   npm run mythos:local            # port 5055, prints a launch URL
 *   (runs under `node --import tsx` so it can load the TypeScript helper)
 *
 * Then start the app with MYTHOS_API_URL=http://127.0.0.1:5055 and
 * MYTHOS_LISTING_ID=listing-rizzcode-local and open the printed URL.
 */
import { createServer } from "node:http";
import { createFakeMythos, FAKE_LISTING_ID } from "../server/mythos/testing.ts";

const port = Number(process.env.MYTHOS_LOCAL_PORT ?? 5055);
const appUrl = process.env.MYTHOS_LOCAL_APP_URL ?? "http://127.0.0.1:4173/practice";
const apiUrl = `http://127.0.0.1:${port}`;
const fake = await createFakeMythos(apiUrl);

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  const url = new URL(req.url ?? "/", apiUrl);

  if (url.pathname === "/launch") {
    const token = await fake.mintLaunchToken();
    res.writeHead(302, { location: `${appUrl}?lt=${encodeURIComponent(token)}` });
    res.end();
    console.error("[mythos-local] minted launch token, redirecting to app");
    return;
  }
  if (url.pathname === "/handshake-token") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end(await fake.mintHandshakeToken());
    return;
  }

  const response = await fake.fetch(`${apiUrl}${req.url}`, {
    method: req.method,
    body: body || undefined,
  });
  res.writeHead(response.status, { "content-type": "application/json" });
  res.end(await response.text());
  console.error(
    "[mythos-local]",
    JSON.stringify({
      method: req.method,
      path: url.pathname,
      status: response.status,
      consumed: fake.consumed.length,
      metered: fake.metered.length,
      lastMeter: fake.metered.at(-1)?.body ?? null,
    }),
  );
}).listen(port, "127.0.0.1", () => {
  console.error(`[mythos-local] fake Mythos API on ${apiUrl}`);
  console.error(`[mythos-local] listing id: ${FAKE_LISTING_ID}`);
  console.error(`[mythos-local] open ${apiUrl}/launch to launch the app with a fresh token`);
});
