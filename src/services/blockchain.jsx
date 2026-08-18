import { ethers } from "ethers";


// ==========================================
// CONTRACT
// ==========================================

export const MINERAL_RWA_ADDRESS =
    import.meta.env.VITE_MINERAL_RWA_ADDRESS;


export const MINERAL_RWA_ABI = [

    // ======================================
    // WRITE FUNCTIONS
    // ======================================

    "function createMineral(string mineralType, uint256 weight, uint256 purity, string origin, uint256 estimatedValue, string documentHash) returns (uint256)",

    "function verifyMineral(uint256 tokenId, uint256 aiScore)",


    // ======================================
    // READ FUNCTIONS
    // ======================================

    "function getMineral(uint256 tokenId) view returns (tuple(string mineralType, uint256 weight, uint256 purity, string origin, uint256 estimatedValue, string documentHash, uint256 aiScore, bool verified, uint256 createdAt))",

    "function getMineralOwner(uint256 tokenId) view returns (address)",

    "function owner() view returns (address)",


    // ======================================
    // EVENTS
    // ======================================

    "event MineralCreated(uint256 indexed tokenId, address indexed owner, string mineralType, uint256 weight)",

    "event MineralVerified(uint256 indexed tokenId, uint256 aiScore)"

];


// ==========================================
// CHECK CONTRACT ADDRESS
// ==========================================

if (!MINERAL_RWA_ADDRESS) {

    console.warn(
        "VITE_MINERAL_RWA_ADDRESS não está configurado."
    );

}


// ==========================================
// PROVIDER
// ==========================================

async function getProvider() {

    if (!window.ethereum) {

        throw new Error(
            "MetaMask is not installed."
        );

    }


    return new ethers.BrowserProvider(
        window.ethereum
    );

}


// ==========================================
// SIGNER
// ==========================================

async function getSigner() {

    const provider =
        await getProvider();


    // Solicita acesso à carteira

    await provider.send(
        "eth_requestAccounts",
        []
    );


    const signer =
        await provider.getSigner();


    const address =
        await signer.getAddress();


    console.log(
        "Signer conectado:",
        address
    );


    return signer;

}


// ==========================================
// CONTRACT WITH SIGNER
// ==========================================

async function getContract() {

    if (!MINERAL_RWA_ADDRESS) {

        throw new Error(
            "Mineral RWA contract address is not configured."
        );

    }


    const signer =
        await getSigner();


    return new ethers.Contract(

        MINERAL_RWA_ADDRESS,

        MINERAL_RWA_ABI,

        signer

    );

}


// ==========================================
// CONTRACT WITH PROVIDER
// ==========================================
// Used only for read operations.
// ==========================================

async function getReadContract() {

    if (!MINERAL_RWA_ADDRESS) {

        throw new Error(
            "Mineral RWA contract address is not configured."
        );

    }


    const provider =
        await getProvider();


    return new ethers.Contract(

        MINERAL_RWA_ADDRESS,

        MINERAL_RWA_ABI,

        provider

    );

}


// ==========================================
// GET CONNECTED WALLET
// ==========================================

export async function getConnectedWallet() {

    const signer =
        await getSigner();


    const address =
        await signer.getAddress();


    console.log(
        "Connected wallet:",
        address
    );


    return address;

}


// ==========================================
// GET CONTRACT OWNER
// ==========================================

export async function getContractOwner() {

    const contract =
        await getReadContract();


    const owner =
        await contract.owner();


    console.log(
        "MineralRWA contract owner:",
        owner
    );


    return owner;

}


// ==========================================
// CHECK IF CONNECTED WALLET IS OWNER
// ==========================================

export async function isContractOwner() {

    const connectedWallet =
        await getConnectedWallet();


    const contractOwner =
        await getContractOwner();


    const isOwner =
        connectedWallet.toLowerCase() ===
        contractOwner.toLowerCase();


    console.log(
        "Connected wallet:",
        connectedWallet
    );


    console.log(
        "Contract owner:",
        contractOwner
    );


    console.log(
        "Is contract owner:",
        isOwner
    );


    return isOwner;

}


// ==========================================
// GET MINERAL OWNER
// ==========================================

export async function getMineralOwner(
    tokenId
) {

    const contract =
        await getReadContract();


    const owner =
        await contract.getMineralOwner(
            tokenId
        );


    console.log(
        `Owner of token #${tokenId}:`,
        owner
    );


    return owner;

}


// ==========================================
// GET MINERAL
// ==========================================

export async function getMineral(
    tokenId
) {

    const contract =
        await getReadContract();


    const mineral =
        await contract.getMineral(
            tokenId
        );


    console.log(
        `Mineral #${tokenId}:`,
        mineral
    );


    return mineral;

}


// ==========================================
// CREATE MINERAL
// ==========================================

export async function createMineral(
    mineral
) {

    const contract =
        await getContract();


    // ======================================
    // DATA
    // ======================================

    const mineralType =
        mineral.mineralType ||
        mineral.mineral ||
        "";


    const weightTons =
        Number(
            mineral.weight || 0
        );


    const purityPercent =
        Number(
            mineral.purity || 0
        );


    const estimatedValue =
        Number(
            mineral.estimatedValue ||
            mineral.value ||
            0
        );


    // ======================================
    // VALIDATION
    // ======================================

    if (!mineralType) {

        throw new Error(
            "Mineral type is required."
        );

    }


    if (weightTons <= 0) {

        throw new Error(
            "Weight must be greater than zero."
        );

    }


    if (
        purityPercent < 0 ||
        purityPercent > 100
    ) {

        throw new Error(
            "Purity must be between 0 and 100."
        );

    }


    // ======================================
    // CONTRACT SCALE
    // ======================================
    //
    // Example:
    //
    // 500.500 tons
    //       ↓
    // 500500 kg
    //
    // 67.50%
    //       ↓
    // 6750
    //
    // ======================================

    const weight =
        Math.round(
            weightTons * 1000
        );


    const purity =
        Math.round(
            purityPercent * 100
        );


    console.log(
        "=================================="
    );


    console.log(
        "Creating mineral..."
    );


    console.log(
        "Mineral type:",
        mineralType
    );


    console.log(
        "Weight:",
        weight
    );


    console.log(
        "Purity:",
        purity
    );


    console.log(
        "Origin:",
        mineral.origin || ""
    );


    console.log(
        "Estimated value:",
        estimatedValue
    );


    console.log(
        "Document hash:",
        mineral.documentHash || ""
    );


    console.log(
        "=================================="
    );


    // ======================================
    // CREATE TRANSACTION
    // ======================================

    const tx =
        await contract.createMineral(

            mineralType,

            weight,

            purity,

            mineral.origin || "",

            estimatedValue,

            mineral.documentHash || ""

        );


    console.log(
        "Mineral transaction:",
        tx.hash
    );


    // ======================================
    // WAIT CONFIRMATION
    // ======================================

    const receipt =
        await tx.wait();


    console.log(
        "Transaction confirmed:",
        receipt.hash
    );


    // ======================================
    // FIND MineralCreated EVENT
    // ======================================

    let tokenId = null;


    for (
        const log of receipt.logs
    ) {

        try {

            const parsed =
                contract.interface.parseLog(
                    log
                );


            if (
                parsed &&
                parsed.name ===
                "MineralCreated"
            ) {

                tokenId =
                    parsed.args.tokenId.toString();


                console.log(
                    "MineralCreated event found."
                );


                console.log(
                    "Token ID:",
                    tokenId
                );


                break;

            }

        } catch {

            // Ignore logs
            // from other contracts.

        }

    }


    // ======================================
    // VALIDATE TOKEN ID
    // ======================================

    if (!tokenId) {

        throw new Error(
            "Mineral was created, but token ID could not be detected."
        );

    }


    return {

        hash:
            receipt.hash,

        tokenId,

        receipt

    };

}


// ==========================================
// VERIFY MINERAL
// ==========================================

export async function verifyMineral(
    tokenId,
    aiScore
) {

    console.log(
        "=================================="
    );


    console.log(
        "STEP 2 - VERIFY MINERAL"
    );


    console.log(
        "=================================="
    );


    // ======================================
    // GET CONTRACT
    // ======================================

    const contract =
        await getContract();


    // ======================================
    // NORMALIZE VALUES
    // ======================================

    const token =
        Number(tokenId);


    const score =
        Number(aiScore);


    console.log(
        "Token ID:",
        token
    );


    console.log(
        "AI Score:",
        score
    );


    // ======================================
    // VALIDATE TOKEN ID
    // ======================================

    if (
        !Number.isInteger(token) ||
        token <= 0
    ) {

        throw new Error(
            "Invalid token ID."
        );

    }


    // ======================================
    // VALIDATE AI SCORE
    // ======================================

    if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > 100
    ) {

        throw new Error(
            "AI score must be between 0 and 100."
        );

    }


    // ======================================
    // GET SIGNER
    // ======================================

    const signer =
        contract.runner;


    if (!signer) {

        throw new Error(
            "No wallet signer available."
        );

    }


    // ======================================
    // GET CONNECTED WALLET
    // ======================================

    const connectedWallet =
        await signer.getAddress();


    console.log(
        "Connected wallet:",
        connectedWallet
    );


    // ======================================
    // GET CONTRACT OWNER
    // ======================================

    const contractOwner =
        await contract.owner();


    console.log(
        "Contract owner:",
        contractOwner
    );


    // ======================================
    // OWNER VALIDATION
    // ======================================

    const connected =
        connectedWallet.toLowerCase();


    const owner =
        contractOwner.toLowerCase();


    console.log(
        "Wallet comparison:"
    );


    console.log(
        "Connected:",
        connected
    );


    console.log(
        "Owner:",
        owner
    );


    if (
        connected !== owner
    ) {

        throw new Error(

            "The connected wallet is not the owner of the MineralRWA contract.\n\n" +

            `Connected wallet:\n${connectedWallet}\n\n` +

            `Contract owner:\n${contractOwner}\n\n` +

            "Connect the wallet that deployed the contract or transfer contract ownership."

        );

    }


    console.log(
        "Owner validation: PASSED"
    );


    // ======================================
    // CHECK MINERAL
    // ======================================

    try {

        const mineral =
            await contract.getMineral(
                token
            );


        console.log(
            "Mineral found:",
            mineral
        );


    } catch (error) {

        console.error(
            "Could not read mineral:",
            error
        );


        throw new Error(

            `Mineral #${token} does not exist or could not be read.`

        );

    }


    // ======================================
    // ESTIMATE GAS
    // ======================================

    try {

        console.log(
            "Estimating verification gas..."
        );


        const gas =
            await contract.verifyMineral.estimateGas(

                token,

                score

            );


        console.log(
            "Estimated gas:",
            gas.toString()
        );


    } catch (error) {

        console.error(
            "Verification gas estimation failed:",
            error
        );


        console.error(
            "Error code:",
            error?.code
        );


        console.error(
            "Error data:",
            error?.data
        );


        console.error(
            "Error reason:",
            error?.reason
        );


        throw error;

    }


    // ======================================
    // SEND TRANSACTION
    // ======================================

    console.log(
        "Sending verification transaction..."
    );


    const tx =
        await contract.verifyMineral(

            token,

            score

        );


    console.log(
        "Verification transaction:",
        tx.hash
    );


    // ======================================
    // WAIT CONFIRMATION
    // ======================================

    const receipt =
        await tx.wait();


    console.log(
        "Verification confirmed:",
        receipt.hash
    );


    console.log(
        "=================================="
    );


    console.log(
        "MINERAL VERIFIED SUCCESSFULLY"
    );


    console.log(
        "=================================="
    );


    return {

        hash:
            receipt.hash,

        receipt

    };

}