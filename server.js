import express from 'express';
import bodyParser from 'body-parser';
import { Connection, PublicKey } from '@solana/web3.js';
import { persistWebhookRaw, extractTransfers } from './sentinel/watcher.js';
import { assessTransfers } from './sentinel/riskEngine.js';
import { lockFunds, verifyTransfer, loadQuarantineInfo } from './sentinel/escrow.js';

const app = express();
const PORT = process.env.PORT || 3000;
const WATCHED_ADDRESS = '9sFm5xoNgh258BakHC1dxNYBU34Aiq3XfBX3Y4y8SBHG';
const RISK_CONFIG = { thresholdSol: 0.1 };
const { publicKey: QUARANTINE_ADDRESS } = loadQuarantineInfo();
const CLUSTER = (process.env.CLUSTER || 'devnet').toLowerCase();
const SOL_LAMPORTS = 1_000_000_000;
const RPC_ENDPOINTS = {
  devnet: 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
};
const RPC_URL = process.env.RPC_URL || RPC_ENDPOINTS[CLUSTER] || RPC_ENDPOINTS.devnet;
const connection = new Connection(RPC_URL, 'confirmed');

const dashboardState = {
  events: [],
  balances: {
    watched: null,
    quarantine: null,
    lastUpdated: null,
    cluster: CLUSTER,
    rpcUrl: RPC_URL,
  },
  bundle: {
    lastMethod: null,
    lastBundleId: null,
    lastStatus: null,
    submittedSignature: null,
    lastUpdated: null,
    error: null,
  },
};

function pushEvent(event) {
  dashboardState.events.unshift({ ...event, recordedAt: new Date().toISOString() });
  if (dashboardState.events.length > 50) {
    dashboardState.events.length = 50;
  }
}

function describeTransfer(assessment) {
  const transfer = assessment.transfer;
  let direction = 'UNKNOWN';
  if (transfer.to === WATCHED_ADDRESS) direction = 'INBOUND';
  else if (transfer.from === WATCHED_ADDRESS) direction = 'OUTBOUND';

  return {
    signature: transfer.signature,
    slot: transfer.slot,
    timestamp: transfer.timestamp ? new Date(transfer.timestamp * 1000).toISOString() : new Date().toISOString(),
    amountLamports: transfer.amountLamports,
    amountSol: transfer.amountSol,
    from: transfer.from,
    to: transfer.to,
    direction,
    risk: assessment.isHighRisk ? 'HIGH' : 'LOW',
    reasons: assessment.reasons,
  };
}

function updateBundleStatus(details = {}, overrides = {}) {
  const previous = dashboardState.bundle;
  dashboardState.bundle = {
    lastMethod: details.method || overrides.method || previous.lastMethod,
    lastBundleId: details.bundleId ?? overrides.bundleId ?? previous.lastBundleId,
    lastStatus:
      overrides.status ||
      details.bundleStatus?.status ||
      previous.lastStatus ||
      (details.method && details.method !== 'jito-bundle' ? 'not_applicable' : previous.lastStatus),
    submittedSignature: details.signature || overrides.submittedSignature || previous.submittedSignature,
    lastUpdated: new Date().toISOString(),
    error: Object.prototype.hasOwnProperty.call(overrides, 'error') ? overrides.error : null,
  };
}

async function refreshBalances() {
  const next = { ...dashboardState.balances };
  try {
    const [watchedLamports, quarantineLamports] = await Promise.all([
      connection.getBalance(new PublicKey(WATCHED_ADDRESS)).catch((err) => {
        console.error('[Sentinel] Failed to fetch watched balance', err.message);
        return null;
      }),
      connection.getBalance(new PublicKey(QUARANTINE_ADDRESS)).catch((err) => {
        console.error('[Sentinel] Failed to fetch quarantine balance', err.message);
        return null;
      }),
    ]);

    if (watchedLamports !== null) {
      next.watched = {
        address: WATCHED_ADDRESS,
        lamports: watchedLamports,
        sol: watchedLamports / SOL_LAMPORTS,
      };
    }

    if (quarantineLamports !== null) {
      next.quarantine = {
        address: QUARANTINE_ADDRESS,
        lamports: quarantineLamports,
        sol: quarantineLamports / SOL_LAMPORTS,
      };
    }

    next.lastUpdated = new Date().toISOString();
    next.cluster = CLUSTER;
    next.rpcUrl = RPC_URL;
    dashboardState.balances = next;
  } catch (err) {
    console.error('[Sentinel] refreshBalances error', err.message);
  }
}

refreshBalances();
const BALANCE_REFRESH_MS = parseInt(process.env.BALANCE_REFRESH_MS || '30000', 10);
setInterval(refreshBalances, BALANCE_REFRESH_MS);

app.get('/', (req, res) => {
  res.status(200).send('Sentinel listener up');
});

app.get('/api/events', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '25', 10), 50);
  res.json({ events: dashboardState.events.slice(0, Math.max(limit, 0)) });
});

app.get('/api/balances', (req, res) => {
  res.json(dashboardState.balances);
});

app.get('/api/bundle', (req, res) => {
  res.json(dashboardState.bundle);
});

async function notifyTelegram(message, extra = '') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const text = `${message}\n${extra}`.trim();

  if (!token || !chatId) {
    console.log(`[Sentinel][ALERT] ${text}`);
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error('Failed to send Telegram alert', err.message);
  }
}

async function handleTransfers(payload) {
  persistWebhookRaw(payload);
  const transfers = extractTransfers(payload, WATCHED_ADDRESS);

  if (!transfers.length) {
    return;
  }

  const assessments = assessTransfers(transfers, RISK_CONFIG);

  for (const assessment of assessments) {
    const baseEvent = describeTransfer(assessment);

    if (assessment.isHighRisk) {
      try {
        const { txSignature, auditProof, executionDetails } = await lockFunds(assessment, {
          quarantineAddress: QUARANTINE_ADDRESS,
        });
        updateBundleStatus(executionDetails || { method: 'agentwallet' });
        pushEvent({
          ...baseEvent,
          status: 'QUARANTINED',
          action: 'lockFunds',
          txSignature,
          auditProof: auditProof?.signature || null,
          execution: executionDetails || { method: 'agentwallet' },
        });
        await notifyTelegram(
          `High-risk transfer quarantined. Trigger tx: ${txSignature}`,
          `Audit Proof: ${auditProof.signature}`
        );
      } catch (err) {
        console.error('Failed to lock funds', err);
        updateBundleStatus({}, { status: 'error', error: err.message });
        pushEvent({
          ...baseEvent,
          status: 'LOCK_FAILED',
          action: 'lockFunds',
          error: err.message,
        });
        await notifyTelegram(
          `High-risk transfer LOCK FAILED for ${assessment.transfer.signature}`,
          err.message
        );
      }
    } else {
      try {
        const auditProof = await verifyTransfer(assessment, 'VERIFIED');
        pushEvent({
          ...baseEvent,
          status: 'VERIFIED',
          action: 'verifyTransfer',
          auditProof: auditProof.signature,
        });
        console.log('Transfer verified', {
          signature: assessment.transfer.signature,
          auditProof: auditProof.signature,
        });
      } catch (err) {
        console.error('Audit proof generation failed', err.message);
        pushEvent({
          ...baseEvent,
          status: 'VERIFY_FAILED',
          action: 'verifyTransfer',
          error: err.message,
        });
      }
    }
  }
}

app.post('/helius', bodyParser.raw({ type: '*/*', limit: '2mb' }), (req, res) => {
  let payload = {};
  try {
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString('utf8').trim();
      payload = text ? JSON.parse(text) : {};
    } else if (typeof req.body === 'string') {
      payload = req.body ? JSON.parse(req.body) : {};
    } else if (typeof req.body === 'object' && req.body !== null) {
      payload = req.body;
    }
  } catch (err) {
    console.error('Failed to parse webhook payload', err.message);
    res.status(400).send('Invalid payload');
    return;
  }

  res.status(200).send('OK');

  (async () => {
    try {
      await handleTransfers(payload);
    } catch (error) {
      console.error('Sentinel handler error', error);
    }
  })();
});

app.listen(PORT, () => {
  console.log(`Sentinel listener running on port ${PORT}`);
});
