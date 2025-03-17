use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Transfer, Burn};

declare_id!("3xYxr5FqjM6y54PZrovqEkiYiHznS3WJWB8Lm9Bn4SGG");

#[program]
pub mod token_manager {
    use super::*;

    // Create a new SPL token
    pub fn create_token(
        ctx: Context<CreateToken>,
        initial_supply: u64,
    ) -> Result<()> {
        // Mint the initial supply to the creator's token account
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            initial_supply,
        )?;

        Ok(())
    }

    // Mint additional tokens to a wallet
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.recipient.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    // Transfer tokens between accounts
    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.sender.to_account_info(),
                    to: ctx.accounts.receiver.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    // Burn tokens from an account
    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }
}

// ---------------------- ACCOUNT STRUCTS ----------------------

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = mint_authority,
        seeds = [b"mint", authority.key().as_ref()],
        bump
    )]
    pub mint: Account<'info, Mint>,  // Wrapped in Account

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = authority,
        seeds = [b"token_account", authority.key().as_ref()],
        bump
    )]
    pub token_account: Account<'info, TokenAccount>,  // Wrapped in Account

    /// CHECK: This is the mint authority (not stored on-chain)
    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,

    /// CHECK: This is the mint authority (not stored on-chain)
    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub sender: Account<'info, TokenAccount>,

    #[account(mut)]
    pub receiver: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the mint authority (not stored on-chain)
    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
