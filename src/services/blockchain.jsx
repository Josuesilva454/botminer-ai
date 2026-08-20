import { ethers } from "ethers";

// ==========================================================
// BOT CHAIN TESTNET
// ==========================================================

export const BOT_CHAIN_ID = 968;
export const BOT_CHAIN_ID_HEX = "0x3c8";
export const BOT_CHAIN_NAME = "BOT Chain Testnet";
export const BOT_RPC_URL =
    import.meta.env.VITE_RPC_URL || "https://rpc.bohr.life";
export const BOT_EXPLORER = "https://scan.bohr.life/";
export const BOT_NATIVE_SYMBOL = "BOT";

// ==========================================================
// CONTRACT
// ==========================================================

export const MINERAL_RWA_ADDRESS =
    "0x68871D10B120388Ddbac919E9D8f9C86c2781c6d";

// ==========================================================
// ABI
// ==========================================================

export const MINERAL_RWA_ABI = [
    // CREATE
    "function createMineral(string mineralType, uint256 weight, uint256 purity, string origin, uint256 estimatedValue, string documentHash, string uri) returns (uint256)",

    // VERIFY
    "function verifyMineral(uint256 tokenId, uint256 aiScore)",

    // READ
    "function getMineral(uint256 tokenId) view returns (tuple(string mineralType, uint256 weight, uint256 purity, string origin, uint256 estimatedValue, string documentHash, uint256 aiScore, bool verified, uint256 createdAt))",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function owner() view returns (address)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",

    // EVENTS
    "event MineralCreated(address indexed user, uint256 indexed tokenId)",
    "event MineralVerified(uint256 indexed tokenId, uint256 aiScore)"
];

// ==========================================================
// VALIDATE CONTRACT ADDRESS
// ==========================================================

if (!MINERAL_RWA_ADDRESS) {
    console.warn("VITE_MINERAL_RWA_ADDRESS is not configured.");
}

// ==========================================================
// DIRECT RPC PROVIDER
// ==========================================================

export const directProvider = new ethers.JsonRpcProvider(
    BOT_RPC_URL,
    BOT_CHAIN_ID
);

// ==========================================================
// CHECK CONTRACT ADDRESS
// ==========================================================

export function checkContractAddress() {
    if (!MINERAL_RWA_ADDRESS) {
        throw new Error("VITE_MINERAL_RWA_ADDRESS is not configured.");
    }

    if (!ethers.isAddress(MINERAL_RWA_ADDRESS)) {
        throw new Error("VITE_MINERAL_RWA_ADDRESS is not a valid Ethereum address.");
    }
}

// ==========================================================
// SWITCH METAMASK TO BOT CHAIN
// ==========================================================

export async function switchToBOTChain() {
    if (!window.ethereum) {
        throw new Error("MetaMask extension not found.");
    }

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BOT_CHAIN_ID_HEX }]
        });
    } catch (error) {
        if (error.code === 4902 || error.code === -32603) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: BOT_CHAIN_ID_HEX,
                        chainName: BOT_CHAIN_NAME,
                        nativeCurrency: {
                            name: BOT_NATIVE_SYMBOL,
                            symbol: BOT_NATIVE_SYMBOL,
                            decimals: 18
                        },
                        rpcUrls: [BOT_RPC_URL],
                        blockExplorerUrls: [BOT_EXPLORER]
                    }
                ]
            });
        } else {
            throw error;
        }
    }

    const chainId = await window.ethereum.request({
        method: "eth_chainId"
    });

    if (chainId.toLowerCase() !== BOT_CHAIN_ID_HEX.toLowerCase()) {
        throw new Error("MetaMask is not connected to BOT Chain Testnet.");
    }
}

// ==========================================================
// METAMASK PROVIDER
// ==========================================================

export async function getProvider() {
    if (!window.ethereum) {
        throw new Error("MetaMask extension not found.");
    }

    return new ethers.BrowserProvider(window.ethereum);
}

// ==========================================================
// SIGNER
// ==========================================================

export async function getSigner() {
    const provider = await getProvider();
    await switchToBOTChain();

    await provider.send("eth_requestAccounts", []);

    return await provider.getSigner();
}

// ==========================================================
// WRITE CONTRACT
// ==========================================================

export async function getContract() {
    checkContractAddress();
    const signer = await getSigner();
    const network = await signer.provider.getNetwork();

    if (network.chainId !== BigInt(BOT_CHAIN_ID)) {
        throw new Error(
            `Incorrect network. Current chain: ${network.chainId}. Expected: ${BOT_CHAIN_ID}.`
        );
    }

    return new ethers.Contract(MINERAL_RWA_ADDRESS, MINERAL_RWA_ABI, signer);
}

// ==========================================================
// READ CONTRACT
// ==========================================================

export async function getReadContract() {
    checkContractAddress();

    return new ethers.Contract(
        MINERAL_RWA_ADDRESS,
        MINERAL_RWA_ABI,
        directProvider
    );
}

// ==========================================================
// CONNECTED WALLET
// ==========================================================

export async function getConnectedWallet() {
    try {
        if (!window.ethereum) return "";

        const provider = await getProvider();
        const accounts = await provider.send("eth_accounts", []);

        if (!accounts || accounts.length === 0) return "";

        return accounts[0];
    } catch {
        return "";
    }
}

// ==========================================================
// NETWORK
// ==========================================================

export async function getCurrentNetwork() {
    if (!window.ethereum) {
        throw new Error("MetaMask extension not found.");
    }

    const provider = await getProvider();
    return await provider.getNetwork();
}

// ==========================================================
// CONTRACT OWNER
// ==========================================================

export async function getContractOwner() {
    const contract = await getReadContract();
    return await contract.owner();
}

// ==========================================================
// IS CONTRACT OWNER
// ==========================================================

export async function isContractOwner() {
    const wallet = await getConnectedWallet();

    if (!wallet) return false;

    const owner = await getContractOwner();

    return wallet.toLowerCase() === owner.toLowerCase();
}

// ==========================================================
// MINERAL OWNER
// ==========================================================

export async function getMineralOwner(tokenId) {
    const contract = await getReadContract();

    try {
        return await contract.ownerOf(tokenId);
    } catch (error) {
        throw new Error(getBlockchainError(error));
    }
}

// ==========================================================
// TOKEN URI
// ==========================================================

export async function getMineralURI(tokenId) {
    const contract = await getReadContract();
    return await contract.tokenURI(tokenId);
}

// ==========================================================
// GET MINERAL
// ==========================================================

export async function getMineral(tokenId) {
    const contract = await getReadContract();
    return await contract.getMineral(tokenId);
}

// ==========================================================
// CREATE MINERAL
// ==========================================================

export async function createMineral(mineral) {
    const contract = await getContract();

    const mineralType = mineral.mineralType || mineral.mineral || "";
    const weightTons = Number(mineral.weight || 0);
    const purityPercent = Number(mineral.purity || 0);
    const estimatedValue = Number(mineral.estimatedValue || mineral.value || 0);
    const origin = mineral.origin || "";
    const documentHash = mineral.documentHash || "";
    const uri = mineral.uri || "";

    if (!mineralType) {
        throw new Error("Mineral type is required.");
    }

    if (!Number.isFinite(weightTons) || weightTons <= 0) {
        throw new Error("Weight must be greater than zero.");
    }

    if (!Number.isFinite(purityPercent) || purityPercent < 0 || purityPercent > 100) {
        throw new Error("Purity must be between 0 and 100.");
    }

    if (!Number.isFinite(estimatedValue) || estimatedValue < 0) {
        throw new Error("Estimated value is invalid.");
    }

    const weight = BigInt(Math.round(weightTons * 1000));
    const purity = BigInt(Math.round(purityPercent * 100));
    const value = BigInt(Math.round(estimatedValue));

    let tx;

    try {
        tx = await contract.createMineral(
            mineralType,
            weight,
            purity,
            origin,
            value,
            documentHash,
            uri
        );
    } catch (error) {
        console.error("createMineral transaction failed:", error);
        throw new Error(getBlockchainError(error));
    }

    let receipt;

    try {
        receipt = await tx.wait();
    } catch (error) {
        console.error("Transaction confirmation failed:", error);
        throw new Error(getBlockchainError(error));
    }

    let tokenId = null;

    for (const log of receipt.logs) {
        try {
            const parsed = contract.interface.parseLog(log);

            if (parsed && parsed.name === "MineralCreated") {
                tokenId = parsed.args.tokenId.toString();
                break;
            }
        } catch {
            // Unrelated event
        }
    }

    if (!tokenId) {
        throw new Error("NFT created, but Token ID was not found in transaction logs.");
    }

    return {
        hash: receipt.hash,
        transactionHash: receipt.hash,
        tokenId,
        receipt
    };
}

// ==========================================================
// VERIFY MINERAL
// ==========================================================

export async function verifyMineral(tokenId, aiScore) {
    const contract = await getContract();
    const readContract = await getReadContract();

    const token = BigInt(tokenId);
    const score = BigInt(Math.round(Number(aiScore)));

    if (token <= 0n) {
        throw new Error("Invalid token ID.");
    }

    if (score < 0n || score > 100n) {
        throw new Error("AI score must be between 0 and 100.");
    }

    const signer = contract.runner;

    if (!signer) {
        throw new Error("No wallet signer available.");
    }

    const connectedWallet = await signer.getAddress();
    const contractOwner = await readContract.owner();

    if (connectedWallet.toLowerCase() !== contractOwner.toLowerCase()) {
        throw new Error(
            "The connected wallet is not the owner of the MineralRWA contract.\n\n" +
            `Connected Wallet:\n${connectedWallet}\n\n` +
            `Contract Owner:\n${contractOwner}`
        );
    }

    try {
        await readContract.getMineral(token);
    } catch (error) {
        throw new Error(getBlockchainError(error));
    }

    let tx;

    try {
        tx = await contract.verifyMineral(token, score);
    } catch (error) {
        console.error("verifyMineral transaction failed:", error);
        throw new Error(getBlockchainError(error));
    }

    const receipt = await tx.wait();

    return {
        hash: receipt.hash,
        transactionHash: receipt.hash,
        receipt
    };
}

// ==========================================================
// CONTRACT METADATA & BALANCES
// ==========================================================

export async function getContractName() {
    const contract = await getReadContract();
    return await contract.name();
}

export async function getContractSymbol() {
    const contract = await getReadContract();
    return await contract.symbol();
}

export async function getNFTBalance(address) {
    const contract = await getReadContract();
    return await contract.balanceOf(address);
}

// ==========================================================
// BLOCKCHAIN ERROR FORMATTER
// ==========================================================

export function getBlockchainError(error) {
    if (!error) return "Unknown blockchain error.";

    if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        return "Transaction rejected in MetaMask.";
    }

    if (error.code === "CALL_EXCEPTION") {
        return "Contract execution reverted. Verify that the contract address and Token ID belong to BOT Chain Testnet.";
    }

    if (error.shortMessage) return error.shortMessage;
    if (error.reason) return error.reason;
    if (error.info?.error?.message) return error.info.error.message;
    if (error.error?.message) return error.error.message;
    if (error.data?.message) return error.data.message;
    if (error.message) return error.message;

    return "Blockchain transaction failed.";
}