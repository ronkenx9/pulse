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

// Reaction delay ranges per difficulty (ms). Set BOT_DIFFICULTY in .env.
// ROOKIE:  600–900ms  (most humans ~250ms, so rookie is beatable by anyone)
// SOLDIER: 300–500ms  (competitive — slightly above average human)
// LEGEND:  100–200ms  (sub-200ms — extremely hard to beat)
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
    public:  { http: [RPC_URL], webSocket: [WSS_URL] },
  },
};

// ── ABI (minimal — only what the bot calls/reads) ────────────────────────────

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
      { indexed: true,  name: 'duelId',  type: 'uint256' },
      { indexed: false, name: 'player1', type: 'address' },
      { indexed: false, name: 'player2', type: 'address' },
      { indexed: false, name: 'stake',   type: 'uint256' },
    ],
    name: 'DuelCreated', type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: 'duelId',    type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'SignalFired', type: 'event',
  },
] as const;

// ── State ─────────────────────────────────────────────────────────────────────

// Only react to SignalFired events for duels we actually joined.
// Without this guard the bot would fire submitReaction() on every duel on the
// contract — including human-vs-human matches — wasting gas and causing reverts.
const activeDuelIds = new Set<bigint>();

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

  console.log(`🤖 Bot address  : ${account.address}`);
  console.log(`⚔️  Difficulty   : ${BOT_DIFFICULTY} (reaction ${DELAY_MIN}–${DELAY_MAX} ms)`);
  console.log(`🎮 Game contract : ${PULSE_GAME_ADDRESS}\n`);

  // ── Subscription 1: DuelCreated ──────────────────────────────────────────
  // When a player creates a duel with the bot's address as player2, join + arm.
  await sdk.subscribe({
    eventContractSources: [PULSE_GAME_ADDRESS],
    topicOverrides: [
      keccak256(Buffer.from('DuelCreated(uint256,address,address,uint256)')) as `0x${string}`,
    ],
    onData: async (data: any) => {
      const log = data.result;
      try {
        const decoded = decodeEventLog({
          abi: pulseGameAbi,
          data: log.data,
          topics: log.topics,
        }) as any;

        // Ignore duels where we are not player2
        if (decoded.args.player2.toLowerCase() !== account.address.toLowerCase()) return;

        const duelId: bigint = decoded.args.duelId;
        const stake: bigint  = decoded.args.stake;
        console.log(`[DUEL #${duelId}] Challenged  — stake: ${stake} wei`);

        // ── Step 1: join ────────────────────────────────────────────────────
        console.log(`[DUEL #${duelId}] Joining...`);
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
        console.log(`[DUEL #${duelId}] Joined ✓`);

        // ── Step 2: arm signal ──────────────────────────────────────────────
        // Both players must arm before the signal can fire.
        // Skipping this leaves the duel permanently stuck in JOINED state.
        console.log(`[DUEL #${duelId}] Arming signal...`);
        const armHash = await wallet.writeContract({
          address: PULSE_GAME_ADDRESS as `0x${string}`,
          abi: pulseGameAbi,
          functionName: 'armSignal',
          args: [duelId],
          gasPrice: parseGwei('50'),
          chain: somniaTestnet as any,
        });
        await client.waitForTransactionReceipt({ hash: armHash });
        console.log(`[DUEL #${duelId}] Armed ✓ — waiting for opponent to arm + signal...`);

        activeDuelIds.add(duelId);
      } catch (e) {
        console.error(`[DUEL] Error handling DuelCreated:`, e);
      }
    },
    onError: (err) => console.error('DuelCreated subscription error:', err),
    ethCalls: [],
  });

  // ── Subscription 2: SignalFired ──────────────────────────────────────────
  // React with a difficulty-calibrated delay — but ONLY for our own duels.
  await sdk.subscribe({
    eventContractSources: [PULSE_GAME_ADDRESS],
    topicOverrides: [
      keccak256(Buffer.from('SignalFired(uint256,uint256)')) as `0x${string}`,
    ],
    onData: async (data: any) => {
      const log = data.result;
      try {
        const decoded = decodeEventLog({
          abi: pulseGameAbi,
          data: log.data,
          topics: log.topics,
        }) as any;

        const duelId: bigint = decoded.args.duelId;

        // Not our duel — skip without spending gas
        if (!activeDuelIds.has(duelId)) {
          console.log(`[SIGNAL] Duel #${duelId} — not my duel, ignoring`);
          return;
        }

        const delay = Math.round(DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN));
        console.log(`[SIGNAL] Duel #${duelId} — reacting in ${delay} ms (${BOT_DIFFICULTY})`);

        // Remove immediately so a duplicate event doesn't cause a double-react
        activeDuelIds.delete(duelId);

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
            console.log(`[DUEL #${duelId}] Reacted ✓  TX: ${hash}`);
          } catch (e) {
            console.error(`[DUEL #${duelId}] submitReaction failed:`, e);
          }
        }, delay);
      } catch (e) {
        console.error(`[SIGNAL] Error handling SignalFired:`, e);
      }
    },
    onError: (err) => console.error('SignalFired subscription error:', err),
    ethCalls: [],
  });

  console.log('Bot is live — listening for challenges...\n');

  // Keep the process alive
  setInterval(() => { }, 60_000);
}

startBot().catch(console.error);
