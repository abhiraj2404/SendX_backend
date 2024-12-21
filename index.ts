import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { Ollama } from "@langchain/ollama";
import nacl from "tweetnacl";

import {
  Chain,
  isSolanaWalletClient,
  SolanaReadRequest,
  SolanaTransaction,
  SolanaWalletClient,
} from "@goat-sdk/core";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

import { getOnChainTools } from "@goat-sdk/adapter-langchain";
import { sendSOL } from "@goat-sdk/core";

require("dotenv").config();

const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY as string;

// Create a Solana wallet
const fundingWallet = Keypair.fromSecretKey(bs58.decode(SOLANA_PRIVATE_KEY));

// Create a Solana connection to Devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

//creating solanawalletclient
class SolanaWalletClientImpl implements SolanaWalletClient {
  private wallet: Keypair;
  private connection: Connection;

  constructor(wallet: Keypair, connection: Connection) {
    this.wallet = wallet;
    this.connection = connection;
  }

  // Implement `getAddress` from WalletClient
  getAddress(): string {
    return this.wallet.publicKey.toBase58();
  }

  // Implement `getChain` from WalletClient (Returning Solana chain information)
  getChain(): Chain {
    return { type: "solana" }; // You can add more chain info here if needed
  }

  // Implement `signMessage` from WalletClient (signing messages)
  async signMessage(message: string) {
    // Convert message to Uint8Array
    const messageBytes = Buffer.from(message);

    // Sign the message using nacl
    const signature = nacl.sign.detached(messageBytes, this.wallet.secretKey);

    return {
      signature: Buffer.from(signature).toString("base64"),
    };
  }

  // Implement `balanceOf` from WalletClient (fetching balance)
  async balanceOf(address: string) {
    const balance = await this.connection.getBalance(new PublicKey(address));
    return {
      decimals: 9, // Solana's native token has 9 decimals
      symbol: "SOL",
      name: "Solana",
      value: BigInt(balance),
    };
  }

  // Implement `sendTransaction` from SolanaWalletClient
  async sendTransaction(transaction: SolanaTransaction) {
    const tx = new Transaction().add(...transaction.instructions);

    // Send transaction using the wallet's signature
    const signature = await sendAndConfirmTransaction(this.connection, tx, [
      this.wallet,
    ]);

    return { hash: signature };
  }

  // Implement `read` from SolanaWalletClient (e.g., fetching account data)
  async read(request: SolanaReadRequest) {
    const accountInfo = await this.connection.getAccountInfo(
      new PublicKey(request.accountAddress)
    );
    return { value: accountInfo?.data || null };
  }
}

const solanaClient = new SolanaWalletClientImpl(fundingWallet, connection);

const llm = new Ollama({
  model: "llama3.2", // Default value
  baseUrl: "http://127.0.0.1:11434", // Default value
});

(async () => {
  console.log(
    `🔄 Funding Wallet Public Key: ${fundingWallet.publicKey.toBase58()}`
  );

  // Transfer some SOL to another address
  const recipientPublicKey = new PublicKey(
    "HMfq3c1ovN1L3rqDsTawhf44RSVnMLnRib28jAqqcaMb"
  );
  const transferAmount = LAMPORTS_PER_SOL / 10; // 0.01 SOL

  // LangChain Integration
  console.log("🔄 Setting up LangChain tools...");
  const tools = await getOnChainTools({
    wallet: solanaClient, // Pass the Keypair directly
    plugins: [sendSOL()],
  });

  const prompt = await pull<ChatPromptTemplate>(
    "hwchase17/structured-chat-agent"
  );

  const agent = await createStructuredChatAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    // Enable this to see the agent's thought process
    // verbose: true,
  });

  const balanceResponse = await agentExecutor.invoke({
    input: "Get my balance in SOL",
  });

  console.log("Response:", balanceResponse);

  const transferPrompt = `Transfer ${
    transferAmount / LAMPORTS_PER_SOL / 10
  } SOL to ${recipientPublicKey.toBase58()} and return the transaction hash as output or tell details of error if any`;
  console.log(`🤖 Attempting to: ${transferPrompt}`);
  const transferResponse = await agentExecutor.invoke({
    input: transferPrompt,
  });

  console.log("Transfer Response:", transferResponse);
})();
