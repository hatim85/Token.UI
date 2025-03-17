const anchor = require('@coral-xyz/anchor');
const { PublicKey, Keypair } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const fs = require('fs');

async function createToken(userKeypairPath) {
    // Load user's keypair
    const userKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(userKeypairPath)))
    );
    
    const provider = new anchor.AnchorProvider(
        new anchor.web3.Connection(anchor.web3.clusterApiUrl('devnet')),
        new anchor.Wallet(userKeypair),
        anchor.AnchorProvider.defaultOptions()
    );
    anchor.setProvider(provider);

    // Load the compiled program ID from Anchor
    const idl = JSON.parse(fs.readFileSync('target/idl/token_manager.json', 'utf8'));
    const programId = new PublicKey(idl.metadata.address);
    const program = new anchor.Program(idl, programId, provider);

    // Create a new mint authority using the user’s wallet
    const mintAuthority = userKeypair;
    console.log("Mint Authority PublicKey:", mintAuthority.publicKey.toBase58());

    // Create the SPL Token Mint
    const mint = await createMint(
        provider.connection,
        userKeypair,
        mintAuthority.publicKey,
        null,
        9, // Token decimals
        TOKEN_PROGRAM_ID
    );
    console.log("Mint Created:", mint.toBase58());

    // Create associated token account for the user
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        userKeypair,
        mint,
        userKeypair.publicKey
    );
    console.log("Token Account:", tokenAccount.address.toBase58());

    // Mint initial supply to the user's token account
    const initialSupply = 1_000_000 * 10 ** 9; // 1 million tokens with 9 decimals
    await mintTo(
        provider.connection,
        userKeypair,
        mint,
        tokenAccount.address,
        mintAuthority,
        initialSupply
    );
    console.log("Minted", initialSupply, "tokens to", tokenAccount.address.toBase58());

    return { mint: mint.toBase58(), tokenAccount: tokenAccount.address.toBase58() };
}

module.exports = { createToken };
