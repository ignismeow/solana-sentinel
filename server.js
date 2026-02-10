import express from 'express';
import bodyParser from 'body-parser';
import { persistWebhookRaw, extractTransfers } from './sentinel/watcher.js';
import { assessTransfers } from './sentinel/riskEngine.js';
import { lockFunds, verifyTransfer, loadQuarantineInfo } from './sentinel/escrow.js';

const app = express();
const PORT = process.env.PORT || 3000;
const WATCHED_ADDRESS = '9sFm5xoNgh258BakHC1dxNYBU34Aiq3XfBX3Y4y8SBHG';
const RISK_CONFIG = { thresholdSol: 0.1 };
const { publicKey: QUARANTINE_ADDRESS } = loadQuarantineInfo();

app.get('/', (req, res) => {
  res.status(200).send('Sentinel listener up');
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
    if (assessment.isHighRisk) {
      try {
        const { txSignature, auditProof } = await lockFunds(assessment, {
          quarantineAddress: QUARANTINE_ADDRESS,
        });
        await notifyTelegram(
          `High-risk transfer quarantined. Trigger tx: ${txSignature}`,
          `Audit Proof: ${auditProof.signature}`
        );
      } catch (err) {
        console.error('Failed to lock funds', err);
        await notifyTelegram(
          `High-risk transfer LOCK FAILED for ${assessment.transfer.signature}`,
          err.message
        );
      }
    } else {
      try {
        const auditProof = await verifyTransfer(assessment, 'VERIFIED');
        console.log('Transfer verified', {
          signature: assessment.transfer.signature,
          auditProof: auditProof.signature,
        });
      } catch (err) {
        console.error('Audit proof generation failed', err.message);
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
