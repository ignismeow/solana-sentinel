# Jito Hybrid Execution

Sentinel can hand off high-risk quarantines to the Jito block engine whenever it is running on mainnet. The goal is to prevent mempool sniping: we package the treasury-to-quarantine transfer and a tip payment into a single bundle that lands atomically.

## When this path runs

1. `USE_JITO_BUNDLES=true`
2. `JITO_SIGNER_KEYPAIR_PATH` points to a JSON secret key that controls the treasury funds (or a hot wallet with permission to drain it).
3. `CLUSTER` is `mainnet` or `mainnet-beta`.
4. The hybrid executor successfully fetches tip accounts from the block engine.

If any of those conditions fail, Sentinel logs the error and falls back to the AgentWallet REST transfer.

## Flow

```text
lockFunds() → performSmartExecution()
  ├─ getTipAccounts() via searcherClient
  ├─ build transfer instruction: treasury → quarantine (lamports - buffer)
  ├─ add tip instruction (SystemProgram.transfer) to a random tip account
  ├─ compile to VersionedTransaction (Message v0)
  ├─ wrap into Bundle (2 transactions) and submit to block engine
  └─ subscribe to bundle result stream until finalized/processed/dropped/rejected
```

Bundle metadata (`bundleId`, `status`, `tipAccount`, etc.) is appended to the audit record so reviewers know which path was taken.

## Environment knobs

| Variable | Purpose |
| --- | --- |
| `USE_JITO_BUNDLES` | Enables the smart execution path inside `escrow.js`. |
| `JITO_SIGNER_KEYPAIR_PATH` | Path to the JSON secret used to sign the quarantine + tip transactions. Must hold SOL. |
| `JITO_BLOCK_ENGINE_URL` | Defaults to `mainnet.block-engine.jito.wtf`. Override if you are running in another region. |
| `JITO_TIP_LAMPORTS` | Tip amount appended to the bundle. Default 1_000_000 (0.001 SOL). |
| `JITO_BUNDLE_TRANSACTION_LIMIT` | Upper bound for transactions per bundle (default 3). |
| `JITO_BUNDLE_TIMEOUT_MS` | How long to wait for bundle settlement before returning `timeout`. |

## Monitoring bundle status

- Successful submission logs `bundleId` and the immediate result of `sendBundle`.
- The executor subscribes to `onBundleResult` and records the first terminal state: `finalized`, `processed`, `dropped`, or `rejected`.
- Audit entries look like:
  ```json
  {
    "action": "LOCK_FUNDS",
    "txSignature": "...",
    "executionDetails": {
      "method": "jito-bundle",
      "bundleId": "...",
      "bundleStatus": {
        "status": "finalized"
      }
    }
  }
  ```

If `status = timeout`, assume the fallback path ran (AgentWallet). You can replay the bundle manually using the stored `txSignature` if needed.

## Requirements & cautions

- The signer keypair is hot; load it from a secure path and restrict filesystem permissions.
- The signer must maintain enough SOL to cover the quarantine amount **plus** the tip.
- Bundles only make sense on mainnet/mainnet-beta; devnet simply logs "Simulating Jito on Devnet" and uses `connection.sendTransaction`.
- If the block engine is unavailable, Sentinel automatically falls back to AgentWallet.

---
See [`docs/runbooks.md`](./runbooks.md#6-enabling-jito-hybrid-execution) for the exact steps to enable or disable this mode in production.
