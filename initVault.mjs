import fs from "fs";
import path from "path";
import { Connection, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const keypairPath = path.join(process.env.HOME, ".config/solana/id.json");
const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

const wallet = new Wallet(keypair);
const provider = new AnchorProvider(connection, wallet, {
  preflightCommitment: "processed",
});

const idl = JSON.parse(
  fs.readFileSync(path.resolve("target/idl/coinflip.json"), "utf8")
);

const programID = new PublicKey("F4rhSFJ4C2xjp2ZukFRyYzb3GzMc4SyHwyxXLfgEMJfJ");

const program = new Program(idl, provider);

async function main() {
  try {
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      programID
    );

    const tx = await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        signer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Vault initialized:", vaultPda.toBase58());
    console.log("Transaction signature:", tx);
  } catch (err) {
    console.error("Error initializing vault:", err);
  }
}

main();