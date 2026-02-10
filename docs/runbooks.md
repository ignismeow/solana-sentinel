# Sentinel Runbooks

Operational checklists for the most common workflows. Follow them verbatim so that every action leaves an auditable trail.

## 1. Routine Health Check (daily)

1. `pm2 status` / `docker compose ps` / `systemctl status sentinel` – ensure the listener is up.
2. `tail -n 50 compliance/logs/<today>.md` – confirm webhook traffic is flowing.
3. `ls compliance/audit` – verify the current day file exists (proofs are being generated).
4. Hit `GET /` to confirm HTTP health, preferably via your load balancer.
5. Validate Telegram alerts by sending a `/ping` command to the bot (expect an echo within 10s).

## 2. Add or Remove a Verified Sender

1. Open `compliance/verified_senders.json`.
2. Add/remove the base58 Solana address from the `addresses` array.
3. Commit the change (if you version-control compliance data) or document the update in your compliance log.
4. Restart Sentinel (if you run it as a long-lived process) so the new whitelist is reloaded.

## 3. Handling a High-Risk Alert

1. Check Telegram/stdout alert for the triggering signature.
2. Inspect `compliance/audit/<date>.md` for the entry with `action: LOCK_FUNDS`.
3. Verify the `txSignature` on Solana Explorer (devnet/mainnet) to ensure funds landed in the quarantine address.
4. If `executionDetails.method` is `agentwallet`, confirm the AgentWallet dashboard reflects the transfer.
5. If the quarantine failed:
   - Review `logs/<date>.md` to confirm payload details.
   - Retry via `scripts/retry-lock.js <signature> <override-quarantine>` (tooling TBD) or manually re-run `lockFunds` via a REPL.
   - Document remediation in the audit log as `action: RETRY_LOCK`.

## 4. Promoting Quarantined Funds (Manual Release)

> _Note: release tooling is not automated yet. Use Solana CLI until the thaw runbook is scripted._

1. Load the quarantine keypair stored at `compliance/quarantine-keypair.json` into Solana CLI.
2. Run `solana transfer <destination> <amount> --from compliance/quarantine-keypair.json --url <cluster-url>`.
3. Append a manual audit entry describing the release rationale.
4. Notify stakeholders via Telegram/Slack with tx signature + reason.

## 5. Rotating the Quarantine Keypair

1. Generate a new keypair: `solana-keygen new -o compliance/quarantine-keypair.json.new`.
2. Update `compliance/quarantine.json` with the new `publicKey`.
3. Move existing lamports from the old keypair to the new one.
4. Archive the old keypair securely (encrypted) in case of forensic needs, then remove it from the active repo.
5. Update any infra secrets (Kubernetes secrets, Docker secrets) that mount the keypair.

## 6. Enabling Jito Hybrid Execution

1. Provision a signer funded with enough SOL to cover transfers + tips.
2. Export the keypair JSON to a secure path (outside the repo) and set `JITO_SIGNER_KEYPAIR_PATH`.
3. Set `USE_JITO_BUNDLES=true` and ensure `CLUSTER` is `mainnet` or `mainnet-beta`.
4. Restart Sentinel. Monitor logs for `[execution]` lines confirming bundle submission.
5. If bundles fail (timeout/dropped), Sentinel falls back to AgentWallet transfers automatically. Capture both the fallback signature and the bundle status in the audit file.

## 7. Disaster Recovery (process crash or host failure)

1. Re-deploy Sentinel from the latest git commit.
2. Restore `.agentwallet/config.json`, `compliance/quarantine-keypair.json`, and the latest `verified_senders.json` from your backup vault.
3. Recreate `compliance/logs` and `compliance/audit` directories (Sentinel will append new entries automatically).
4. Replay missed webhooks via Helius (use `helius getTransactions` API filtered by the watch address and POST them to `/helius`).
5. Document the incident timeline and resolution in `compliance/audit/<date>.md` as `action: INCIDENT_REPORT`.

---

For deeper context on how hybrid execution works, see [`docs/jito-hybrid.md`](./jito-hybrid.md).
