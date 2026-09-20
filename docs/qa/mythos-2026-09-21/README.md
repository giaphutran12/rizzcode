# Mythos launch QA, 2026-09-21

Local stack: `npm run mythos:local` (fake Mythos API on 5055) + `next dev` on 4180 with mock persona and judge, no Supabase. Driven with Playwright.

| Receipt | What it shows |
| --- | --- |
| 01-launched-curriculum.png | Redirect from the fake Mythos `/launch` landed on /practice with `?lt=` scrubbed. |
| 02-curriculum-past-guest-limit-as-mythos.png | Same guest device with 3 completed reps, as a Mythos consumer (full page): DOM count 64 available / 0 locked, 0 login links, guest notice absent, nav reads "Consumer One". |
| 03-control-same-guest-without-mythos-locked.png | Control, Mythos session cleared on the same device (full page): DOM count 64 locked / 0 available, 64 login links, guest notice present, nav reads "Log in". |
| 04-fourth-scenario-opens-for-mythos-consumer.png | RC-004 briefing opens for the consumer instead of the login wall. |
| 05-three-turns-as-consumer-one.png | Three turns played; nav shows the Mythos display name instead of Log in. |
| 06-judgment-delivered-and-metered.png | Verdict rendered after End & get judgment. |

Server log (`[mythos]` lines) from the run:

```
[mythos] handshake {"status":200,"tokenPresent":true}
[mythos] launch consumed {"listingId":"listing-rizzcode-local","sessionJtiLength":12}
[mythos] launch consumed {"listingId":"listing-rizzcode-local","sessionJtiLength":12}
[mythos] usage metered {"action":"persona-turn","credits":1,"attemptId":"67b9640b-4a2d-4305-9883-f3009f9e26fc","turn":1,"listingId":"listing-rizzcode-local"}
[mythos] usage metered {"action":"persona-turn","credits":1,"attemptId":"67b9640b-4a2d-4305-9883-f3009f9e26fc","turn":2,"listingId":"listing-rizzcode-local"}
[mythos] usage metered {"action":"persona-turn","credits":1,"attemptId":"67b9640b-4a2d-4305-9883-f3009f9e26fc","turn":3,"listingId":"listing-rizzcode-local"}
[mythos] usage metered {"action":"judgment","credits":1,"attemptId":"67b9640b-4a2d-4305-9883-f3009f9e26fc","listingId":"listing-rizzcode-local"}
```

Fake Mythos wallet ledger (one consume per launch, four charges for the rep):

```
[mythos-local] {"method":"POST","path":"/api/apps/sessions/jti-qiffx18h/consume","status":200,"consumed":2,"metered":0,"lastMeter":null}
[mythos-local] {"method":"POST","path":"/api/apps/sessions/jti-5myplmxy/consume","status":200,"consumed":3,"metered":0,"lastMeter":null}
[mythos-local] {"method":"POST","path":"/api/apps/sessions/jti-5myplmxy/meter","status":200,"consumed":3,"metered":1,"lastMeter":{"credits":1,"charge_id":"67b9640b-4a2d-4305-9883-f3009f9e26fc:turn:1","reason":"persona-turn"}}
[mythos-local] {"method":"POST","path":"/api/apps/sessions/jti-5myplmxy/meter","status":200,"consumed":3,"metered":2,"lastMeter":{"credits":1,"charge_id":"67b9640b-4a2d-4305-9883-f3009f9e26fc:turn:2","reason":"persona-turn"}}
[mythos-local] {"method":"POST","path":"/api/apps/sessions/jti-5myplmxy/meter","status":200,"consumed":3,"metered":3,"lastMeter":{"credits":1,"charge_id":"67b9640b-4a2d-4305-9883-f3009f9e26fc:turn:3","reason":"persona-turn"}}
[mythos-local] {"method":"POST","path":"/api/apps/sessions/jti-5myplmxy/meter","status":200,"consumed":3,"metered":4,"lastMeter":{"credits":1,"charge_id":"67b9640b-4a2d-4305-9883-f3009f9e26fc:judgment","reason":"judgment"}}
```

Browser console: 0 errors, 0 warnings across the run.
