import fs from 'fs';
import path from 'path';
import { ParsedTransfer } from './watcher.js';

export interface RiskConfig {
  thresholdSol: number;
  verifiedListPath?: string;
}

export interface RiskAssessment {
  transfer: ParsedTransfer;
  isHighRisk: boolean;
  reasons: string[];
  isVerifiedSource: boolean;
}

const DEFAULT_VERIFIED = path.join(process.cwd(), 'compliance', 'verified_senders.json');

function loadVerifiedAddresses(filePath: string = DEFAULT_VERIFIED): Set<string> {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    const addresses: string[] = json?.addresses ?? [];
    return new Set(addresses.map((addr) => addr.trim()));
  } catch (err) {
    console.warn('[riskEngine] Unable to load verified_senders.json, treating all senders as unverified.', err);
    return new Set();
  }
}

export function assessTransfers(transfers: ParsedTransfer[], config: RiskConfig): RiskAssessment[] {
  const threshold = config.thresholdSol ?? 0.1;
  const verified = loadVerifiedAddresses(config.verifiedListPath);

  return transfers.map((transfer) => {
    const reasons: string[] = [];
    const isVerifiedSource = transfer.from ? verified.has(transfer.from) : false;

    if (transfer.amountSol > threshold) {
      reasons.push(`Amount ${transfer.amountSol} SOL exceeds threshold ${threshold} SOL`);
    }

    if (!isVerifiedSource) {
      reasons.push('Sender not in verified whitelist');
    }

    return {
      transfer,
      isHighRisk: reasons.length > 0 && (transfer.amountSol > threshold || !isVerifiedSource),
      reasons,
      isVerifiedSource,
    };
  });
}
