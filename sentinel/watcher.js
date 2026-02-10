import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'compliance', 'logs');

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function persistWebhookRaw(payload) {
  ensureLogDir();
  const date = new Date().toISOString().slice(0, 10);
  const logPath = path.join(LOG_DIR, `${date}.md`);
  const payloadBlock = '```\n' + JSON.stringify(payload, null, 2) + '\n```';
  const entry = `\n## ${new Date().toISOString()}\n\n<details>\n<summary>Helius payload</summary>\n\n${payloadBlock}\n\n</details>\n`;
  fs.appendFileSync(logPath, entry, 'utf8');
}

function normalizeTransactions(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload?.transactions) {
    return payload.transactions;
  }
  if (payload?.data?.transactions) {
    return payload.data.transactions;
  }
  return [];
}

export function extractTransfers(payload, watchedAddress) {
  const transactions = normalizeTransactions(payload);
  const transfers = [];

  for (const tx of transactions) {
    if (!tx?.nativeTransfers) continue;
    for (const transfer of tx.nativeTransfers) {
      if (transfer.toUserAccount !== watchedAddress && transfer.fromUserAccount !== watchedAddress) {
        continue;
      }
      const amountLamports = transfer.amount ?? 0;
      const amountSol = amountLamports / 1_000_000_000;
      transfers.push({
        signature: tx.signature,
        slot: tx.slot,
        timestamp: tx.timestamp,
        amountLamports,
        amountSol,
        from: transfer.fromUserAccount,
        to: transfer.toUserAccount,
      });
    }
  }

  return transfers;
}
