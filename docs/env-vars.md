# Sentinel Environment Variables

| Variable | Required? | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | Port for the Express listener. |
| `TELEGRAM_BOT_TOKEN` | No | _unset_ | Bot token used when sending quarantine alerts. If missing, Sentinel logs alerts to stdout only. |
| `TELEGRAM_CHAT_ID` | No | _unset_ | Chat/channel ID that receives Telegram alerts. Must be set with `TELEGRAM_BOT_TOKEN`. |
| `CLUSTER` | No | `devnet` | Cluster hint for both the watcher and smart executor (`devnet`, `mainnet`, `mainnet-beta`). |
| `RPC_URL` | No | Solana public RPC for the cluster | Overrides the RPC connection used by `execution.js` when simulating bundle submissions. |
| `USE_JITO_BUNDLES` | No | `false` | Enables smart execution path that attempts Jito bundle submission before falling back to AgentWallet transfers. |
| `JITO_SIGNER_KEYPAIR_PATH` | **Yes when `USE_JITO_BUNDLES=true`** | _n/a_ | Filesystem path (absolute or relative) to the JSON secret key used to sign hybrid transfers and bundle tips. |
| `JITO_BLOCK_ENGINE_URL` | No | `mainnet.block-engine.jito.wtf` | Block engine endpoint for bundle submission. Use devnet/testnet endpoints when available. |
| `JITO_TIP_LAMPORTS` | No | `1000000` (0.001 SOL) | Amount of SOL tipped to the selected Jito block engine account per quarantine bundle. |
| `JITO_BUNDLE_TRANSACTION_LIMIT` | No | `3` | Max transactions allowed inside a single bundle. Sentinel currently submits one transfer + one tip (2 total). |
| `JITO_BUNDLE_TIMEOUT_MS` | No | `30000` | How long to wait for bundle settlement before returning `timeout`. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Optional | _—_ | Provide both to receive high-risk alerts in Telegram. |

## Files treated as configuration

While not exported as environment variables, the following files behave like configuration inputs and should be maintained with the same rigor:

- **`.agentwallet/config.json`** – contains `username` and `apiToken` used for API access.
- **`compliance/quarantine.json`** – provides the fallback quarantine destination when not specified by runbook overrides.
- **`compliance/verified_senders.json`** – informs the risk engine whitelist.

> Store secrets in a proper vault and mount them at runtime whenever you deploy Sentinel; never bake them into container images or commit them to git.
