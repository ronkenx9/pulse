import { createPublicClient, createWalletClient, http, parseGwei, keccak256, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SDK } from '@somnia-chain/reactivity';
import * as dotenv from 'dotenv';

dotenv.config();

// ── Config ───────────────────────────────────────────────────────────────────

const RAW_KEY = process.env.BOT_PRIVATE_KEY;
if (!RAW_KEY) throw new Error('BOT_PRIVATE_KEY not set in contracts/.env');
const BOT_PRIVATE_KEY = (RAW_KEY.startsWith('0x') ? RAW_KEY : `0x${RAW_KEY}`) as `0x${string}`;

const PULSE_GAME_ADDRESS = '0x38D37af6807D4629F2956e4c4DCe385719Ab25ee';
const RPC_URL = 'https://api.infra.testnet.somnia.network';
const WSS_URL = 'wss://api.infra.testnet.somnia.network/ws';

// Reaction delay ranges per difficulty (ms).
const DIFFICULTY_RANGES: Record<string, [number, number]> = {
  ROOKIE: [600, 900],
  SOLDIER: [300, 500],
  LEGEND: [100, 200],
};

const BOT_DIFFICULTY = (process.env.BOT_DIFFICULTY ?? 'SOLDIER').toUpperCase();
const [DELAY_MIN, DELAY_MAX] = DIFFICULTY_RANGES[BOT_DIFFICULTY] ?? DIFFICULTY_RANGES.SOLDIER;

// ── Chain ────────────────────────────────────────────────────────────────────

const somniaTestnet = {
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL], webSocket: [WSS_URL] },
    public: { http: [RPC_URL], webSocket: [WSS_URL] },
  },
};

// ── ABI ──────────────────────────────────────────────────────────────────────

const pulseGameAbi = [
  {
    inputs: [{ name: 'duelId', type: 'uint256' }],
    name: 'joinDuel', outputs: [],
    stateMutability: 'payable', type: 'function',
  },
  {
    inputs: [{ name: 'duelId', type: 'uint256' }],
    name: 'armSignal', outputs: [],
    stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'duelId', type: 'uint256' }],
    name: 'submitReaction', outputs: [],
    stateMutability: 'nonpayable', type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'duelId', type: 'uint256' },
      { indexed: false, name: 'player1', type: 'address' },
      { indexed: false, name: 'player2', type: 'address' },
      { indexed: false, name: 'stake', type: 'uint256' },
    ],
    name: 'DuelCreated', type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'duelId', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'SignalFired', type: 'event',
  },
] as const;

// ── State ─────────────────────────────────────────────────────────────────────

const activeDuelIds = new Set<string>();

// ── Main ──────────────────────────────────────────────────────────────────────

async function startBot() {
  const account = privateKeyToAccount(BOT_PRIVATE_KEY);
  const client = createPublicClient({
    chain: somniaTestnet as any,
    transport: http(RPC_URL),
  });
  const wallet = createWalletClient({
    account,
    chain: somniaTestnet as any,
    transport: http(RPC_URL),
  });
  const sdk = new SDK({ public: client as any, wallet: wallet as any });

  console.log(`\x1b[36m[SYSTEM] Bot Initializing...\x1b[0m`);
  console.log(`🤖 Address  : ${account.address}`);
  console.log(`⚔️  Level    : ${BOT_DIFFICULTY} (${DELAY_MIN}–${DELAY_MAX}ms)`);
  console.log(`🎮 Contract : ${PULSE_GAME_ADDRESS}\n`);

  // ── Periodic Heartbeat ───────────────────────────────────────────────────
  const heartbeatInterval = setInterval(() => {
    const timestamp = new Date().toISOString();
    process.stdout.write(`\r\x1b[32m[HEARTBEAT] ${timestamp} :: ACTIVE_DUELS: ${activeDuelIds.size} :: LISTENING...\x1b[0m`);
  }, 30_000);

  // ── Unified Subscription ──────────────────────────────────────────────────
  const subscription = await sdk.subscribe({
    eventContractSources: [PULSE_GAME_ADDRESS],
    onData: async (data: any) => {
      try {
        const log = data.result;
        if (!log || !log.topics || log.topics.length === 0) return;

        const topic0 = log.topics[0];

        // --- 1. DuelCreated ---
        const sigDuelCreated = keccak256(Buffer.from('DuelCreated(uint256,address,address,uint256)'));
        if (topic0 === sigDuelCreated) {
          const decoded = decodeEventLog({ abi: pulseGameAbi, data: log.data, topics: log.topics }) as any;
          const { duelId, player2, stake } = decoded.args;

          const player2Addr = player2.toLowerCase();
          const botAddr = account.address.toLowerCase();
          const isZero = player2Addr === '0x0000000000000000000000000000000000000000';

          if (player2Addr === botAddr || isZero) {
            console.log(`\n[CHALLENGE] Duel #${duelId} detected. Joining...`);
            try {
              const joinHash = await wallet.writeContract({
                address: PULSE_GAME_ADDRESS as `0x${string}`,
                abi: pulseGameAbi,
                functionName: 'joinDuel',
                args: [duelId],
                value: stake,
                gasPrice: parseGwei('50'),
                chain: somniaTestnet as any,
              });
              await client.waitForTransactionReceipt({ hash: joinHash });
              console.log(`[DUEL #${duelId}] Join confirmed.`);

              const armHash = await wallet.writeContract({
                address: PULSE_GAME_ADDRESS as `0x${string}`,
                abi: pulseGameAbi,
                functionName: 'armSignal',
                args: [duelId],
                gasPrice: parseGwei('50'),
                chain: somniaTestnet as any,
              });
              await client.waitForTransactionReceipt({ hash: armHash });
              console.log(`[DUEL #${duelId}] Armed & ready.`);

              activeDuelIds.add(duelId.toString());
            } catch (err) {
              console.error(`[DUEL #${duelId}] Bot join/arm failed:`, err);
            }
          }
        }

        // --- 2. SignalFired ---
        const sigSignalFired = keccak256(Buffer.from('SignalFired(uint256,uint256)'));
        if (topic0 === sigSignalFired) {
          const decoded = decodeEventLog({ abi: pulseGameAbi, data: log.data, topics: log.topics }) as any;
          const { duelId } = decoded.args;

          if (activeDuelIds.has(duelId.toString())) {
            const delay = Math.round(DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN));
            console.log(`\n[SIGNAL] Duel #${duelId} :: REACTOR_START :: ${delay}ms`);

            activeDuelIds.delete(duelId.toString());

            setTimeout(async () => {
              try {
                const hash = await wallet.writeContract({
                  address: PULSE_GAME_ADDRESS as `0x${string}`,
                  abi: pulseGameAbi,
                  functionName: 'submitReaction',
                  args: [duelId],
                  gasPrice: parseGwei('50'),
                  chain: somniaTestnet as any,
                });
                console.log(`[DUEL #${duelId}] Bot reaction submitted: ${hash}`);
              } catch (e) {
                console.error(`[DUEL #${duelId}] Bot reaction failure:`, e);
              }
            }, delay);
          }
        }

      } catch (e) {
        console.error(`\n[ERROR] Event handler failure:`, e);
      }
    },
    onError: (err) => {
      console.error('\n[ERROR] Subscription interrupted:', err);
      throw err;
    },
    ethCalls: [],
  });

  console.log('\x1b[32m[SYSTEM] Bot established. Monitoring neural events...\x1b[0m\n');

  return () => {
    clearInterval(heartbeatInterval);
  };
}

// ── Crash recovery with exponential backoff ───────────────────────────────────
let restartAttempts = 0;
const MAX_RESTART_DELAY_MS = 60_000;

async function runWithRecovery() {
  while (true) {
    let cleanup: (() => void) | undefined;
    try {
      cleanup = await startBot();
      await new Promise(() => { });
    } catch (err) {
      if (cleanup) cleanup();
      restartAttempts++;
      const delay = Math.min(1000 * 2 ** restartAttempts, MAX_RESTART_DELAY_MS);
      console.error(`\n\x1b[31m[CRITICAL] Bot Failure (Attempt ${restartAttempts}). Reconnecting in ${delay}ms...\n\x1b[0m`, err);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

process.on('uncaughtException', (err) => {
  console.error('\n[CRITICAL] uncaughtException:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n[CRITICAL] unhandledRejection:', reason);
});

runWithRecovery();
