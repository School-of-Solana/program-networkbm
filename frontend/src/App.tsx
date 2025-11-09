import { useMemo, useState } from "react";
import { Buffer } from "buffer";
window.Buffer = Buffer;
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";
import idl from "./idl.json";

const programID = new PublicKey("F4rhSFJ4C2xjp2ZukFRyYzb3GzMc4SyHwyxXLfgEMJfJ");
const network = clusterApiUrl("devnet");

function CoinFlipApp() {
  const wallet = useWallet();
  const [result, setResult] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("0.1");
  const [loading, setLoading] = useState(false);

  const connection = useMemo(() => new Connection(network, "confirmed"), []);
  const provider = useMemo(
    () => new AnchorProvider(connection, wallet as any, { preflightCommitment: "processed" }),
    [connection, wallet]
  );

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;
    return new Program(idl as Idl, provider);
  }, [provider, wallet.publicKey]);

  const handleFlip = async (choice: number) => {
    if (!program) {
      alert("Program not loaded yet");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        programID
      );

      const lamports = parseFloat(amount) * 1_000_000_000;

      await (program.methods as any)
        .flipCoin(choice, new BN(lamports))
        .accounts({
          vault: vaultPda,
          player: wallet.publicKey!,
          systemProgram: SystemProgram.programId,
          clock: SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();

      setResult("Transaction sent. Check wallet history.");
    } catch (err: any) {
      console.error(err);
      setResult("Flip failed or was rejected.");
    } finally {
      setLoading(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-3xl mb-6">Solana Coin Flip</h1>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Solana Coin Flip</h1>

      <input
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-2 text-black rounded mb-3"
        placeholder="Bet amount (SOL)"
      />

      <div className="flex gap-6">
        <button
          onClick={() => handleFlip(0)}
          disabled={loading}
          className="bg-green-600 px-6 py-2 rounded hover:bg-green-700"
        >
          Heads
        </button>
        <button
          onClick={() => handleFlip(1)}
          disabled={loading}
          className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
        >
          Tails
        </button>
      </div>

      {loading && <p className="mt-4">Processing...</p>}
      {result && <p className="mt-4 text-lg">{result}</p>}
      <WalletMultiButton className="mt-6" />
    </div>
  );
}

export default function App() {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );
  return (
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <CoinFlipApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}