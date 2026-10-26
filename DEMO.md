# Try AFTERHOURS

## Without a wallet

Open the app and explore the three spaces. Drag the atelier to rotate it, change its light, toggle motion and try the three guided cases. These are prewritten illustrations and never consume chain or model resources.

Select **On chain → Network, contract & public record → Read finalized example** for the published public record. **Inspect transaction** reads a transaction hash from Studio or a wallet, verifies it against the bundled contract and offers a JSON export. This does not submit a transaction.

## Create a reservation

1. Connect an EVM wallet on Stable Studionet 61999. The app can request the network switch.
2. Choose a room, UTC date and time. Describe sound, tools, party size and any need for silence.
3. Read the latest slot to obtain its revision. Sign one reservation request.
4. Check the saved transaction until finality. Successful execution and matching state readback are required. A `CONFLICT`, `UNCERTAIN` or `FULL` decision does not consume capacity.
5. Use Cancel on your active reservation to release it. Follow that transaction through finality as well.

If the network or wallet interrupts submission, retain the request and recover the exact hash from wallet activity. Do not re-send an uncertain request. After a stale-revision rejection, read the slot again and use a fresh request ID only after confirming the prior transaction failed.

## Studio deployment

Import `contracts/afterhours.py` into [GenLayer Studio](https://studio.genlayer.com/). Select **Normal (Full Consensus)** and deploy with no constructor arguments. Verify the transaction has finalized successfully. In AFTERHOURS, inspect its transaction hash; the app checks the returned source against the bundled contract before using the address.

For a self-hosted deployment, update `public/deployment.json` with the verified address and receipt hashes, then build again. Never paste a private key into the application or repository.
