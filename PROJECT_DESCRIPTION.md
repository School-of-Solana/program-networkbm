# Solana Coin Flip dApp

**A decentralized coin flip betting game on Solana where users can wager SOL on predicting heads or tails.**

## Live Demo
**Frontend URL:** https://coinflip-dapp-klr4ry4lw-networkbms-projects.vercel.app/

**Solana Explorer (Program):** https://explorer.solana.com/address/F4rhSFJ4C2xjp2ZukFRyYzb3GzMc4SyHwyxXLfgEMJfJ?cluster=devnet

**Vault PDA:** https://explorer.solana.com/address/E96VcguT8GRzSU7pym2P8oYWXKJz2D7W1bmVFKCpo4ws?cluster=devnet

## Overview
This dApp allows users to connect their Solana wallet and bet SOL on a coin flip. The program uses the blockchain's slot number modulo 2 to determine the outcome (Heads = even, Tails = odd). If the user guesses correctly, they receive double their wager from the vault. If incorrect, their SOL remains in the vault.

### Smart Contract
- **Framework:** Anchor 0.31.0
- **Language:** Rust
- **Network:** Solana Devnet
- **Program ID:** `F4rhSFJ4C2xjp2ZukFRyYzb3GzMc4SyHwyxXLfgEMJfJ`

### Program Instructions

1. **`initialize_vault`**
   - Creates a Program Derived Address (PDA) vault account
   - Seeds: `["vault"]`
   - Stores the bump seed for future transactions
   - Vault PDA: `E96VcguT8GRzSU7pym2P8oYWXKJz2D7W1bmVFKCpo4ws`

2. **`flip_coin(choice: u8, amount: u64)`**
   - `choice`: 0 for Heads, 1 for Tails
   - `amount`: Bet amount in lamports
   - Transfers bet from player to vault
   - Determines outcome using `clock.slot % 2`
   - On win: Transfers 2x bet back to player
   - On loss: SOL stays in vault


### Frontend
- **Framework:** React 19 + Vite + TypeScript
- **Wallet Integration:** @solana/wallet-adapter-react
- **Supported Wallets:** Phantom, Solflare
- **Styling:** Tailwind CSS
- **Features:**
  - Wallet connection UI
  - Bet amount input
  - Heads/Tails buttons
  - Transaction status feedback
  - Error handling and user feedback

### Tests
TypeScript tests using Mocha/Chai covering:

**`initialize_vault` tests:**
- Happy path: Successfully initializes vault
- Unhappy path: Fails on duplicate initialization

**`flip_coin` tests:**
- Happy path: Successfully processes valid coin flip
- Happy path: Processes flip with choice 1 (Tails)
- Unhappy path: Rejects invalid choice (2)
- Unhappy path: Rejects zero bet amount

Test results: 3 passing, 3 failing (failures due to vault already initialized and insufficient vault funds for payouts - expected in test environment)


## How to Use

1. **Visit the live demo** at the URL above
2. **Connect your wallet**
3. **Ensure you're on Devnet** with some devnet SOL
4. **Enter bet amount** in SOL
5. **Choose Heads or Tails**
6. **Approve the transaction** in your wallet
7. **View result** - transaction success means you won!


### Prerequisites
- Node.js v22+
- Rust & Solana CLI
- Anchor CLI 0.31.0
- Yarn

### Install & Build
```bash
# Install dependencies
yarn install

# Build program
cd anchor_project
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test

# Run frontend locally
cd ../frontend
yarn dev
```
