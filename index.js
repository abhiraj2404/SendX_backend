"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var agents_1 = require("langchain/agents");
var hub_1 = require("langchain/hub");
var ollama_1 = require("@langchain/ollama");
var tweetnacl_1 = require("tweetnacl");
var web3_js_1 = require("@solana/web3.js");
var bs58_1 = require("bs58");
var adapter_langchain_1 = require("@goat-sdk/adapter-langchain");
var core_1 = require("@goat-sdk/core");
require("dotenv").config();
var SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;
// Create a Solana wallet
var fundingWallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(SOLANA_PRIVATE_KEY));
// Create a Solana connection to Devnet
var connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
//creating solanawalletclient
var SolanaWalletClientImpl = /** @class */ (function () {
    function SolanaWalletClientImpl(wallet, connection) {
        this.wallet = wallet;
        this.connection = connection;
    }
    // Implement `getAddress` from WalletClient
    SolanaWalletClientImpl.prototype.getAddress = function () {
        return this.wallet.publicKey.toBase58();
    };
    // Implement `getChain` from WalletClient (Returning Solana chain information)
    SolanaWalletClientImpl.prototype.getChain = function () {
        return { type: "solana" }; // You can add more chain info here if needed
    };
    // Implement `signMessage` from WalletClient (signing messages)
    SolanaWalletClientImpl.prototype.signMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var messageBytes, signature;
            return __generator(this, function (_a) {
                messageBytes = Buffer.from(message);
                signature = tweetnacl_1.default.sign.detached(messageBytes, this.wallet.secretKey);
                return [2 /*return*/, {
                        signature: Buffer.from(signature).toString("base64"),
                    }];
            });
        });
    };
    // Implement `balanceOf` from WalletClient (fetching balance)
    SolanaWalletClientImpl.prototype.balanceOf = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var balance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection.getBalance(new web3_js_1.PublicKey(address))];
                    case 1:
                        balance = _a.sent();
                        return [2 /*return*/, {
                                decimals: 9, // Solana's native token has 9 decimals
                                symbol: "SOL",
                                name: "Solana",
                                value: BigInt(balance),
                            }];
                }
            });
        });
    };
    // Implement `sendTransaction` from SolanaWalletClient
    SolanaWalletClientImpl.prototype.sendTransaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, signature;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tx = (_a = new web3_js_1.Transaction()).add.apply(_a, transaction.instructions);
                        return [4 /*yield*/, (0, web3_js_1.sendAndConfirmTransaction)(this.connection, tx, [
                                this.wallet,
                            ])];
                    case 1:
                        signature = _b.sent();
                        return [2 /*return*/, { hash: signature }];
                }
            });
        });
    };
    // Implement `read` from SolanaWalletClient (e.g., fetching account data)
    SolanaWalletClientImpl.prototype.read = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var accountInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection.getAccountInfo(new web3_js_1.PublicKey(request.accountAddress))];
                    case 1:
                        accountInfo = _a.sent();
                        return [2 /*return*/, { value: (accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.data) || null }];
                }
            });
        });
    };
    return SolanaWalletClientImpl;
}());
var solanaClient = new SolanaWalletClientImpl(fundingWallet, connection);
var llm = new ollama_1.Ollama({
    model: "llama3.2", // Default value
    baseUrl: "http://127.0.0.1:11434", // Default value
});
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var recipientPublicKey, transferAmount, tools, prompt, agent, agentExecutor, balanceResponse, transferPrompt, transferResponse;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("\uD83D\uDD04 Funding Wallet Public Key: ".concat(fundingWallet.publicKey.toBase58()));
                recipientPublicKey = new web3_js_1.PublicKey("HMfq3c1ovN1L3rqDsTawhf44RSVnMLnRib28jAqqcaMb");
                transferAmount = web3_js_1.LAMPORTS_PER_SOL / 10;
                // LangChain Integration
                console.log("🔄 Setting up LangChain tools...");
                return [4 /*yield*/, (0, adapter_langchain_1.getOnChainTools)({
                        wallet: solanaClient, // Pass the Keypair directly
                        plugins: [(0, core_1.sendSOL)()],
                    })];
            case 1:
                tools = _a.sent();
                return [4 /*yield*/, (0, hub_1.pull)("hwchase17/structured-chat-agent")];
            case 2:
                prompt = _a.sent();
                return [4 /*yield*/, (0, agents_1.createStructuredChatAgent)({
                        llm: llm,
                        tools: tools,
                        prompt: prompt,
                    })];
            case 3:
                agent = _a.sent();
                agentExecutor = new agents_1.AgentExecutor({
                    agent: agent,
                    tools: tools,
                    // Enable this to see the agent's thought process
                    // verbose: true,
                });
                return [4 /*yield*/, agentExecutor.invoke({
                        input: "Get my balance in SOL",
                    })];
            case 4:
                balanceResponse = _a.sent();
                console.log("Response:", balanceResponse);
                transferPrompt = "Transfer ".concat(transferAmount / web3_js_1.LAMPORTS_PER_SOL / 10, " SOL to ").concat(recipientPublicKey.toBase58(), " and return the transaction hash as output or tell details of error if any");
                console.log("\uD83E\uDD16 Attempting to: ".concat(transferPrompt));
                return [4 /*yield*/, agentExecutor.invoke({
                        input: transferPrompt,
                    })];
            case 5:
                transferResponse = _a.sent();
                console.log("Transfer Response:", transferResponse);
                return [2 /*return*/];
        }
    });
}); })();