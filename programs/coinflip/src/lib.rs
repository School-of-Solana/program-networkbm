use anchor_lang::prelude::*;

declare_id!("F4rhSFJ4C2xjp2ZukFRyYzb3GzMc4SyHwyxXLfgEMJfJ");

#[program]
pub mod coinflip {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        ctx.accounts.vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn flip_coin(ctx: Context<FlipCoin>, choice: u8, amount: u64) -> Result<()> {
        require!(choice == 0 || choice == 1, CoinflipError::InvalidChoice);
        require!(amount > 0, CoinflipError::InvalidAmount);

        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let result = (ctx.accounts.clock.slot % 2) as u8;

        if result == choice {
            **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount * 2;
            **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += amount * 2;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(init, payer = signer, space = 8 + 1, seeds = [b"vault"], bump)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FlipCoin<'info> {
    #[account(mut, seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[account]
pub struct Vault {
    pub bump: u8,
}

#[error_code]
pub enum CoinflipError {
    #[msg("Invalid choice. Must be 0 or 1.")]
    InvalidChoice,
    #[msg("Invalid bet amount.")]
    InvalidAmount,
}
