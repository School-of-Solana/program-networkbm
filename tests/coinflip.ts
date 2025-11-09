import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Coinflip } from "../target/types/coinflip";
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { expect } from "chai";

describe("coinflip", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Coinflip as Program<Coinflip>;

  let vaultPda: PublicKey;

  before(async () => {
    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );
  });

  describe("initialize_vault", () => {
    it("Happy path: Successfully initializes vault", async () => {
      await program.methods
        .initializeVault()
        .accounts({
          vault: vaultPda,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const vaultAccount = await program.account.vault.fetch(vaultPda);
      expect(vaultAccount.bump).to.be.a("number");
      console.log("Vault PDA:", vaultPda.toBase58());
    });

    it("Unhappy path: Fails on duplicate initialization", async () => {
      try {
        await program.methods
          .initializeVault()
          .accounts({
            vault: vaultPda,
            signer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err.toString()).to.include("already in use");
      }
    });
  });

  describe("flip_coin", () => {
    it("Happy path: Successfully processes a valid coin flip", async () => {
      const betAmount = new anchor.BN(100_000_000);
      const choice = 0;

      const initialBalance = await provider.connection.getBalance(
        provider.wallet.publicKey
      );

      await program.methods
        .flipCoin(choice, betAmount)
        .accounts({
          vault: vaultPda,
          player: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          clock: SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();

      const finalBalance = await provider.connection.getBalance(
        provider.wallet.publicKey
      );

      expect(finalBalance).to.be.lessThan(initialBalance);
    });

    it("Unhappy path: Rejects invalid choice (2)", async () => {
      try {
        await program.methods
          .flipCoin(2, new anchor.BN(1_000_000))
          .accounts({
            vault: vaultPda,
            player: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
            clock: SYSVAR_CLOCK_PUBKEY,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err.toString()).to.include("InvalidChoice");
      }
    });

    it("Unhappy path: Rejects zero bet amount", async () => {
      try {
        await program.methods
          .flipCoin(0, new anchor.BN(0))
          .accounts({
            vault: vaultPda,
            player: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
            clock: SYSVAR_CLOCK_PUBKEY,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err.toString()).to.include("InvalidAmount");
      }
    });

    it("Happy path: Processes flip with choice 1 (Tails)", async () => {
      const betAmount = new anchor.BN(50_000_000);
      const choice = 1;

      await program.methods
        .flipCoin(choice, betAmount)
        .accounts({
          vault: vaultPda,
          player: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          clock: SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();

      const vaultBalance = await provider.connection.getBalance(vaultPda);
      expect(vaultBalance).to.be.greaterThan(0);
    });
  });
});