# Reservation protocol

`afterhours-2` stores room-slot ledgers, immutable request inputs and their assessments, plus a per-slot FIFO waitlist. A cancellation updates only the reservation's cancellation fields and the slot's active set/history.

## v2: waitlist (`afterhours-2`)

When a slot is full — or whenever a user prefers to queue rather than take an immediate decision — they may join the slot's waitlist instead of reserving. The waitlist is a per-slot FIFO queue stored in the slot ledger (`ledger["waitlist"]`, ordered, max 8 entries). Joining never calls a model: placement is purely positional.

### Methods

| Method | Access | Result |
| --- | --- | --- |
| `join_waitlist(request_id, room, day, slot, activity, people, expected_revision)` | write | Waitlist record JSON (`outcome` `WAITLISTED`) |
| `promote_waitlist(room, day, slot, expected_revision)` | write, anyone | Promoted reservation JSON, or a `PROMOTION_DEFERRED` result |
| `leave_waitlist(request_id)` | write, owner only | Updated waitlist record JSON |

### Join

`join_waitlist` applies the same validation, idempotency, revision guard and owner/history limits as `reserve`: room/slot/date validation, request ID 3–64 chars, activity 20–800 chars, party 1–6, `expected_revision` must equal the current slot revision (`STALE_SLOT_REFRESH_FIRST`), owner request count < 64, slot history < 64. Additional waitlist limits:

- One waitlist entry per owner per slot (`ONE_WAITLIST_ENTRY_PER_OWNER`).
- A waitlisted owner may not also hold an active reservation on the same slot, and an owner holding an active reservation may not join the waitlist (`ONE_ACTIVE_RESERVATION_PER_OWNER` / `ALREADY_ON_WAITLIST` on `reserve`).
- Max 8 entries per slot (`WAITLIST_FULL`).

Joining bumps the slot revision by 1, appends a `WAITLISTED` history event, and stores the record under the same `owner:request_id` key as reservations, distinguishable by `outcome: "WAITLISTED"` plus waitlist fields: `waitlist_status: "QUEUED"`, `position` (1-based at join), `joined_revision`, `deferral_count` (0), `last_deferral` (null), `promoted_from_waitlist: false`, `promotion_revision: null`, `assessment: null`. The record's input hash covers the join payload (including the method), so the same owner/request ID with different input — including a `reserve` call for the same ID — raises `IDEMPOTENCY_CONFLICT`, while an identical repeat returns the previous record without re-queuing.

### Promote

`promote_waitlist` may be called by anyone (no owner check) and considers the HEAD entry only — one candidate per call. The revision guard applies (`STALE_SLOT_REFRESH_FIRST`); an empty queue returns `{"outcome": "WAITLIST_EMPTY", ...}` with no state change.

1. If `occupied + head people > capacity`, the promotion is deferred without any model call: the head entry stays queued, its deferral counter increments, the record gains `last_deferral: {"revision", "reason": "CAPACITY"}`, the slot revision bumps by 1 and a `PROMOTION_DEFERRED` history event is appended. The call returns `{"outcome": "PROMOTION_DEFERRED", "reason": "CAPACITY", "head_key", "request_id", "deferral_count", "revision_before", "revision_after", "record"}`.
2. Otherwise the head entry runs the exact same consensus assessment flow as `reserve` — the leader proposes rule + pair findings via the same fixed prompt (activity text is untrusted data, never instructions), validators re-evaluate, compare the full signal vector and audit explanations; parsing/validation are identical (the assessment is factored into a shared helper used by both `reserve` and `promote_waitlist`). Prompt-injection text in a waitlisted activity therefore cannot force a promotion: a `CONFLICT` or `UNKNOWN` verdict defers, it never auto-promotes.
3. If the assessment is all-compatible, the head entry is promoted: it is appended to the active set, removed from the waitlist, the record becomes `outcome: "RESERVED"` with `waitlist_status: "PROMOTED"`, `promoted_from_waitlist: true`, `promotion_revision` set and the assessment stored; the slot revision bumps by 1 and a `PROMOTED` history event is appended. The call returns the promoted record.
4. If the assessment returns `CONFLICT` or `UNCERTAIN`, the promotion is deferred exactly as in step 1, with `reason` `CONFLICT` or `UNCERTAIN` and the assessment stored on the record; the entry stays queued.

### Head-of-line blocking and the escape hatch

Promotion is strictly head-only, so a head entry that cannot be promoted blocks every entry behind it, even entries that would fit and be compatible. This is intentional and documented: the queue is fair in arrival order and no entry may jump ahead. The escape hatch is `leave_waitlist`: any queued owner may leave at any time, which unblocks the next entry. Repeated deferrals are visible on the record (`deferral_count`, `last_deferral`) and in the ledger history (`PROMOTION_DEFERRED` events), so a blocked head is observable rather than silent.

### Leave

`leave_waitlist(request_id)` is owner-only, resolving the same owner namespace as `cancel`: a non-owner or a missing record raises `RESERVATION_NOT_FOUND`. Only a `WAITLISTED` record can leave; a `RESERVED` record raises `NOT_A_WAITLIST_ENTRY`. Leaving removes the entry from the queue (later entries advance one position), bumps the slot revision by 1, appends a `WAITLIST_LEFT` history event, and marks the record `waitlist_status: "LEFT"` with `position: null` and `left_revision` set. Leaving twice is idempotent and returns the same record.

### Views

- `get_slot` includes `waitlist`: the queue in order, each entry carrying its 1-based `position` plus `key`, `owner`, `request_id`, `activity`, `people`, `joined_revision` and `deferrals`.
- `get_record` returns the stored record; for a queued waitlist record it recomputes the live `position` from the ledger, so the position reflects queue advances after other entries leave.
- `get_protocol` returns `protocol: "afterhours-2"` and adds `max_waitlist_per_slot: 8`; rooms, slots, timezone and the v1 limits are unchanged.

## v1 (`afterhours-1`)

## State transition

1. Validate room, calendar date (2026–2100), slot, party size and description.
2. Resolve the owner from `gl.message.sender_address`. Reuse of the same owner/request ID and identical input returns the previous record; changed input fails.
3. Require the signed expected revision to equal the current slot revision. Check owner/history limits and one active reservation per owner per slot.
4. If the party exceeds remaining capacity, record `FULL` without calling a model.
5. Otherwise, ask a leader for one room-rule finding and one ordered finding for every active reservation. Activity text is untrusted data.
6. Each validator independently evaluates all statuses, compares the full vector and audits the proposed explanations against the declarations. Schema validity alone is insufficient.
7. `CONFLICT` takes priority over `UNKNOWN`; uncertainty becomes `UNCERTAIN`. Only all-compatible findings append an active reservation.
8. Persist the request and increment the slot revision atomically. Any exception or rejected consensus rolls back the transaction.

Cancellation resolves the same owner namespace. Only a prior `RESERVED` result can be cancelled; repeated cancellation is idempotent. The original judgment remains readable. Dates are user-selected labels, with no wall-clock expiration or physical attendance logic.

## Interface

| Method | Access | Result |
| --- | --- | --- |
| `get_protocol()` | view | Room rules, capacities, time slots, limits |
| `get_slot(room, day, slot)` | view | Revision, active participants, occupancy, history |
| `get_record(owner, request_id)` | view | Full record, or empty string |
| `reserve(request_id, room, day, slot, activity, people, expected_revision)` | write | Reservation decision JSON |
| `cancel(request_id)` | write | Updated reservation JSON |

Slots are integers 0–3 corresponding to 09:00–11:00, 11:00–13:00, 14:00–16:00 and 16:00–18:00 UTC. Descriptions are 20–800 characters; IDs are 3–64 ASCII letters, digits, `_` or `-`. Input hashes use SHA-256 over sorted, compact UTF-8 JSON.

## Client verification

The client checks the RPC chain and gas price, verifies byte-for-byte deployed source and protocol identity, then binds receipt sender, recipient, full-consensus flag, method and arguments to the saved intent. `ACCEPTED` is pending. `FINALIZED` alone is insufficient. A returned execution and matching finalized-state record are required for success; rollback/error results cannot pass. An uncertain submission remains saved for hash recovery, not automatic resubmission.

The inspector also accepts transactions created in Studio. It verifies supported methods, canonical source, finalized execution and public readback without signing. Exported JSON distinguishes transaction verification from a plain public-state read.

## Boundaries

One wallet is not one person: Sybil resistance and identity are out of scope. All input is public. An adversarial declaration can lie about actual behavior; prompt hardening cannot solve that. Sequential full-consensus work scales with active reservations, bounded by the room capacities of 3–6. Studionet is a development environment and can be reset. No availability or mainnet readiness guarantee is made.
