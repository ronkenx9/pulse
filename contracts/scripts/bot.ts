import { createPublicClient, createWalletClient, http, parseEther, parseGwei, keccak256, encodeEventTopics, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SDK } from '@somnia-chain/reactivity';
import * as dotenv from 'dotenv';

dotenv.config();

const BOT_PRIVATE_KEY = '0xb4c8261dc907bf7b80901af2fce2b3872e6f2242a0e5b1a51ada207da461b729';
const PULSE_GAME_ADDRESS = '0x38D37af6807D4629F2956e4c4DCe385719Ab25ee';
const RPC_URL = 'https://api.infra.testnet.somnia.network';
const WSS_URL = 'wss://api.infra.testnet.somnia.network/ws';

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

const pulseGameAbi = [
    { "inputs": [{ "name": "opponent", "type": "address" }], "name": "createDuel", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "name": "duelId", "type": "uint256" }], "name": "joinDuel", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "name": "duelId", "type": "uint256" }], "name": "submitReaction", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "anonymous": false, "inputs": [{ "indexed": true, "name": "duelId", "type": "uint256" }, { "indexed": false, "name": "player1", "type": "address" }, { "indexed": false, "name": "player2", "type": "address" }, { "indexed": false, "name": "stake", "type": "uint256" }], "name": "DuelCreated", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "name": "duelId", "type": "uint256" }, { "indexed": false, "name": "timestamp", "type": "uint256" }], "name": "SignalFired", "type": "event" }
];

async function startBot() {
    const account = privateKeyToAccount(BOT_PRIVATE_KEY as `0x${string}`);
    const client = createPublicClient({ chain: somniaTestnet as any, transport: http(RPC_URL) });
    const wallet = createWalletClient({ account, chain: somniaTestnet as any, transport: http(RPC_URL) });

    const sdk = new SDK({ public: client as any, wallet: wallet as any });

    console.log(`Bot started for address: ${account.address}`);

    // 1. Subscribe to DuelCreated where BOT is player2
    await sdk.subscribe({
        eventContractSources: [PULSE_GAME_ADDRESS],
        topicOverrides: [keccak256(Buffer.from('DuelCreated(uint256,address,address,uint256)')) as `0x${string}`],
        onData: async (data: any) => {
            const log = data.result;
            const decoded = decodeEventLog({
                abi: pulseGameAbi,
                data: log.data,
                topics: log.topics,
            }) as any;

            if (decoded.args.player2.toLowerCase() === account.address.toLowerCase()) {
                const duelId = decoded.args.duelId;
                const stake = decoded.args.stake;
                console.log(`[DUEL] Challenged in Duel #${duelId} with stake ${stake}`);

                // Join the duel
                try {
                    console.log(`Joining Duel #${duelId}...`);
                    const hash = await wallet.writeContract({
                        address: PULSE_GAME_ADDRESS as `0x${string}`,
                        abi: pulseGameAbi,
                        functionName: 'joinDuel',
                        args: [duelId],
                        value: stake,
                        gasPrice: parseGwei('50'),
                        chain: somniaTestnet as any,
                    });
                    console.log(`Joined! TX: ${hash}`);
                } catch (e) {
                    console.error(`Failed to join duel: ${e}`);
                }
            }
        },
        onError: (err) => console.error('DuelCreated sub error:', err),
        ethCalls: []
    });

    // 2. Subscribe to SignalFired
    await sdk.subscribe({
        eventContractSources: [PULSE_GAME_ADDRESS],
        topicOverrides: [keccak256(Buffer.from('SignalFired(uint256,uint256)')) as `0x${string}`],
        onData: async (data: any) => {
            const log = data.result;
            const decoded = decodeEventLog({
                abi: pulseGameAbi,
                data: log.data,
                topics: log.topics,
            }) as any;

            const duelId = decoded.args.duelId;
            console.log(`[SIGNAL] Signal fired for Duel #${duelId}`);

            // Wait a delay (competitive bot)
            const delay = 350 + Math.random() * 150; // 350-500ms
            console.log(`Bot reacting in ${Math.round(delay)}ms...`);

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
                    console.log(`Reacted to Duel #${duelId}! TX: ${hash}`);
                } catch (e) {
                    console.error(`Failed to react: ${e}`);
                }
            }, delay);
        },
        onError: (err) => console.error('SignalFired sub error:', err),
        ethCalls: []
    });

    console.log('Bot is listening for challenges...');

    // Keep alive
    setInterval(() => {
        // console.log('Bot heart beating...');
    }, 60000);
}

startBot().catch(console.error);
