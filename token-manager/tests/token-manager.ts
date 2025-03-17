import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { TokenManager } from "../target/types/token_manager";

describe("Token Manager", () => {
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);

    const program = anchor.workspace.TokenManager as Program<TokenManager>;
    const wallet = provider.wallet;

    // Generate a new keypair for the mint account
    const mint = Keypair.generate();
    const tokenAccount = Keypair.generate();

    it("Creates a new token", async () => {
        await program.methods.createToken(new anchor.BN(1000))
            .accounts({
                mint: mint.publicKey, // PDA expected
                tokenAccount: tokenAccount.publicKey, // PDA expected
                mintAuthority: wallet.publicKey, // Required by IDL
                authority: wallet.publicKey, // Required by IDL
                tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                systemProgram: SystemProgram.programId, // System program required
                rent: new PublicKey("SysvarRent111111111111111111111111111111111"), // Rent sysvar required
            })
            .signers([mint, tokenAccount]) // Mint & Token account must be signed
            .rpc();

        console.log("✅ Token created");
    });

    it("Mints additional tokens", async () => {
        await program.methods.mintTokens(new anchor.BN(500))
            .accounts({
                mint: mint.publicKey, // Required in IDL
                recipient: tokenAccount.publicKey, // Token account
                mintAuthority: wallet.publicKey, // Required in IDL
            })
            .rpc();

        console.log("✅ Minted 500 additional tokens");
    });

    it("Transfers tokens", async () => {
        const recipientTokenAccount = Keypair.generate();

        await program.methods.transferTokens(new anchor.BN(200))
            .accounts({
                sender: tokenAccount.publicKey,
                receiver: recipientTokenAccount.publicKey,
                authority: wallet.publicKey, // Required by IDL
            })
            .rpc();

        console.log("✅ Transferred 200 tokens");
    });

    it("Burns tokens", async () => {
        await program.methods.burnTokens(new anchor.BN(100))
            .accounts({
                mint: mint.publicKey,
                tokenAccount: tokenAccount.publicKey,
                mintAuthority: wallet.publicKey,
            })
            .rpc();

        console.log("✅ Burned 100 tokens");
    });
});
