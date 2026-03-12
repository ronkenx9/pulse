/**
 * setup-subscription.ts
 *
 * Creates the on-chain Somnia Reactivity subscription that connects:
 *   PulseGame (emitter: ReactionSubmitted) --> ReactionHandler (handler: _onEvent)
 *
 * Run AFTER deploying contracts:
 *   npx ts-node scripts/setup-subscription.ts
 *
 * Requirements:
 *   - PRIVATE_KEY in .env (deployer wallet must hold >= 32 STT)
 *   - PulseGame and ReactionHandler already deployed
 */

import { createPublicClient, createWalletClient, http, parseGwei, keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SDK } from '@somnia-chain/reactivity';
import * as dotenv from 'dotenv';

dotenv.config();

// Somnia Testnet
const somniaTestnet = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.infra.testnet.somnia.network'] },
  },
} as const;

// Deployed addresses
const PULSE_GAME_ADDRESS   = '0x38D37af6807D4629F2956e4c4DCe385719Ab25ee';
const REACTION_HANDLER_ADDRESS = '0xC1c3F7358bb01A95Ab9700e665E84306e72e468C';

// ReactionSubmitted(uint256 indexed duelId, address player)
const REACTION_SUBMITTED_SIG = keccak256(toBytes('ReactionSubmitted(uint256,address)'));

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY not set in .env');

  const account = privateKeyToAccount(`0x${privateKey}`);
  console.log('Subscription owner:', account.address);

  const rpcTransport = http('https://api.infra.testnet.somnia.network', {
    timeout: 120_000,  // 2-minute timeout — Somnia testnet can be slow
    retryCount: 3,
    retryDelay: 3000,
  });

  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: rpcTransport,
  });

  const walletClient = createWalletClient({
    account,
    chain: somniaTestnet,
    transport: rpcTransport,
  });

  const balance = await publicClient.getBalance({ address: account.address });
  const balanceInEther = Number(balance) / 1e18;
  console.log(`Balance: ${balanceInEther.toFixed(4)} STT`);

  if (balanceInEther < 32) {
    throw new Error('Need at least 32 STT to create an on-chain subscription. Get STT from https://testnet.somnia.network');
  }

  const sdk = new SDK({ public: publicClient, wallet: walletClient });

  console.log('\nCreating Somnia Reactivity subscription...');
  console.log('  Emitter (PulseGame):', PULSE_GAME_ADDRESS);
  console.log('  Handler (ReactionHandler):', REACTION_HANDLER_ADDRESS);
  console.log('  Event topic:', REACTION_SUBMITTED_SIG);

  const subscriptionId = await sdk.createSoliditySubscription({
    handlerContractAddress: REACTION_HANDLER_ADDRESS,
    emitter: PULSE_GAME_ADDRESS,
    eventTopics: [REACTION_SUBMITTED_SIG],
    priorityFeePerGas: parseGwei('2'),
    maxFeePerGas: parseGwei('10'),
    gasLimit: 1_000_000n,  // ReactionHandler calls resolveWinner which does ETH transfers + ELO update
    isGuaranteed: true,
    isCoalesced: false,
  });

  console.log('\n✅ Subscription created!');
  console.log('   Subscription ID:', subscriptionId);
  console.log('\nVerify on explorer:');
  console.log(`  https://shannon-explorer.somnia.network/address/${REACTION_HANDLER_ADDRESS}`);
  console.log('\nTo verify subscription info:');
  console.log(`  sdk.getSubscriptionInfo(${subscriptionId})`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exitCode = 1;
});
