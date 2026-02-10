import fs from 'fs';
import path from 'path';
import bs58 from 'bs58';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { searcher, bundle } from 'jito-ts';

const { searcherClient } = searcher;
const { Bundle } = bundle;

const DEFAULT_RPC = {
  devnet: 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
};

const connectionCache = new Map();

function getCluster() {
  return (process.env.CLUSTER || 'devnet').toLowerCase();
}

function getRpcUrl(cluster) {
  if (process.env.RPC_URL) return process.env.RPC_URL;
  return DEFAULT_RPC[cluster] || DEFAULT_RPC.devnet;
}

function getConnection(cluster) {
  const key = `${cluster}:${getRpcUrl(cluster)}`;
  if (!connectionCache.has(key)) {
    connectionCache.set(key, new Connection(getRpcUrl(cluster), 'confirmed'));
  }
  return connectionCache.get(key);
}

function loadKeypair(keypairPath) {
  const absolutePath = path.isAbsolute(keypairPath)
    ? keypairPath
    : path.join(process.cwd(), keypairPath);
  const secret = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

function pickRandomTipAccount(accounts) {
  if (!accounts?.length) {
    throw new Error('No tip accounts returned by block engine');
  }
  const index = Math.floor(Math.random() * accounts.length);
  return new PublicKey(accounts[index]);
}

async function waitForBundleResult(client, targetBundleId, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        cancel();
        resolve({ status: 'timeout' });
      }
    }, timeoutMs);

    const cancel = client.onBundleResult((bundleResult) => {
      if (bundleResult.bundleId !== targetBundleId) {
        return;
      }

      if (bundleResult.finalized || bundleResult.processed || bundleResult.dropped || bundleResult.rejected) {
        if (!done) {
          clearTimeout(timer);
          done = true;
          cancel();
          let status = 'processed';
          if (bundleResult.finalized) status = 'finalized';
          else if (bundleResult.dropped) status = 'dropped';
          else if (bundleResult.rejected) status = 'rejected';
          resolve({ status, bundleResult });
        }
      }
    }, (err) => {
      if (!done) {
        clearTimeout(timer);
        done = true;
        cancel();
        reject(err);
      }
    });
  });
}

async function executeViaRpc({ connection, signer, toPubkey, amountLamports }) {
  console.log('[execution] Simulating Jito on Devnet (standard sendTransaction)');
  const tx = new Transaction().add(SystemProgram.transfer({
    fromPubkey: signer.publicKey,
    toPubkey: new PublicKey(toPubkey),
    lamports: amountLamports,
  }));
  tx.feePayer = signer.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  const signature = await connection.sendTransaction(tx, [signer]);
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  return { signature, method: 'rpc-direct' };
}

async function executeViaJito({
  connection,
  signer,
  toPubkey,
  amountLamports,
  blockEngineUrl,
  tipLamports,
  bundleTransactionLimit,
  bundleTimeoutMs,
}) {
  const client = searcherClient(blockEngineUrl, signer);
  const tipAccountsResult = await client.getTipAccounts();
  if (!tipAccountsResult.ok) {
    throw new Error(`Failed to fetch tip accounts: ${tipAccountsResult.error?.details || tipAccountsResult.error?.message || tipAccountsResult.error}`);
  }

  const tipAccount = pickRandomTipAccount(tipAccountsResult.value);
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: new PublicKey(toPubkey),
      lamports: amountLamports,
    }),
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: tipAccount,
      lamports: tipLamports,
    }),
  ];

  const latestBlockhash = await connection.getLatestBlockhash('finalized');
  const message = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(message);
  versionedTx.sign([signer]);
  const signature = bs58.encode(versionedTx.signatures[0]);

  const bundleLimit = bundleTransactionLimit || 3;
  let bundleInstance = new Bundle([], bundleLimit);
  const maybeBundle = bundleInstance.addTransactions(versionedTx);
  if (maybeBundle instanceof Error) {
    throw new Error(`Failed to add transfer to bundle: ${maybeBundle.message}`);
  }
  bundleInstance = maybeBundle;

  const sendResult = await client.sendBundle(bundleInstance);
  if (!sendResult.ok) {
    throw new Error(`Bundle submission failed: ${sendResult.error?.details || sendResult.error?.message || sendResult.error}`);
  }

  const bundleId = sendResult.value;
  const status = await waitForBundleResult(client, bundleId, bundleTimeoutMs);
  return { signature, method: 'jito-bundle', bundleId, bundleStatus: status };
}

export async function executeSmartTransfer({
  signerKeypairPath,
  toPubkey,
  amountLamports,
  tipLamports = parseInt(process.env.JITO_TIP_LAMPORTS || '1000000', 10),
  bundleTransactionLimit = parseInt(process.env.JITO_BUNDLE_TRANSACTION_LIMIT || '3', 10),
  bundleTimeoutMs = parseInt(process.env.JITO_BUNDLE_TIMEOUT_MS || '30000', 10),
  cluster: overrideCluster,
  blockEngineUrl = process.env.JITO_BLOCK_ENGINE_URL || 'mainnet.block-engine.jito.wtf',
}) {
  if (!signerKeypairPath) {
    throw new Error('Missing signer keypair path for smart execution');
  }

  const cluster = (overrideCluster || getCluster()).toLowerCase();
  const signer = loadKeypair(signerKeypairPath);
  const connection = getConnection(cluster);

  if (cluster !== 'mainnet' && cluster !== 'mainnet-beta') {
    return executeViaRpc({ connection, signer, toPubkey, amountLamports });
  }

  return executeViaJito({
    connection,
    signer,
    toPubkey,
    amountLamports,
    blockEngineUrl,
    tipLamports,
    bundleTransactionLimit,
    bundleTimeoutMs,
  });
}
