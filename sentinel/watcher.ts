import fs from 'fs';
import path from 'path';

export interface HeliusWebhookPayload {
  webhookID: string;
  webhookType: string;
  notificationType: string;
  accountData: any[];
  transactions: HeliusTransaction[];
}

export interface HeliusTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  source: string | null;
  fee: number;
  nativeTransfers: NativeTransfer[];
  tokenTransfers: TokenTransfer[];
  accountData: any[];
  events?: Record<string, unknown>;
}

export interface NativeTransfer {
  amount: number; // lamports
  decimals?: number;
  fromUserAccount?: string;
  toUserAccount?: string;
}

export interface TokenTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  mint?: string;
  tokenAmount?: {
    userAmount: string;
    decimals: number;
  };
}

export interface ParsedTransfer {
  signature: string;
  slot: number;
  timestamp: number;
  amountLamports: number;
  amountSol: number;
  from: string | undefined;
  to: string | undefined;
}

const LOG_DIR = path.join(process.cwd(), 'compliance', 'logs');

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function persistWebhookRaw(payload: HeliusWebhookPayload) {
  ensureLogDir();
  const date = new Date().toISOString().slice(0, 10);
  const logPath = path.join(LOG_DIR, `${date}.md`);
  const entry = `\n## ${new Date().toISOString()}\n\n<details>\n<summary>Helius payload</summary>\n\n\n
${'```
' + JSON.stringify(payload, null, 2) + '
```'}\n\n</details>\n`;
  fs.appendFileSync(logPath, entry, 'utf8');
}

export function extractTransfers(payload: HeliusWebhookPayload, watchedAddress: string): ParsedTransfer[] {
  if (!payload?.transactions) return [];
  const transfers: ParsedTransfer[] = [];

  for (const tx of payload.transactions) {
    if (!tx.nativeTransfers) continue;
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
