# Sentinel Setup Guide

This guide covers everything required to install, configure, and operate the Sentinel compliance loop locally or on a remote host.

## 1. Prerequisites

- **Node.js 22.x** (matches the hackathon baseline). Use `nvm` or download binaries.
- **npm** (ships with Node 22).
- **Solana CLI** (>= v1.18) – used for local testing and key management.
- **Helius account** with webhook support (devnet or mainnet).
- **AgentWallet account** tied to the treasury you are monitoring.
- **Git + Docker (optional)** if you plan to containerize via `docker-compose.yml`.

## 2. Install dependencies

```bash
npm install
```

This pulls the Express server, Solana web3 bindings, and `jito-ts` bundle tooling.

## 3. Configure AgentWallet access

1. Create `.agentwallet/config.json` (already present in repo). The structure is:
   ```json
   {
     "username": "<agentwallet-handle>",
     "email": "<contact>",
     "solanaAddress": "<treasury pubkey>",
     "apiToken": "<machine token>"
   }
   ```
2. Keep the file outside of version control (already gitignored).
3. Sentinel uses this token to:
   - Initiate transfers via `actions/transfer-solana`.
   - Request signed audit messages via `actions/sign-message`.

## 4. Compliance data directory

Everything sensitive lives in `./compliance`:

- `verified_senders.json` – whitelist of addresses allowed to send large transfers without quarantine.
- `quarantine.json` – object that exposes `publicKey` for the quarantine wallet (used by default).
- `quarantine-keypair.json` – keypair used when running hybrid execution without AgentWallet.
- `helius-webhook.json` – reference configuration for the webhook that should target `POST /helius`.
- `logs/` & `audit/` – created automatically.

> **Tip:** keep an encrypted backup of this directory; losing the keypair renders quarantined funds inaccessible.

## 5. Environment variables

Populate a `.env` file or export variables before starting the server. See [`docs/env-vars.md`](./env-vars.md) for full descriptions. At minimum you will need:

- `PORT` (optional, defaults to 3000)
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` for alerts (optional but recommended)
- `CLUSTER`, `USE_JITO_BUNDLES`, `JITO_SIGNER_KEYPAIR_PATH` if you plan to run smart execution

## 6. Start the Sentinel listener

```bash
node server.js
```

or via Docker:

```bash
docker compose up --build
```

The listener exposes:

- `GET /` healthcheck
- `POST /helius` webhook endpoint (body is treated as raw JSON to preserve canonical payloads)

## 7. Wire up the Helius webhook

Point your Helius webhook to `https://<your-host>/helius` (or `http://localhost:3000/helius` for local testing). The sample configuration stored in `compliance/helius-webhook.json` shows a devnet webhook that watches the compliance treasury.

## 8. Dry-run workflow

1. Send a small transfer (< threshold) from a wallet that exists in `verified_senders.json`.
2. Confirm the transfer is logged in `compliance/logs/<date>.md` and that `sentinel/riskEngine.js` marks it as `isHighRisk: false`.
3. Send a larger transfer (> threshold) from an address **not** on the whitelist.
4. Verify that Sentinel:
   - Attempts a quarantine (AgentWallet transfer or smart execution)
   - Writes an audit record in `compliance/audit/<date>.md`
   - Emits a Telegram alert (or stdout fallback)

## 9. Production hardening checklist

- Put the Express app behind HTTPS with a reverse proxy (Caddy, Nginx, Fly.io, etc.).
- Store environment secrets in a manager (Doppler, 1Password CLI, AWS Parameter Store).
- Enable process supervision (systemd, PM2, Docker) to restart Sentinel on crashes.
- Monitor disk usage for `compliance/logs` and rotate/ship to longer-term storage if needed.

---

Once setup is complete, move on to the [runbooks](./runbooks.md) for day-2 operations.
