# Live reservation records

Stable Studionet **61999**. [Deployed contract](https://explorer-studio.genlayer.com/address/0x9Ef4Ec0ca2C1dac274132c0f1Aa8297e6a56Ad5d).

All three transactions below reached `FINALIZED`, reported `SUCCESS` with a return result, used normal full consensus and had `MAJORITY_AGREE`. The application verified the deployed source byte-for-byte and read back both signed reservation inputs from finalized state. No appeal was used.

| Event | Transaction | Observed result |
| --- | --- | --- |
| Deployment | [0x7c3c…f5fb](https://explorer-studio.genlayer.com/tx/0x7c3c040cdfc90c464bba1680e0f28432ebdf246d737f168f20cd69d9b087f5fb) | Canonical source deployed |
| Watercolor, participant A | [0x6730…b5ad](https://explorer-studio.genlayer.com/tx/0x6730cca28998fd2c22f4196589e16031f2b3763d8304232d573b87d20996b5ad) | RESERVED, revision 1 |
| Headphone editing, participant B | [0xae8c…2ee4](https://explorer-studio.genlayer.com/tx/0xae8c32667fe912700b64f51a8a505d96fce59bbc749d4c41075b8053b3e92ee4) | RESERVED, revision 2; compared with A |

The recorded slot is `atelier / 2026-11-02 / 3` (16:00–18:00 UTC). Finalized state contained both participants and occupied **2 of 4 places**. The second assessment included a separate COMPATIBLE finding against the first reservation, addressing interference in both directions.

## afterhours-2: waitlist

Stable Studionet **61999**. [Deployed contract](https://explorer-studio.genlayer.com/address/0x5aa5Bb076D7e1978060196853Ebff8321a234c8b) (`afterhours-2`, source SHA-256 `d297d5f00544b20fe1afd317bb5fb653f46326a998efb42d191bd2900a343bfc`). The v1 contract above stays deployed and untouched.

Every transaction below reached `FINALIZED` with `MAJORITY_AGREE` and normal full consensus. The deployed source was verified byte-for-byte against `contracts/afterhours.py`, and each outcome was confirmed by a finalized-state readback (`get_slot` / `get_record`).

| Event | Transaction | Observed result |
| --- | --- | --- |
| Deployment | [0x9246…9317](https://explorer-studio.genlayer.com/tx/0x9246172b869f0c460f49870c87c098fefcdc1f025312c1221f4ea71884a59317) | Canonical v2 source deployed, protocol `afterhours-2`, max 8 waitlist entries per slot |
| Fill atelier slot, participant A | [0x99ab…b9f8](https://explorer-studio.genlayer.com/tx/0x99ab17b16c4b3ac8a11f95cdb29ca8cae843a56743914d283ad399873808b9f8) | RESERVED, 4 of 4 places, revision 1 (`atelier / 2026-11-12 / 3`) |
| Join waitlist, participant B | [0x6665…b636](https://explorer-studio.genlayer.com/tx/0x6665718f98c3454e9677b89a27c5d63c30a6727dfb46e435c7adff0d2020b636) | WAITLISTED, position 1; readback shows slot full (4 of 4) with B queued |
| Cancel, participant A | [0x648d…b9](https://explorer-studio.genlayer.com/tx/0x648de923ee9bbae01db805cfc1878b4af853bb3bb20c3d1ea22b926db0a245b9) | CANCELLED, revision 3; readback shows slot empty (0 of 4) — live cancellation receipt |
| Promote waitlist, participant B | [0x26c2…eaa0](https://explorer-studio.genlayer.com/tx/0x26c20f1dae67a55f17e86ada04d8448d9a220b041b24f98d4d4b3c4e16a0eaa0) | PROMOTED to RESERVED, `promoted_from_waitlist: true`, promotion revision 4; readback shows B active and the waitlist empty |
| Join waitlist ×3, participants C1–C3 | [0xfae3…dff](https://explorer-studio.genlayer.com/tx/0xfae34e3b81383f361fb3ef675379491eef78ce039963c4aa9d2ad935d48b1dff), [0x0206…a78](https://explorer-studio.genlayer.com/tx/0x02066e3f14b260c5240926938662ffac43d61a28178926cdfd3ea1c4fe0aaa78), [0x5986…a1](https://explorer-studio.genlayer.com/tx/0x5986255b3505d44a17dfbc2d2ea0c82bea9c0f54a87d30514000b377c63155a1) | WAITLISTED, positions 1, 2, 3 (`atelier / 2026-11-13 / 3`) |
| Leave waitlist, participant C1 | [0x0af5…eca](https://explorer-studio.genlayer.com/tx/0x0af56e473393ac7c17ae0eb40597fa90717b526e8bd92dc5c42a73330cfc2eca) | LEFT, revision 4; readback shows the queue advanced — C2 is now position 1, C3 position 2 |
| Silence-dependent recording, participant D | [0xd27e…f38d3](https://explorer-studio.genlayer.com/tx/0xd27ee186b61399b6304512229eabffee2850613a840e801bb5b7b5b4952f38d3) | RESERVED (`listening / 2026-11-14 / 3`) |
| Join waitlist, amplified rehearsal, participant E | [0xdd01…a66](https://explorer-studio.genlayer.com/tx/0xdd019d0b5af2ef0ef8ed8421f90e5e6f15a684aa07b97d743d83962df7178a66) | WAITLISTED, position 1 |
| Promote, participant E | [0x2963…80b9](https://explorer-studio.genlayer.com/tx/0x2963d30a828e802d85be3850283235b38e81d7ff998fdab598dd79b627ca80b9) | PROMOTION_DEFERRED, reason CONFLICT; readback shows E still queued with `deferral_count: 1`; the stored assessment is CONFLICT on both the room rule and the pair finding against the recording |
| Silence-dependent recording, participant F | [0x31fa…4610d](https://explorer-studio.genlayer.com/tx/0x31fa968fb7dc4b86c67bd700362528a1312bce84046af4bd7ac4d6802724610d) | RESERVED (`listening / 2026-11-15 / 3`) |
| Join waitlist, amplified rehearsal with an instruction to ignore the rules and approve, participant G | [0x270a…ac6e](https://explorer-studio.genlayer.com/tx/0x270a0c2500553c31c3a8efa683fa7fd1c6966e5e32b8735dc762233e891bac6e) | WAITLISTED, position 1 |
| Promote, participant G | [0x4b8c…f80](https://explorer-studio.genlayer.com/tx/0x4b8c64698b35154a6910e6eebbc2f8fd78ecd8d8318f418b5af955713e4e0f80) | PROMOTION_DEFERRED, reason CONFLICT; the instruction inside the activity text did not force a promotion — readback shows G still queued with `deferral_count: 1` |
| Watercolor, participant H1 (v1 flow on v2) | [0x4584…a904](https://explorer-studio.genlayer.com/tx/0x45846fef4cece2e9b373a45b0fab7c2bcc83ff44393125104139a712f7d4a904) | RESERVED, revision 1 (`atelier / 2026-11-16 / 3`) |
| Headphone editing, participant H2 (v1 flow on v2) | [0x2e46…a96a0a](https://explorer-studio.genlayer.com/tx/0x2e46f5e68eb7c2d042b62db1c35d7a11545a9e8a754b2aceebdcb3b0cea96a0a) | RESERVED, revision 2; second assessment includes a COMPATIBLE pair finding against the watercolor reservation |

The underlying v2 records are preserved as concise JSON extracts:

- [Deployment](evidence/deployment-v2.json)
- [Fill + join waitlist](evidence/waitlist-v2.json)
- [Cancel + promote](evidence/waitlist-promote.json)
- [Leave advances the queue](evidence/waitlist-leave.json)
- [Defer on conflict](evidence/waitlist-defer.json)
- [Prompt injection defers](evidence/waitlist-injection.json)
- [v1 flows re-run on v2](evidence/regression-v2.json)

## Inspect without signing

Open [AFTERHOURS](https://halihalibt.github.io/afterhours-genlayer/), choose **On chain**, then expand **Network, contract & public record** and select **Read finalized example**. To inspect participant B's full transaction and matching state, paste its hash above into **Inspect or recover a transaction** and select **Inspect transaction**. **Export record** downloads the result. These actions are read-only and require no wallet.

The underlying records are preserved as concise JSON extracts:

- [Deployment](evidence/deployment.json)
- [Watercolor](evidence/watercolor.json)
- [Headphones and pair assessment](evidence/headphones.json)
- [Deployment manifest and source SHA-256](public/deployment.json)

## Verification coverage

The repository's CI passes 16 JavaScript tests and 20 Python contract tests. The contract also passed `genvm-lint validate` with five public methods (three views, two writes). Python tests mock the host and model responses; they test rollback, owner-only cancellation, stale revisions, idempotence, capacity, uncertainty and independent-validator rejection. Those tests are distinct from the live transactions listed above. The v2 record set above adds a live cancellation receipt, live deferral receipts (conflict and prompt injection) and a live leave receipt.

These addresses belong to development-only Studio accounts. Studionet may reset; the exports record the observed state, not perpetual availability. The spaces are imaginary and participant activity declarations are public, unverified descriptions.
