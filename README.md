# Sentinel — Autonomous Compliance Guard for Solana

Sentinel is a 24/7 Solana-native agent that watches an on-chain treasury, flags risky inflows, and auto-quarantines suspect funds into a holding wallet. It combines the Colosseum compliance rules with deterministic logging, Telegram alerts, and (optionally) Jito bundle execution for front-running protection.

https://github.com/ignismeow/solana-sentinel

## Highlights

- **Always-on monitoring** – Helius webhooks stream every treasury touch straight into the watcher/risk engine.
- **Deterministic risk model** – configurable SOL threshold + verified sender whitelist.
- **Active Defense loop** – high-risk deposits are swept to the quarantine account via AgentWallet or smart execution.
- **Signed audit proofs** – every lock or verification emits an AgentWallet-signed JSON blob stored under `compliance/audit/*`.
- **Hybrid Jito execution** – on mainnet Sentinel sends the quarantine transfer + tip inside a bundle to avoid MEV sniping; on devnet it simulates with a standard send.
- **Operator ergonomics** – Telegram notifications, markdown logs, ready-to-run Docker compose, and runbooks for day-2 tasks.

## Quickstart

1. **Install & configure**
   ```bash
   git clone https://github.com/ignismeow/solana-sentinel.git
   cd solana-sentinel
   npm install
   ```
   Populate `.agentwallet/config.json`, `compliance/quarantine.json`, and `compliance/verified_senders.json`. See [`docs/setup.md`](./docs/setup.md).

2. **Set environment variables**
   ```bash
   cp .env.example .env   # create and edit
   export $(grep -v '^#' .env | xargs)
   ```
   Each variable is documented in [`docs/env-vars.md`](./docs/env-vars.md).

3. **Run the listener**
   ```bash
   node server.js
   # or
   docker compose up --build -d
   ```
   Point your Helius webhook at `https://<host>/helius`. Trigger a test transfer and watch Telegram + `compliance/logs/<date>.md` for activity.

## Architecture overview

```
Helius Webhook → watcher → riskEngine → escrow → execution (AgentWallet/Jito) → audit + alerts
```

- [`docs/architecture.md`](./docs/architecture.md) deep dives each component.
- [`sentinel/execution.js`](./sentinel/execution.js) contains the hybrid execution path.
- [`docs/jito-hybrid.md`](./docs/jito-hybrid.md) explains how bundles are assembled and monitored.

## Operations & Runbooks

- [`docs/runbooks.md`](./docs/runbooks.md) – health checks, whitelisting, incident response, and key rotation.
- `compliance/logs/*.md` – immutable webhook transcripts, one file per day.
- `compliance/audit/*.md` – signed audit proofs for every action (lock, verify, manual release, incident report).

## Environment Essentials

| Variable | Purpose |
| --- | --- |
| `CLUSTER` | `devnet`, `mainnet`, or `mainnet-beta`. Controls RPC + execution behavior. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Enables real-time alerting. |
| `USE_JITO_BUNDLES` + `JITO_SIGNER_KEYPAIR_PATH` | Turn on hybrid execution and provide the signer JSON used for bundles. |
| `JITO_TIP_LAMPORTS` | Default 0.001 SOL; adjust to match risk appetite. |

Full matrix lives in [`docs/env-vars.md`](./docs/env-vars.md).

## Project layout

```
.
├── compliance/            # ROE, webhook config, quarantine keypair, logs, audits
├── docs/                  # Architecture, setup, env vars, runbooks, execution notes
├── sentinel/              # Core logic (watcher, risk engine, escrow, execution)
├── server.js              # Express listener & webhook handler
├── docker-compose.yml     # Containerized deployment
├── Dockerfile             # node:22-alpine baseline
├── frontend/ (coming soon)
└── package.json
```

## Dashboard UI (optional)

The React/Vite dashboard lives in `frontend/` and consumes the `/api/events`, `/api/balances`, and `/api/bundle` endpoints that ship with the server.

```bash
cd frontend
PATH=/workspace/node/bin:$PATH npm install   # already done once
npm run dev
```

By default Vite proxies `/api/*` to `http://localhost:3000`, so run the backend locally (or set `VITE_API_BASE`) before launching the UI. For production you now have two choices:

1. **Serve from Docker:** `docker compose up -d --build` now spins up both `sentinel-compliance` (API) and `sentinel-dashboard` (Vite preview on port 4173) with the frontend prebuilt against the internal API address.
2. **Serve static dist manually:** `npm run build` and host `frontend/dist` behind the same domain as the backend (set `VITE_API_BASE_URL` at build time if needed).

## Deployment options

| Mode | Command | Notes |
| ---- | ------- | ----- |
| Local dev | `node server.js` | Quickest iteration loop. |
| Docker | `docker compose up -d --build` | Restarts automatically (`restart: always`). |
| PM2/systemd | `pm2 start server.js --name sentinel` | Any process manager works; remember to export env vars. |

## Telemetry & Alerting

- Logs: `docker logs -f sentinel-compliance` (or `pm2 logs`).
- Alerts: Telegram bot posts high-risk events with the lock transaction + audit proof signature.
- Webhook trace: `tail -f compliance/logs/<date>.md`.

## Roadmap

- ✅ Jito hybrid execution with bundle status tracking.
- 🔄 React/Vite dashboard (`frontend/`) showing live events & balances.
- 🔄 Automated quarantine release tooling.
- 🔄 Devnet faucet proxy to keep AgentWallet topped up.

## Contributing

Pull requests welcome. Please run `npm test` (placeholder) and keep compliance artifacts out of git. Use the provided Dockerfile/compose or your own stack, but never commit secrets.

---
Built by **ignismeow** + **Senti** for the Colosseum Solana Agent Hackathon.
