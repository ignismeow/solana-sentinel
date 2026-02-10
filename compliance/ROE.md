# Compliance Rules of Engagement

- **Address under watch:** 9sFm5xoNgh258BakHC1dxNYBU34Aiq3XfBX3Y4y8SBHG (Solana devnet compliance treasury).
- **Monitoring directive:** Track every incoming transaction to the treasury. For any credit > 0.1 SOL originating from an unverified address, create an immediate flag inside the workspace (log entry + alert).
- **Audit Proof policy:** For every transaction observed (regardless of amount or origin), generate an "Audit Proof" consisting of:
  - a canonical log line (timestamp, signature, amount, source, verification status), and
  - a signed message derived from the Solana CLI signer or AgentWallet proving observation/verification.
- **Verification source of truth:** Maintain a whitelist of verified counterparties in `compliance/verified_senders.json`. Any address absent from that list is treated as unverified until explicitly added.
- **Reporting:** Aggregate daily compliance summaries into `compliance/logs/YYYY-MM-DD.md` and surface high-priority flags immediately to ignismeow via this workspace.
- **Automation target:** Implement `scripts/sentinel.ts` (or similar) that runs an "Active Compliance Loop" leveraging Helius webhooks or Solana websocket subscriptions to trigger checks and proofs autonomously.
