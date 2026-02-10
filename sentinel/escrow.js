import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), '.agentwallet', 'config.json');
const QUARANTINE_PATH = path.join(process.cwd(), 'compliance', 'quarantine.json');
const AUDIT_DIR = path.join(process.cwd(), 'compliance', 'audit');
const API_BASE = 'https://agentwallet.mcpay.tech/api';
const FEE_BUFFER_LAMPORTS = 5000; // ~0.000005 SOL
const CALL_DELAY_MS = 2000;
const RETRY_DELAY_MS = 5000;

function ensureAuditDir() {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

function loadAgentWalletConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

export function loadQuarantineInfo() {
  const raw = fs.readFileSync(QUARANTINE_PATH, 'utf8');
  return JSON.parse(raw);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const queue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  while (queue.length > 0) {
    const task = queue.shift();
    try {
      const result = await task();
      await sleep(CALL_DELAY_MS);
      if (task.resolve) task.resolve(result);
    } catch (error) {
      if (error?.message?.includes('Too Many Requests') || error?.message?.includes('rate limit')) {
        console.warn('[escrow] Rate limited, retrying in 5s');
        await sleep(RETRY_DELAY_MS);
        queue.unshift(task);
        continue;
      }
      if (task.reject) task.reject(error);
    }
  }

  isProcessing = false;
}

async function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push(async () => fn(resolve, reject));
    processQueue();
  });
}

async function signAuditMessage(config, payload) {
  const message = JSON.stringify(payload);
  const res = await fetch(`${API_BASE}/wallets/${config.username}/actions/sign-message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chain: 'solana', message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`sign-message failed: ${text}`);
  }

  const data = await res.json();
  return { message, signature: data?.signature ?? data?.signedMessage ?? null };
}

function appendAuditRecord(record) {
  ensureAuditDir();
  const date = new Date().toISOString().slice(0, 10);
  const logPath = path.join(AUDIT_DIR, `${date}.md`);
  const block = '```\n' + JSON.stringify(record, null, 2) + '\n```';
  const entry = `\n## ${new Date().toISOString()}\n\n${block}\n`;
  fs.appendFileSync(logPath, entry, 'utf8');
}

export async function lockFunds(assessment, options = {}) {
  return enqueue(async () => {
    const config = loadAgentWalletConfig();
    const quarantine = loadQuarantineInfo();
    const quarantineAddress = options.quarantineAddress || quarantine.publicKey;
    const amountLamports = Math.max(assessment.transfer.amountLamports - FEE_BUFFER_LAMPORTS, 0);

    if (amountLamports <= 0) {
      throw new Error('Computed transfer amount is <= 0 after fee buffer.');
    }

    const transferBody = {
      to: quarantineAddress,
      amount: amountLamports.toString(),
      asset: 'sol',
      network: 'devnet',
    };

    const res = await fetch(`${API_BASE}/wallets/${config.username}/actions/transfer-solana`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transferBody),
    });

    const data = await res.json();
    if (!res.ok || data?.error) {
      throw new Error(`AgentWallet transfer failed: ${JSON.stringify(data)}`);
    }

    const txSignature = data?.txHash || data?.transactionHash || data?.signature || 'unknown';

    const auditPayload = {
      action: 'LOCK_FUNDS',
      timestamp: new Date().toISOString(),
      quarantineAddress,
      txSignature,
      reason: assessment.reasons,
      transfer: assessment.transfer,
    };

    const auditProof = await signAuditMessage(config, auditPayload);
    appendAuditRecord({ ...auditPayload, auditProof });

    return { txSignature, auditProof };
  });
}

export async function verifyTransfer(assessment, status = 'VERIFIED') {
  return enqueue(async () => {
    const config = loadAgentWalletConfig();
    const auditPayload = {
      action: status,
      timestamp: new Date().toISOString(),
      transfer: assessment.transfer,
      reasons: assessment.reasons,
    };

    const auditProof = await signAuditMessage(config, auditPayload);
    appendAuditRecord({ ...auditPayload, auditProof });
    return auditProof;
  });
}
