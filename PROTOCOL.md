# Reservation protocol

`afterhours-1` stores room-slot ledgers, immutable request inputs and their assessments. A cancellation updates only the reservation's cancellation fields and the slot's active set/history.

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
