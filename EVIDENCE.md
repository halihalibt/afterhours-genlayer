# Live reservation records

Stable Studionet **61999**. [Deployed contract](https://explorer-studio.genlayer.com/address/0x9Ef4Ec0ca2C1dac274132c0f1Aa8297e6a56Ad5d).

All three transactions below reached `FINALIZED`, reported `SUCCESS` with a return result, used normal full consensus and had `MAJORITY_AGREE`. The application verified the deployed source byte-for-byte and read back both signed reservation inputs from finalized state. No appeal was used.

| Event | Transaction | Observed result |
| --- | --- | --- |
| Deployment | [0x7c3c…f5fb](https://explorer-studio.genlayer.com/tx/0x7c3c040cdfc90c464bba1680e0f28432ebdf246d737f168f20cd69d9b087f5fb) | Canonical source deployed |
| Watercolor, participant A | [0x6730…b5ad](https://explorer-studio.genlayer.com/tx/0x6730cca28998fd2c22f4196589e16031f2b3763d8304232d573b87d20996b5ad) | RESERVED, revision 1 |
| Headphone editing, participant B | [0xae8c…2ee4](https://explorer-studio.genlayer.com/tx/0xae8c32667fe912700b64f51a8a505d96fce59bbc749d4c41075b8053b3e92ee4) | RESERVED, revision 2; compared with A |

The recorded slot is `atelier / 2026-11-02 / 3` (16:00–18:00 UTC). Finalized state contained both participants and occupied **2 of 4 places**. The second assessment included a separate COMPATIBLE finding against the first reservation, addressing interference in both directions.

## Inspect without signing

Open [AFTERHOURS](https://halihalibt.github.io/afterhours-genlayer/), choose **On chain**, then expand **Network, contract & public record** and select **Read finalized example**. To inspect participant B's full transaction and matching state, paste its hash above into **Inspect or recover a transaction** and select **Inspect transaction**. **Export record** downloads the result. These actions are read-only and require no wallet.

The underlying records are preserved as concise JSON extracts:

- [Deployment](evidence/deployment.json)
- [Watercolor](evidence/watercolor.json)
- [Headphones and pair assessment](evidence/headphones.json)
- [Deployment manifest and source SHA-256](public/deployment.json)

## Verification coverage

The repository's CI passes 16 JavaScript tests and 20 Python contract tests. The contract also passed `genvm-lint validate` with five public methods (three views, two writes). Python tests mock the host and model responses; they test rollback, owner-only cancellation, stale revisions, idempotence, capacity, uncertainty and independent-validator rejection. Those tests are distinct from the live transactions listed above. Live cancellation and rejection receipts are not included in this record set.

These addresses belong to development-only Studio accounts. Studionet may reset; the exports record the observed state, not perpetual availability. The spaces are imaginary and participant activity declarations are public, unverified descriptions.
