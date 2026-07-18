# RizzCode Product Brief

> Historical prototype brief. The approved product and implementation source of
> truth is [RIZZCODE_MASTER_PLAN.md](RIZZCODE_MASTER_PLAN.md). When the two files
> conflict, the master plan wins.

## Product

RizzCode is a practice environment for men who freeze, overthink, or fumble during real conversations. It turns respectful dating communication into short, repeatable exercises with clear feedback.

The initial audience is men seeking an intentional girlfriend relationship. The product is open to men from any background while holding a clear standard: be honest about intentions, protect both people’s dignity, exercise self-control, avoid sexual pressure, and accept disinterest gracefully.

## Prototype comparison

The GPT Taste direction won the comparison. The selected route and retained references use the same scenario, content, scoring criteria, and mock data:

- `/` is the selected editorial experience
- `/control` is the baseline reference
- `/compare` preserves the original comparison screen

The selected direction won on emotional pull and perceived quality while keeping the three-turn practice flow understandable.

## Core loop

1. Choose a scenario and review its setting, difficulty, and objective.
2. Respond to the other person for up to three conversational turns.
3. Receive a score, criterion-level feedback, and one improved response.
4. See the likely outcome and retry or advance to a harder scenario.

Three turns are enough to evaluate whether the user can open naturally, notice the response, and either build momentum or exit well. They are not meant to simulate an entire relationship.

## Deterministic rubric

Each category scores `0`, `1`, or `2`, for a total out of `10`. This historical
prototype assumed rule-based scoring. The approved master plan replaces that assumption
with a required server-side LLM judge constrained by deterministic gates and arithmetic.

| Criterion | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Respect | Pushy, sexual, insulting, or ignores a boundary | Neutral and non-harmful | Considerate, appropriate, and easy to decline |
| Curiosity | Interrogates, assumes, or shows no interest | Generic question or observation | Specific, open question grounded in the moment |
| Calibration | Misses clear signals or escalates too quickly | Partly acknowledges the reply | Matches her energy and adapts to her response |
| Authenticity | Manipulative line or invented persona | Safe but generic | Natural voice with honest intent |
| Forward motion | Stalls or demands contact | Keeps conversation alive | Offers a proportionate next step without pressure |

Automatic caps should apply when a response contains sexual pressure, insults, deception, repeated contact after rejection, or personal claims unsupported by the scenario.

## Outcomes

Getting a phone number is only one possible positive result. RizzCode should recognize:

- a comfortable conversation with mutual participation
- discovering a shared interest
- earning permission to continue talking
- suggesting a low-pressure next step
- recognizing low interest and ending with dignity
- learning that the match is not compatible

The best outcome is mutual clarity, not conquest.

## Curriculum

Difficulty increases through social ambiguity and emotional stakes:

1. Situational openers in naturally shared contexts
2. Keeping a conversation balanced
3. Reading short, warm, distracted, or closed responses
4. Expressing interest without overcommitting
5. Suggesting a next step
6. Handling rejection, uncertainty, and mismatched values

Scenario examples include a bus stop, library, church event, café, friend gathering, professional meetup, and open-source event.

## Later integrations

### TinyFish personalization

A later agent can turn user-provided profile URLs and explicitly configured TinyFish profiles into a compact interest brief. That brief can generate practice scenarios and likely conversation topics. The generated material should distinguish observed public facts from model inference and should never fabricate familiarity.

### Supabase

Supabase can later store users, scenarios, attempts, rubric scores, streaks, curriculum progress, and personalization summaries. It is intentionally excluded from this design comparison so the team can validate the core loop first.

### LLM and voice

After the deterministic score, an LLM can explain the judgment and generate a stronger alternative response. Voice practice and Vietnamese transcription can follow once text practice is stable.

## Six-hour build order

1. **Hour 0 to 1:** Lock the shared scenario, three-turn flow, rubric, and mock states.
2. **Hour 1 to 2:** Finish `/control` with responsive layout and working interactions.
3. **Hour 2 to 3:** Finish the editorial candidate using identical content and behavior.
4. **Hour 3 to 4:** Add deterministic scoring, outcome states, retry, and progress feedback.
5. **Hour 4 to 5:** Test both routes on desktop and mobile, fix broken states, and select the stronger design.
6. **Hour 5 to 6:** Polish the chosen route, record a short demo, update the README, and prepare the project pitch.

If time slips, cut authentication, persistence, scraping, voice, and live LLM calls. Preserve the three-turn practice loop, visible rubric, meaningful outcome, and a polished demo.
