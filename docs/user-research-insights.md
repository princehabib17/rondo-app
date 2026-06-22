# Rondo User Research Insights

## Executive Summary

Rondo is solving a real coordination problem for pickup football and futsal: players need trustworthy, low-friction match discovery, while organizers need fewer flakes, cleaner roster operations, and reliable payment tracking. The current app already covers the core loop from browse to join, wallet payment, confirmation, chat, organizer management, waitlists, and payouts. The highest-risk UX gaps are trust before payment, first-run onboarding friction, wallet mental model clarity, and organizer operational confidence.

This report is a heuristic research synthesis based on the current product surface in the repository, not participant interviews. It should be treated as a decision brief and a plan for the first moderated research round.

## Research Method

- Method used now: product walkthrough, code-based journey reconstruction, UX risk analysis, and evidence synthesis.
- Product stage: pre-launch or early v1, with several real flows implemented and some placeholder market/content data.
- Recommended next method: 5 player usability tests, 3 organizer workflow interviews, and 1 diary-style pilot across a live match week.

## Decision Questions

1. Can a new player quickly decide which match is worth joining?
2. Does the user understand when their spot is actually secured?
3. Does the wallet/payment model feel trustworthy enough for first payment?
4. Can organizers create, manage, approve, and reconcile a match without external spreadsheets or chat tools?
5. Which parts of the app should be simplified before pushing growth?

## Behavioral Personas

### 1. The Quick Joiner

Wants to play tonight or this week. Cares about location, time, price, skill level, organizer trust, and whether friends or credible players are joining. They will abandon if the app asks for too much setup before showing value.

Primary jobs:
- Find a nearby match fast.
- Know if the level and venue fit.
- Secure a spot without messaging multiple people.

### 2. The Reliability-Seeking Regular

Plays often and wants repeatable quality. Cares about organizer reputation, roster balance, no-shows, refunds, reminders, and post-booking communication.

Primary jobs:
- Join the right matches repeatedly.
- Avoid mismatched skill levels and chaotic hosts.
- Track confirmed, pending, and unpaid matches.

### 3. The Community Organizer

Runs sessions and wants fewer flakes, cleaner payment handling, and faster roster admin. They are willing to use tools if the app reduces manual work compared with group chats and spreadsheets.

Primary jobs:
- Publish a match quickly.
- Fill slots and manage approvals.
- Track paid, reserved, no-show, and refund states.
- Communicate changes before match day.

## Journey Maps

### Player: First Match Join

1. Entry: chooses create account, log in, or continue as guest.
2. Discovery: lands on feed with carousel, top organizers, featured match, nearby/upcoming lists, and map.
3. Evaluation: opens a match and checks rules, organizer, date, venue, roster, teams, spots, and payment requirements.
4. Commitment: chooses a slot, requests approval, joins waitlist, pays, or reserves depending on rules.
5. Confirmation: sees confirmed, reserved, pending approval, venue payment, or payment-pending state.
6. Follow-through: uses My Matches, organizer room, invite, chat, notifications, map, or help.

Emotional arc:
- Curious at feed.
- Cautious at match detail.
- Anxious at wallet/payment.
- Relieved only if confirmation state is unambiguous.

### Organizer: Match Operations

1. Entry: selects organizer role and completes profile.
2. Creation: enters venue, date/time, format, price, teams, payment rules, privacy, and skill level.
3. Management: reviews roster, approves players, assigns teams, handles waitlist, opens/closes registration, changes pay-later rules, announces updates, starts timer.
4. Reconciliation: checks payments and submits payout request.
5. Support: handles refunds, disputes, no-shows, and player messaging.

Emotional arc:
- Motivated to publish.
- Operationally overloaded if controls are dense.
- Trusting only if payouts and player statuses are clear.

## Key Insights

### HIGH: First payment trust is the most important conversion risk

Evidence:
- The payment flow uses a Rondo Wallet rather than direct match checkout.
- Wallet copy explains that top-ups use PayMongo and money lands in the wallet before being spent on match fees.
- Match detail shows payment rules, but the user must understand multiple states: paid, reserved, pending approval, venue, pending payment, rejected, and waitlist.

Impact:
Players deciding to pay for a stranger-organized match need strong reassurance before adding money. If they do not understand whether payment secures a spot, or what happens after a cancellation, they may avoid paid matches.

Recommendation:
Add a compact "What happens after you pay" block on match detail and payment pages. Include spot guarantee, refund/help path, organizer payout timing, and the exact state they will see after payment.

Priority: HIGH

### HIGH: The feed needs stronger decision signals, not more content

Evidence:
- Feed includes carousel slides, top organizers, featured match, nearby/upcoming sections, map, filters, live listings, player counts, price, format, badges, and organizer names.
- Placeholder organizer groups are used until real organizer data exists.
- Featured game selection prioritizes player count and soonest date.

Impact:
The feed is visually rich, but users make the join decision based on trust, fit, urgency, and convenience. Placeholder or generic content can dilute confidence if it competes with real match data.

Recommendation:
Promote decision signals above editorial content: nearest area, time, skill level, organizer verified status, spots left, friends/regulars, cancellation/refund rule, and "why featured." Keep carousel only if it contains useful live content.

Priority: HIGH

### HIGH: Onboarding asks for too much before the first clear reward

Evidence:
- Role selection comes early.
- Profile setup requires full name, age, gender, phone, address, nationality, position, skill level, preferred foot, preferred areas, and game preference.
- Guest users can browse but are gated when joining.

Impact:
For players, the first value is seeing playable matches. Asking for a full athletic profile before the first join attempt can create drop-off, especially for casual players.

Recommendation:
Split onboarding into required-now and complete-later. For player first join, require only name, phone, position or skill level if needed by organizer, and payment identity basics. Defer avatar, preferred foot, nationality, and broader profile fields until after confirmation.

Priority: HIGH

### HIGH: Organizer tools are powerful but feel like admin controls, not operational guidance

Evidence:
- Organizer manage page exposes announce, timer, payments, cancel/reopen, pay-later toggle, registration toggle, roster, payment status dropdowns, approval, removal, team assignment, and waitlist add.
- Dashboard includes earnings summary and payout request fields.
- Payout amount input expects centavos, which is likely not the organizer's mental model.

Impact:
Organizers need confidence that they can run match day smoothly. Dense controls without task grouping increase risk of status mistakes, incorrect payment labels, or payout confusion.

Recommendation:
Group organizer workflow by phase: Before match, Roster, Payments, Match day, After match. Replace raw payout amount in centavos with peso input and computed available-to-request amount. Add confirmation for destructive/status-changing actions.

Priority: HIGH

### MEDIUM: Waitlist mechanics are fair but may feel unusual

Evidence:
- Waitlist copy says there is no order and everyone is notified when a spot opens.
- First to accept gets in.
- Organizer can also add waitlisted players manually.

Impact:
Some players expect waitlists to be ordered. "No order" can feel unfair unless the reason is explicit.

Recommendation:
Explain the tradeoff: "Fastest claim keeps games full; organizers can still manually add players." Consider testing ordered waitlist versus fastest-claim for perceived fairness and fill rate.

Priority: MEDIUM

### MEDIUM: Empty and placeholder states should collect demand, not just explain absence

Evidence:
- Empty feed states explain that matches will appear when organizers publish.
- Top organizers fallback to placeholders.
- Map warns when matches have no coordinates.

Impact:
Early marketplace cold start is a research and growth opportunity. Empty states should capture where and when users want games.

Recommendation:
Add "Request a match near me" or "Notify me for BGC/Makati/Ortigas" from empty feed and map states. Route this into organizer demand signals.

Priority: MEDIUM

### MEDIUM: My Matches can over-classify the same booking

Evidence:
- My Matches separately renders Upcoming, Pending Approval, Reserved/Unpaid, Completed, Cancelled, and Past.
- The same entry can appear in multiple derived groups if it is both upcoming and pending or reserved.

Impact:
Repeated or overlapping match cards can confuse the user's mental model of what action is required.

Recommendation:
Use one primary status per booking and group by action needed: Action required, Confirmed upcoming, Awaiting organizer, Past/cancelled. Avoid duplicate rendering.

Priority: MEDIUM

## Recommended Study Plan

### Player Usability Test

Participants:
- 5 football/futsal players in Metro Manila.
- Mix of casual and regular players.
- Include at least 2 people who currently join via group chats.

Tasks:
1. Browse as a new user and find a match you would consider joining.
2. Explain what makes you trust or distrust the match.
3. Choose a slot and explain what you think happens next.
4. Use wallet/top-up/payment screens and describe whether your spot is secured.
5. Find where to see your match later and what to do if there is a payment problem.

Success signals:
- User can find a viable match in under 90 seconds.
- User can explain payment and confirmation state correctly.
- User can identify organizer trust signals without prompting.
- User can recover from a wallet or pending state without panic.

### Organizer Interview and Task Walkthrough

Participants:
- 3 organizers who currently run recurring football/futsal sessions.

Tasks:
1. Create a realistic match.
2. Explain how they decide public versus private, pay now versus pay later, and team count.
3. Manage roster changes, approval, payment status, and waitlist.
4. Request payout and explain what amount they expect to receive.

Success signals:
- Organizer can create a match without needing external setup help.
- Organizer can identify which players paid, reserved, or need action.
- Organizer trusts payout status and amount.
- Organizer sees the app as less work than group chat coordination.

## Immediate Product Recommendations

1. Add a trust/payment explainer to match detail and wallet payment.
2. Reduce player onboarding before first join.
3. Rework organizer dashboard/manage into phase-based operational sections.
4. Replace centavos payout input with peso-based amount and available balance copy.
5. Make feed cards more decision-focused: distance, area, verified organizer, spots left, level, pay/refund rule.
6. Turn empty states into demand capture.
7. Simplify My Matches into action-oriented statuses.

## Open Research Questions

1. Do players prefer wallet prepay, direct checkout per match, or pay-at-venue for first booking?
2. Which trust signal matters most: organizer verified, hosted count, player roster, friends attending, refund policy, or venue familiarity?
3. Do organizers want fastest-claim waitlists or ordered/manual approval?
4. What is the minimum profile data organizers need before accepting a player?
5. Which markets or areas have enough supply density for a useful first launch?

