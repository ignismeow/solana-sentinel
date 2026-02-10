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

app.use(bodyParser.json({ type: '*/*' }));

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

app.post('/helius', async (req, res) => {
  try {
    const payload = req.body;
    persistWebhookRaw(payload);
    const transfers = extractTransfers(payload, WATCHED_ADDRESS);

    if (!transfers.length) {
      return res.status(200).json({ ok: true, processed: 0 });
    }

    const assessments = assessTransfers(transfers, RISK_CONFIG);
    const results = [];

    for (const assessment of assessments) {
      if (assessment.isHighRisk) {
        try {
          const { txSignature, auditProof } = await lockFunds(assessment, {
            quarantineAddress: QUARANTINE_ADDRESS,
          });
          results.push({ signature: assessment.transfer.signature, status: 'QUARANTINED', txSignature });
          await notifyTelegram(
            `High-risk transfer quarantined. Trigger tx: ${txSignature}`,
            `Audit Proof: ${auditProof.signature}`
          );
        } catch (err) {
          console.error('Failed to lock funds', err);
          results.push({ signature: assessment.transfer.signature, status: 'FAILED', error: err.message });
          await notifyTelegram(
            `High-risk transfer LOCK FAILED for ${assessment.transfer.signature}`,
            err.message
          );
        }
      } else {
        try {
          const auditProof = await verifyTransfer(assessment, 'VERIFIED');
          results.push({ signature: assessment.transfer.signature, status: 'VERIFIED', audit: auditProof.signature });
        } catch (err) {
          console.error('Audit proof generation failed', err.message);
          results.push({ signature: assessment.transfer.signature, status: 'AUDIT_FAILED', error: err.message });
        }
      }
    }

    res.status(200).json({ ok: true, processed: assessments.length, results });
  } catch (error) {
    console.error('Sentinel handler error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Sentinel listener running on port ${PORT}`);
});
