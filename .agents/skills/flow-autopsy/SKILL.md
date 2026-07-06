---
name: flow-autopsy
description: Brutal user-centricity audit. Drives real user journeys in a browser, records video, and scores the flow the way an impatient first-time user experiences it — taps-to-value, dead ends, jargon, thumb reach. Invoke with /flow-autopsy [journey ...].
---

# Flow Autopsy

You are not reviewing screens. You are **a first-time user with 90 seconds of patience**,
and the recording proves what happened to you. Screens can be beautiful and the flow
still broken — this skill only cares about the second thing.

## Non-negotiable rules

1. **Drive it or drop it.** Every journey is executed live with the runner (video on).
   A journey you couldn't complete is not "assumed fine" — it's a finding.
2. **The clock and the tap counter are the critics.** Report exact taps and seconds
   to each milestone. Adjectives don't count; numbers do.
3. **Play the naive user.** Never use knowledge of the codebase to find a path.
   If the UI doesn't show the way, you are lost, and being lost is a finding.
4. **Every dead end gets a screenshot + timestamp in the video.**

## Journeys (default set for this app — extend per invocation)

| J | Journey | Value milestone |
|---|---|---|
| J1 | Cold open → see a joinable match | match card with price + slots visible |
| J2 | Guest → try to join → account wall | wall explains WHY and preserves intent (`next=` redirect) |
| J3 | Signup → onboarding → feed | fields asked vs. fields actually needed |
| J4 | Find match → join → pay from wallet | taps from feed to paid confirmation |
| J5 | Organizer: create a match | required fields, time-to-publish |
| J6 | Something goes wrong (dead link, empty search, failed pay) | is the recovery path one tap away? |

## Run protocol

```
node .agents/skills/savage-visual/runner.mjs flow <name> <url> [--steps steps.json]
```

Records video (`.webm`) + per-step screenshots into `.agents/skills/_evidence/<timestamp>/`.
Watch the artifacts (Read screenshots; send video via SendUserFile), then judge.

## The gates

| # | Gate | Deduction |
|---|---|---|
| F1 | Taps-to-value: >3 taps from cold open to seeing a joinable match | −10 |
| F2 | Intent loss: any wall (login/signup) that forgets where the user was going | −10 |
| F3 | Dead end: any state with no forward action (empty feed with no CTA counts) | −10 per |
| F4 | Interrogation onboarding: any field asked before it's needed for the next action | −6 per |
| F5 | Jargon: system words leaking to users ("payment_status", "RPC", raw error strings) | −8 |
| F6 | Silent failure: an action that fails with no visible feedback within 1s | −10 |
| F7 | Thumb hostility: primary action in top third of screen on mobile flows | −6 |
| F8 | Double-charge anxiety: pay flows with no immediate, unambiguous confirmation state | −10 |
| F9 | Back-button betrayal: browser/gesture back that loses state or traps the user | −8 |
| F10 | Waiting blind: any operation >1s with no progress affordance | −6 |

## Output contract

```
FLOW AUTOPSY — <app> — <date>
Journeys run: N | completed: M | abandoned: K
Score: NN/100 → USER-CENTRIC | USER-HOSTILE

Per journey:
J1 <name> — COMPLETED in T taps / S sec | ABANDONED at <step> (<evidence>)
  findings...

KILL / FIX / POLISH (ranked, each with evidence file or video timestamp)
```

Send the journey videos and the worst screenshots to the user. The report without
the recording is just an opinion.
