import fs from 'fs';
import path from 'path';

const DEFAULT_VERIFIED = path.join(process.cwd(), 'compliance', 'verified_senders.json');

function loadVerifiedAddresses(filePath = DEFAULT_VERIFIED) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    const addresses = json?.addresses ?? [];
    return new Set(addresses.map((addr) => addr.trim()));
  } catch (err) {
    console.warn('[riskEngine] Unable to load verified_senders.json, treating all senders as unverified.', err.message);
    return new Set();
  }
}

export function assessTransfers(transfers, config = {}) {
  const threshold = config.thresholdSol ?? 0.1;
  const verified = loadVerifiedAddresses(config.verifiedListPath);

  return transfers.map((transfer) => {
    const reasons = [];
    const isVerifiedSource = transfer.from ? verified.has(transfer.from) : false;

    if (transfer.amountSol > threshold) {
      reasons.push(`Amount ${transfer.amountSol} SOL exceeds threshold ${threshold} SOL`);
    }

    if (!isVerifiedSource) {
      reasons.push('Sender not in verified whitelist');
    }

    const isHighRisk = transfer.amountSol > threshold && !isVerifiedSource;

    return {
      transfer,
      isHighRisk,
      reasons,
      isVerifiedSource,
    };
  });
}
