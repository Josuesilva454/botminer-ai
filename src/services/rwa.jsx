import { ethers } from "ethers";

// ==========================================================
// CONTRACT
// ==========================================================

export const MINERAL_RWA_ADDRESS =
    import.meta.env.VITE_MINERAL_RWA_ADDRESS;

export const RPC_URL =
    import.meta.env.VITE_RPC_URL ||
    "https://rpc.bohr.life";


// ==========================================================
// ABI
// ==========================================================

export const MINERAL_RWA_ABI = [

    // ======================================================
    // ERC721
    // ======================================================

    "function ownerOf(uint256 tokenId) view returns (address)",

    "function tokenURI(uint256 tokenId) view returns (string)",

    "function balanceOf(address owner) view returns (uint256)",

    // ======================================================
    // MINERAL
    // ======================================================

    "function getMineral(uint256 tokenId) view returns (tuple(string mineralType, uint256 weight, uint256 purity, string origin, uint256 estimatedValue, string documentHash, uint256 aiScore, bool verified, uint256 createdAt))",

    // ======================================================
    // CONTRACT
    // ======================================================

    "function owner() view returns (address)",

    "function name() view returns (string)",

    "function symbol() view returns (string)"
];


// ==========================================================
// VALIDATE CONTRACT
// ==========================================================

function validateContract() {

    if (!MINERAL_RWA_ADDRESS) {

        throw new Error(
            "VITE_MINERAL_RWA_ADDRESS não está configurado."
        );

    }

    if (
        !ethers.isAddress(
            MINERAL_RWA_ADDRESS
        )
    ) {

        throw new Error(
            `Endereço MineralRWA inválido: ${MINERAL_RWA_ADDRESS}`
        );

    }

}


// ==========================================================
// DIRECT RPC PROVIDER
// ==========================================================
//
// IMPORTANTE:
//
// As leituras NÃO dependem da rede selecionada
// na MetaMask.
//
// Elas usam diretamente:
//
// https://rpc.bohr.life
//
// ==========================================================

export const directProvider =
    new ethers.JsonRpcProvider(
        RPC_URL
    );


// ==========================================================
// METAMASK PROVIDER
// ==========================================================

async function getWalletProvider() {

    if (!window.ethereum) {

        throw new Error(
            "MetaMask não encontrada."
        );

    }

    return new ethers.BrowserProvider(
        window.ethereum
    );

}


// ==========================================================
// TOKEN ID
// ==========================================================

function normalizeTokenId(tokenId) {

    if (
        tokenId === undefined ||
        tokenId === null ||
        tokenId === ""
    ) {

        throw new Error(
            "Token ID não informado."
        );

    }

    try {

        const id =
            BigInt(tokenId);

        if (id <= 0n) {

            throw new Error(
                "Token ID deve ser maior que zero."
            );

        }

        return id;

    } catch {

        throw new Error(
            `Token ID inválido: ${tokenId}`
        );

    }

}


// ==========================================================
// READ CONTRACT
// ==========================================================

function getReadContract() {

    validateContract();

    return new ethers.Contract(
        MINERAL_RWA_ADDRESS,
        MINERAL_RWA_ABI,
        directProvider
    );

}


// ==========================================================
// GET MINERAL
// ==========================================================

export async function getMineral(tokenId) {

    const id =
        normalizeTokenId(tokenId);

    const contract =
        getReadContract();


    try {

        const mineral =
            await contract.getMineral(id);


        return {

            mineralType:
                mineral.mineralType,

            weight:
                mineral.weight.toString(),

            purity:
                mineral.purity.toString(),

            origin:
                mineral.origin,

            estimatedValue:
                mineral.estimatedValue.toString(),

            documentHash:
                mineral.documentHash,

            aiScore:
                mineral.aiScore.toString(),

            verified:
                mineral.verified,

            createdAt:
                mineral.createdAt.toString()

        };

    } catch (error) {

        console.error(
            "getMineral failed:",
            error
        );

        throw new Error(
            getBlockchainError(
                error,
                `Não foi possível carregar o Mineral #${id.toString()}.`
            )
        );

    }

}


// ==========================================================
// GET MINERAL OWNER
// ==========================================================
//
// O contrato NÃO possui:
//
// getMineralOwner()
//
// O ERC721 possui:
//
// ownerOf()
//
// ==========================================================

export async function getMineralOwner(tokenId) {

    const id =
        normalizeTokenId(tokenId);

    const contract =
        getReadContract();


    try {

        const owner =
            await contract.ownerOf(id);

        return owner;

    } catch (error) {

        console.error(
            "ownerOf failed:",
            error
        );

        throw new Error(
            getBlockchainError(
                error,
                `Não foi possível encontrar o proprietário do NFT #${id.toString()}.`
            )
        );

    }

}


// ==========================================================
// GET TOKEN URI
// ==========================================================

export async function getMineralURI(tokenId) {

    const id =
        normalizeTokenId(tokenId);

    const contract =
        getReadContract();


    try {

        return await contract.tokenURI(id);

    } catch (error) {

        throw new Error(
            getBlockchainError(
                error,
                `Não foi possível carregar a URI do NFT #${id.toString()}.`
            )
        );

    }

}


// ==========================================================
// GET CONTRACT OWNER
// ==========================================================

export async function getContractOwner() {

    const contract =
        getReadContract();

    try {

        return await contract.owner();

    } catch (error) {

        throw new Error(
            getBlockchainError(
                error,
                "Não foi possível consultar o owner do contrato."
            )
        );

    }

}


// ==========================================================
// GET CONTRACT NAME
// ==========================================================

export async function getContractName() {

    const contract =
        getReadContract();

    return await contract.name();

}


// ==========================================================
// GET CONTRACT SYMBOL
// ==========================================================

export async function getContractSymbol() {

    const contract =
        getReadContract();

    return await contract.symbol();

}


// ==========================================================
// GET NFT BALANCE
// ==========================================================

export async function getNFTBalance(address) {

    validateContract();

    if (!ethers.isAddress(address)) {

        throw new Error(
            "Endereço de carteira inválido."
        );

    }

    const contract =
        getReadContract();

    return await contract.balanceOf(
        address
    );

}


// ==========================================================
// GET CONNECTED WALLET
// ==========================================================

export async function getConnectedWallet() {

    try {

        const provider =
            await getWalletProvider();

        const accounts =
            await provider.send(
                "eth_accounts",
                []
            );

        if (
            !accounts ||
            accounts.length === 0
        ) {

            return "";

        }

        return accounts[0];

    } catch {

        return "";

    }

}


// ==========================================================
// GET CURRENT CHAIN
// ==========================================================

export async function getCurrentChain() {

    const provider =
        await getWalletProvider();

    const network =
        await provider.getNetwork();

    return {

        chainId:
            network.chainId.toString(),

        name:
            network.name

    };

}


// ==========================================================
// CHECK BOT CHAIN
// ==========================================================

export async function isBOTChain() {

    try {

        const network =
            await directProvider.getNetwork();

        return (
            network.chainId === 968n
        );

    } catch {

        return false;

    }

}


// ==========================================================
// ERROR
// ==========================================================

function getBlockchainError(
    error,
    fallback
) {

    if (!error) {

        return fallback;

    }


    if (
        error.code ===
        "BAD_DATA"
    ) {

        return (
            "O contrato não retornou dados válidos. " +
            "Verifique se VITE_MINERAL_RWA_ADDRESS " +
            "é o contrato MineralRWA correto da BOT Chain."
        );

    }


    if (
        error.code ===
        "CALL_EXCEPTION"
    ) {

        if (
            error.data === "0x" ||
            error.data === undefined
        ) {

            return (
                "A chamada ao contrato foi revertida sem dados. " +
                "Isso normalmente significa que o endereço do contrato " +
                "não corresponde ao MineralRWA implantado nessa rede, " +
                "ou o Token ID não existe nesse contrato."
            );

        }

        if (
            error.reason
        ) {

            return error.reason;

        }

    }


    if (
        error.shortMessage
    ) {

        return error.shortMessage;

    }


    if (
        error.reason
    ) {

        return error.reason;

    }


    if (
        error.info?.error?.message
    ) {

        return error.info.error.message;

    }


    if (
        error.error?.message
    ) {

        return error.error.message;

    }


    if (
        error.message
    ) {

        return error.message;

    }


    return fallback;

}