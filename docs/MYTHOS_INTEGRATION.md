# Mythos marketplace integration

Mythos (mythos.work) is an app store for AI apps. A Mythos consumer opens
RizzCode inside the Mythos dashboard, already signed in there, and pays per
use from a Mythos wallet. RizzCode joined the Mythos Founding Builders
Program on 2026-07-23; listing on Mythos is the program's one hard
requirement. Mythos is an additional channel: rizzcodes.com, Supabase accounts
and the guest flow keep working unchanged.

SDK and contract: <https://github.com/Mythoswork/mythos-sdk> (`@mythos-work/sdk`).

## How a launch works

1. Mythos redirects the consumer to the listing's launch URL with `?lt=<jwt>`
   appended. The token is signed by Mythos (ES256), scoped to our listing ID,
   single-use, and lives about five minutes.
2. The browser (`src/lib/mythos.ts`, run by `MythosProvider`) calls
   `GET /api/mythos/session?lt=...`.
3. The server (`server/mythos/shim.ts`) runs the SDK's `requireLaunchToken()`,
   which verifies the signature against the Mythos JWKS and calls Mythos
   `/consume`. A consume failure is a 503 and no access, never a fallback.
4. The server answers with the session and a **pass**: the session HMAC-signed
   with the same key as conversation receipts (`server/signing.ts`), valid 12
   hours. The browser keeps it in `sessionStorage`, scrubs `?lt=` from the URL
   and posts `{ type: "mythos:handshake" }` to the parent frame so the Mythos
   dashboard stops waiting.
5. `authenticatedFetch` sends the pass as the `x-rizzcode-mythos` header on
   every API call. A pass holder counts as authenticated, so the three-scenario
   guest limit and the login gate do not apply.

## What gets charged

Metering runs server-side in `src/app/api/[...path]/route.ts` after the work
succeeded, through `server/mythos/meter.ts`:

| Action | Reason string | Credits env var | Idempotency key |
| --- | --- | --- | --- |
| Persona reply (each user turn) | `persona-turn` | `MYTHOS_CREDITS_PER_TURN` (default 1) | `<attemptId>:turn:<n>` |
| Judgment (one per rep) | `judgment` | `MYTHOS_CREDITS_PER_JUDGMENT` (default 1) | `<attemptId>:judgment` |

Billing never blocks the product: a wallet failure is logged
(`[mythos] usage not metered` with `insufficient_funds`, `session_not_found`
or `failed`) and the consumer still gets the turn or the verdict. Tighten this
once real usage shows what a credit is worth.

`POST /api/mythos/report-usage` exists because the contract requires it. It
only accepts a pass holder, ignores any `sessionJti` that is not the pass's
own, and caps a call at 10 credits.

## Routes

| Route | Purpose |
| --- | --- |
| `GET /.well-known/mythos-handshake?lt=` | Publish gate; rewritten to `/api/mythos/handshake` in `next.config.ts`. Mythos calls it when the listing is created and refuses to publish on anything but 200. |
| `GET /api/mythos/session?lt=` | Launch token exchange, returns `{ ok, session, pass }`. |
| `POST /api/mythos/report-usage` | Contract route, see above. |

## Environment

| Var | Notes |
| --- | --- |
| `MYTHOS_LISTING_ID` | From the Mythos producer dashboard after creating the listing. Empty means every launch is refused with 401 and nothing else changes. |
| `MYTHOS_API_URL` | Defaults to `https://api.mythos.work` inside the SDK. |
| `MYTHOS_CREDITS_PER_TURN`, `MYTHOS_CREDITS_PER_JUDGMENT` | Positive integers, default 1. |

Set them in Vercel for Production and Preview.

## Listing the app

1. Create the listing on Mythos with launch URL
   `https://www.rizzcodes.com/practice`, the RizzCode lockup from
   `public/brand/rizzcode-lockup.png` and the line "RizzCode: LeetCode for
   dating."
2. Mythos runs the handshake against the launch URL's origin during creation.
3. Copy the listing ID into `MYTHOS_LISTING_ID` on Vercel and redeploy.

## Verifying without Mythos

`server/mythos/testing.ts` is a fake Mythos: a real ES256 key pair, a JWKS
document, token minting and an in-memory `/consume` and `/meter`.
`server/mythos/mythos.test.ts` drives the three routes and the meter through
it. For a browser pass, `npm run mythos:local` starts the same fake as an HTTP
server on port 5055 and prints a launch URL; run the app with
`MYTHOS_API_URL=http://127.0.0.1:5055 MYTHOS_LISTING_ID=listing-rizzcode-local`
and open that URL.

Contract smoke checks against any deployment:

```bash
curl -i "https://www.rizzcodes.com/.well-known/mythos-handshake"          # 401 Missing launch token
curl -i "https://www.rizzcodes.com/.well-known/mythos-handshake?lt=nope"  # 401 Invalid launch token
curl -i "https://www.rizzcodes.com/api/mythos/session?lt=nope"            # 401, never 404
```

## Known gaps to raise with Mythos

- `https://api.mythos.work` answered 404 to `/.well-known/jwks.json` and to
  `/api/apps/sessions/<jti>/consume` on 2026-09-21, so the SDK default cannot
  verify a real token yet. Confirm the production API URL with the Mythos team.
- Whether `sessionJti` outlives the five-minute launch token for metering is
  not settled by the docs; a RizzCode rep can take longer. If `/meter` starts
  answering 404 mid-rep, the fix is to re-launch or to ask Mythos for a longer
  session TTL.
- The Mythos dashboard may require a pre-charge confirmation round trip
  (`mythos:confirm-charge`). Per-turn confirmations would break the chat flow,
  so RizzCode meters without it for now.
