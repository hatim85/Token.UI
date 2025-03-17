import * as anchor from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import fs from 'fs/promises';
import { PublicKey, Keypair, Connection } from '@solana/web3.js';

async function createToken(userKeypairPath) {
    try {
        // Load user's keypair
        const keypairData = JSON.parse(await fs.readFile(userKeypairPath, 'utf8'));
        const userKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

        // Set up connection and provider
        const connection = new Connection('https://api.testnet.sonic.game', 'confirmed');
        const wallet = new anchor.Wallet(userKeypair);
        const provider = new anchor.AnchorProvider(
            connection,
            wallet,
            { preflightCommitment: 'confirmed' }
        );
        anchor.setProvider(provider);

        // Load program IDL (optional - only if you need the program)
        let program;
        try {
            const idl = JSON.parse(await fs.readFile('target/idl/token_manager.json', 'utf8'));
            const programId = new PublicKey(idl.metadata.address);
            // Use provider instead of programId as second argument
            program = new anchor.Program(idl, provider);
        } catch (e) {
            console.log("Note: Could not load program IDL - proceeding with token creation only");
        }

        // Create mint authority
        const mintAuthority = userKeypair;
        console.log("Mint Authority PublicKey:", mintAuthority.publicKey.toBase58());

        // Create SPL Token Mint
        const mint = await createMint(
            connection,
            userKeypair,              // payer
            mintAuthority.publicKey,  // mintAuthority
            null,                    // freezeAuthority (null = no freeze authority)
            9                       // decimals
        );
        console.log("Mint Created:", mint.toBase58());

        // Create associated token account
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            userKeypair,             // payer
            mint,                   // mint
            userKeypair.publicKey   // owner
        );
        console.log("Token Account:", tokenAccount.address.toBase58());

        // Mint initial supply
        const initialSupply = BigInt(1_000_000) * BigInt(10 ** 9); // 1 million tokens with 9 decimals
        await mintTo(
            connection,
            userKeypair,             // payer
            mint,                   // mint
            tokenAccount.address,   // destination
            mintAuthority,          // authority
            initialSupply           // amount (in smallest units)
        );
        console.log("Minted", initialSupply.toString(), "tokens to", tokenAccount.address.toBase58());

        return { 
            mint: mint.toBase58(), 
            tokenAccount: tokenAccount.address.toBase58() 
        };
    } catch (error) {
        console.error("Error creating token:", error);
        throw error;
    }
}

export { createToken };