import { ethers } from "ethers";

// ==========================================================
// BOT CHAIN CONFIG (MAINNET)
// ==========================================================

export const BOT_CHAIN_ID = 677;
export const BOT_CHAIN_ID_HEX = "0x2a5";
export const BOT_CHAIN_NAME = "BOT Chain Mainnet";
export const BOT_RPC_URL = import.meta.env.VITE_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai";
export const BOT_EXPLORER = "https://scan.botchain.ai";
export const BOT_NATIVE_SYMBOL = "BOT";

export const MINERAL_RWA_ADDRESS = import.meta.env.VITE_MINERAL_RWA_ADDRESS;

if (!MINERAL_RWA_ADDRESS) {
  console.warn("Aviso: VITE_MINERAL_RWA_ADDRESS não foi definida no arquivo .env");
}

// ==========================================================
// CONTRACT ABI COMPLETO (MineralRWA.sol)
// ==========================================================

export const MINERAL_RWA_ABI = [
    // CREATE & MINT
    "function createMineral(string mineralType, uint256 weight, uint256 purity, string origin, uint256 estimatedValue, string documentHash, string uri) returns (uint256)",
    
    // VERIFY
    "function verifyMineral(uint256 tokenId, uint256 aiScore)",

    // COMPRA / MARKETPLACE
    "function buyMineral(uint256 tokenId) payable",
    "function purchaseAsset(uint256 tokenId) payable",

    // EMERGENCY / ADMIN
    "function pause()",
    "function unpause()",
    "function withdrawStuckBalance()",

    // READ STANDARD & METADATA
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function owner() view returns (address)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function nextTokenId() view returns (uint256)",
    "function mineralExists(uint256 tokenId) view returns (bool)",
    "function getMineral(uint256 tokenId) view returns (tuple(string mineralType, uint256 weight, uint256 purity, string origin, uint256 estimatedValue, string documentHash, uint256 aiScore, bool verified, uint256 createdAt))",

    // EVENTS
    "event MineralCreated(address indexed user, uint256 indexed tokenId, string mineralType, uint256 weight)",
    "event MineralVerified(uint256 indexed tokenId, uint256 aiScore, address indexed verifiedBy)",
    "event MineralPurchased(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)"
];

// ==========================================================
// PROVIDERS, SIGNERS & CHECKS
// ==========================================================

export const directProvider = new ethers.JsonRpcProvider(BOT_RPC_URL, BOT_CHAIN_ID);

export function checkContractAddress() {
    if (!MINERAL_RWA_ADDRESS || !ethers.isAddress(MINERAL_RWA_ADDRESS)) {
        throw new Error("Endereço do contrato inválido ou não configurado.");
    }
}

export async function switchToBOTChain() {
    if (!window.ethereum) throw new Error("MetaMask não encontrada.");

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BOT_CHAIN_ID_HEX }]
        });
    } catch (error) {
        if (error.code === 4902 || error.code === -32603) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: BOT_CHAIN_ID_HEX,
                    chainName: BOT_CHAIN_NAME,
                    nativeCurrency: { name: BOT_NATIVE_SYMBOL, symbol: BOT_NATIVE_SYMBOL, decimals: 18 },
                    rpcUrls: [BOT_RPC_URL],
                    blockExplorerUrls: [BOT_EXPLORER]
                }]
            });
        } else {
            throw error;
        }
    }
}

export async function getProvider() {
    if (!window.ethereum) throw new Error("MetaMask não encontrada.");
    return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
    const provider = await getProvider();
    await switchToBOTChain();
    await provider.send("eth_requestAccounts", []);
    return await provider.getSigner();
}

export async function getContract() {
    checkContractAddress();
    const signer = await getSigner();
    return new ethers.Contract(MINERAL_RWA_ADDRESS, MINERAL_RWA_ABI, signer);
}

export async function getReadContract() {
    checkContractAddress();
    return new ethers.Contract(MINERAL_RWA_ADDRESS, MINERAL_RWA_ABI, directProvider);
}

// ==========================================================
// FUNÇÕES DE LEITURA (Dashboard & Navigation)
// ==========================================================

export async function getConnectedWallet() {
    try {
        if (!window.ethereum) return "";
        const provider = await getProvider();
        const accounts = await provider.send("eth_accounts", []);
        return accounts && accounts.length > 0 ? accounts[0] : "";
    } catch {
        return "";
    }
}

export async function getContractOwner() {
    try {
        const contract = await getReadContract();
        return await contract.owner();
    } catch (error) {
        console.error("Erro ao buscar proprietário do contrato:", error);
        return "";
    }
}

export async function getMineralOwner(tokenId) {
    try {
        const contract = await getReadContract();
        return await contract.ownerOf(tokenId);
    } catch (error) {
        console.error(`Erro ao buscar dono do token #${tokenId}:`, error);
        return "";
    }
}

export async function getNFTBalance(address) {
    if (!address || !ethers.isAddress(address)) return 0n;

    try {
        const contract = await getReadContract();
        return await contract.balanceOf(address);
    } catch (error) {
        console.error("Erro ao buscar saldo de NFTs:", error);
        return 0n;
    }
}

export async function getMineral(tokenId) {
    const contract = await getReadContract();
    return await contract.getMineral(tokenId);
}

export async function getContractName() {
    const contract = await getReadContract();
    return await contract.name();
}

export async function getContractSymbol() {
    const contract = await getReadContract();
    return await contract.symbol();
}

// ==========================================================
// FUNÇÕES DE ESCRITA (CreateAsset, Verify & Marketplace)
// ==========================================================

export async function createMineral(mineral) {
    const contract = await getContract();

    // 1. Tratamento prévio dos inputs
    const mineralType = (mineral.mineralType || mineral.mineral || "").trim();
    const origin = (mineral.origin || "").trim();
    let documentHash = (mineral.documentHash || "").trim();
    let uri = (mineral.uri || "").trim();

    // Fallbacks
    if (!uri) {
        uri = `https://metadata.botchain.ai/minerals/${encodeURIComponent(mineralType.toLowerCase() || "default")}.json`;
    }

    if (!documentHash) {
        documentHash = `DOC-${Date.now()}`;
    }

    // 2. Validações prévias
    if (mineralType.length === 0 || mineralType.length > 100) {
        throw new Error("Tipo de mineral inválido (deve ter entre 1 e 100 caracteres)");
    }

    const weightTons = Number(mineral.weight || 0);
    if (weightTons <= 0) {
        throw new Error("Peso deve ser maior que zero");
    }

    const purityPercent = Number(mineral.purity || 0);
    if (purityPercent <= 0 || purityPercent > 100) {
        throw new Error("Pureza inválida (deve ser entre 0.1% e 100%)");
    }

    if (origin.length === 0 || origin.length > 200) {
        throw new Error("Origem inválida (deve ter entre 1 e 200 caracteres)");
    }

    const rawValue = mineral.estimatedValue || mineral.value || "0";
    const valueInWei = ethers.parseEther(String(rawValue));
    if (valueInWei <= 0n) {
        throw new Error("Valor estimado inválido");
    }

    if (documentHash.length === 0 || documentHash.length > 100) {
        throw new Error("Hash de documento inválido (deve ter entre 1 e 100 caracteres)");
    }

    if (uri.length === 0 || uri.length > 500) {
        throw new Error("URI inválida (deve ter entre 1 e 500 caracteres)");
    }

    // 3. Conversões de escala
    const weight = BigInt(Math.round(weightTons * 1000));
    const purity = BigInt(Math.round(purityPercent * 100));

    // 4. Execução da transação
    let tx;
    try {
        tx = await contract.createMineral(
            mineralType,
            weight,
            purity,
            origin,
            valueInWei,
            documentHash,
            uri
        );
    } catch (error) {
        console.error("Erro na chamada createMineral:", error);
        throw new Error(getBlockchainError(error));
    }

    const receipt = await tx.wait();
    let tokenId = null;

    for (const log of receipt.logs) {
        try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === "MineralCreated") {
                tokenId = parsed.args.tokenId.toString();
                break;
            }
        } catch {}
    }

    return { hash: receipt.hash, tokenId, receipt };
}

export async function verifyMineral(tokenId, aiScore) {
    const contract = await getContract();
    const token = BigInt(tokenId);
    const score = BigInt(Math.round(Number(aiScore)));

    if (token <= 0n) throw new Error("ID do Token inválido.");
    if (score < 0n || score > 100n) throw new Error("AI Score deve ser entre 0 e 100.");

    let tx;
    try {
        tx = await contract.verifyMineral(token, score);
    } catch (error) {
        console.error("Erro na transação verifyMineral:", error);
        throw new Error(getBlockchainError(error));
    }

    const receipt = await tx.wait();
    return { hash: receipt.hash, receipt };
}

export async function buyMineral(tokenId, priceInEtherOptional = null) {
    const contract = await getContract();
    const token = BigInt(tokenId);

    // 1. Busca as informações atualizadas na BOT Chain Mainnet
    const mineralData = await contract.getMineral(token);
    let valueInWei = mineralData.estimatedValue;

    if (priceInEtherOptional !== null && priceInEtherOptional !== undefined) {
        const userWei = ethers.parseEther(String(priceInEtherOptional));
        if (userWei >= valueInWei) {
            valueInWei = userWei;
        }
    }

    const txOptions = { 
        value: valueInWei,
        gasLimit: 350000n 
    };

    let tx;
    try {
        tx = await contract.buyMineral(token, txOptions);
    } catch (err) {
        console.warn("Falha no método padrão buyMineral. Tentando chamada fallback...", err);
        try {
            tx = await contract.purchaseAsset(token, txOptions);
        } catch (fallbackErr) {
            console.error("Erro na transação buyMineral:", fallbackErr);
            throw new Error(getBlockchainError(fallbackErr));
        }
    }

    const receipt = await tx.wait();
    return { hash: receipt.hash, receipt };
}

// ==========================================================
// ERROR HANDLER
// ==========================================================

export function getBlockchainError(error) {
    if (!error) return "Erro desconhecido na blockchain.";
    if (error.code === "ACTION_REJECTED" || error.code === 4001) return "Transação rejeitada na MetaMask.";
    if (error.code === "CALL_EXCEPTION") {
        if (error.reason) return `Execução revertida: ${error.reason}`;
        return "Execução revertida pelo contrato inteligente (verifique se o mineral foi verificado ou se os fundos são suficientes).";
    }
    return error.shortMessage || error.reason || error.message || "Falha na transação.";
}