import { Keypair } from '@solana/web3.js';
import { KeypairWallet, SolanaAgentKit } from 'solana-agent-kit';

const keypair = Keypair.generate();
const wallet = new KeypairWallet(keypair);
const rpcUrl = 'https://api.devnet.solana.com';
const agent = new SolanaAgentKit(wallet, rpcUrl, {});

try {
  const { blockhash, lastValidBlockHeight } = await agent.connection.getLatestBlockhash();
  const balanceLamports = await agent.connection.getBalance(wallet.publicKey);
  console.log(JSON.stringify({
    rpcUrl,
    publicKey: wallet.publicKey.toBase58(),
    blockhash,
    lastValidBlockHeight,
    balanceLamports
  }, null, 2));
} catch (error) {
  console.error('solana-agent-kit verification failed:', error);
  process.exit(1);
}
