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

## Join the waitlist

1. Read the latest slot. When it is full for your party, Reserve is disabled and **Join waitlist** is offered instead. Joining uses the same request form and revision; one entry per wallet per slot, at most 8 per slot.
2. Check the saved transaction until finality. The read-back record shows `WAITLISTED` with your `POSITION` in the queue. A waitlisted wallet cannot also hold an active reservation on the same slot.
3. Anyone can press **Promote head** on a slot with a queue. Promotion re-checks capacity and compatibility for the head entry only: success turns it into a reservation (`PROMOTED`), otherwise the head stays queued and the record counts one more deferral (`PROMOTION_DEFERRED`). An empty queue promotes nothing (`WAITLIST_EMPTY`).
4. Use **Leave** on your own queue entry to give up your place. The record then shows `WAITLIST_LEFT` and the queue closes up behind you. Positions are always read back from the finalized slot state, never assumed.

If the network or wallet interrupts submission, retain the request and recover the exact hash from wallet activity. Do not re-send an uncertain request. After a stale-revision rejection, read the slot again and use a fresh request ID only after confirming the prior transaction failed.

## Studio deployment

Import `contracts/afterhours.py` into [GenLayer Studio](https://studio.genlayer.com/). Select **Normal (Full Consensus)** and deploy with no constructor arguments. Verify the transaction has finalized successfully. In AFTERHOURS, inspect its transaction hash; the app checks the returned source against the bundled contract before using the address.

For a self-hosted deployment, update `public/deployment.json` with the verified address and receipt hashes, then build again. Never paste a private key into the application or repository.
