import { ethers } from "ethers";


// ==========================================
// CONTRACT ADDRESS
// ==========================================

export const MINERAL_RWA_ADDRESS =
    import.meta.env.VITE_MINERAL_RWA_ADDRESS;


// ==========================================
// CONTRACT ABI
// ==========================================

export const MINERAL_RWA_ABI = [

    "function getMineral(uint256 tokenId) view returns (tuple(string mineralType, uint256 weight, uint256 purity, string origin, uint256 estimatedValue, string documentHash, uint256 aiScore, bool verified, uint256 createdAt))",

    "function getMineralOwner(uint256 tokenId) view returns (address)",

    "function ownerOf(uint256 tokenId) view returns (address)"

];


// ==========================================
// GET PROVIDER
// ==========================================

function getProvider() {

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
// GET MINERAL
// ==========================================

export async function getMineral(
    tokenId
) {

    if (!MINERAL_RWA_ADDRESS) {

        throw new Error(
            "Mineral RWA contract address is not configured."
        );

    }


    const provider =
        getProvider();


    const contract =
        new ethers.Contract(
            MINERAL_RWA_ADDRESS,
            MINERAL_RWA_ABI,
            provider
        );


    const mineral =
        await contract.getMineral(
            tokenId
        );


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

}


// ==========================================
// GET OWNER
// ==========================================

export async function getMineralOwner(
    tokenId
) {

    const provider =
        getProvider();


    const contract =
        new ethers.Contract(
            MINERAL_RWA_ADDRESS,
            MINERAL_RWA_ABI,
            provider
        );


    return await contract.getMineralOwner(
        tokenId
    );

}