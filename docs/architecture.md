# Sentinel Architecture

Sentinel is an always-on compliance daemon that ingests Solana transfer webhooks, scores the sender, and locks suspect funds inside a quarantine escrow. The system is small on purpose: every moving piece is auditable and can be reasoned about by a single engineer.

## High-Level Flow

```text
Helius Webhook → watcher → riskEngine → escrow → AgentWallet/Jito → audit + alerts
```

1. **Helius webhook** delivers every transaction touching the compliance treasury (`WATCHED_ADDRESS`).
2. **`watcher.js`** persists the raw payload (`compliance/logs/YYYY-MM-DD.md`) and extracts relevant native transfers.
3. **`riskEngine.js`** scores each transfer:
   - compares against the configured **risk threshold (SOL)** and
   - checks whether the sender exists inside `compliance/verified_senders.json`.
4. **`escrow.js`** handles actions for each assessment:
   - Calls `lockFunds` for high-risk transfers → sweeps funds into the quarantine wallet and writes an audit record.
   - Calls `verifyTransfer` when the transfer is benign → signs an audit proof so the observation is still logged.
5. **Smart execution (`execution.js`)** optionally routes quarantines through Jito bundles on mainnet or simulates bundles via standard RPC on devnet.
6. **Alerts & audit trail**:
   - Telegram (or stdout) alerts for every quarantine attempt.
   - Signed audit records in `compliance/audit/YYYY-MM-DD.md`.

## Component Responsibilities

| Component | File | Responsibility |
| --- | --- | --- |
| Ingress listener | `server.js` | Express app with `/helius` endpoint, handles parsing and async processing |
| Watcher | `sentinel/watcher.js` | Durable raw logging + transfer extraction |
| Risk engine | `sentinel/riskEngine.js` | Stateless heuristics (threshold + whitelist) |
| Escrow controller | `sentinel/escrow.js` | Queueing, AgentWallet API calls, audit signing |
| Smart executor | `sentinel/execution.js` | Jito hybrid execution, RPC fallback |
| Compliance artifacts | `compliance/*` | Helius config, quarantine keypair, rules of engagement, logs |

## Data Stores

- **`.agentwallet/config.json`** – API token + username used to request on-demand signatures from AgentWallet.
- **`compliance/quarantine.json`** – destination public key for seized funds and any supporting metadata.
- **`compliance/quarantine-keypair.json`** – signer used when bypassing AgentWallet in hybrid mode.
- **`compliance/verified_senders.json`** – whitelist the risk engine trusts.
- **`compliance/logs/*.md`** – raw webhook snapshots grouped per day.
- **`compliance/audit/*.md`** – structured audit entries signed via AgentWallet.

## Control Plane Notes

- All sensitive actions are serialized through an in-memory queue (`escrow.js`) to avoid sending multiple AgentWallet transactions simultaneously.
- `CALL_DELAY_MS` + `RETRY_DELAY_MS` prevent Helius or AgentWallet rate limits from thrashing the system.
- Every action that touches funds produces a signed proof (`sign-message` AgentWallet endpoint), giving non-repudiation for compliance reviewers.

---

For operational guidance see [`docs/runbooks.md`](./runbooks.md). For deployment and environment specifics continue with [`docs/setup.md`](./setup.md) and [`docs/env-vars.md`](./env-vars.md).
