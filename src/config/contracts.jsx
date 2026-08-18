
export const MINERAL_RWA_ADDRESS =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const MINERAL_RWA_ABI = [
    "function createMineral(string mineralType,uint256 weight,uint256 purity,string origin,uint256 estimatedValue,string documentHash) external returns (uint256)",

    "function getMineral(uint256 tokenId) external view returns (tuple(string mineralType,uint256 weight,uint256 purity,string origin,uint256 estimatedValue,string documentHash,uint256 aiScore,bool verified,uint256 createdAt))",

    "function ownerOf(uint256 tokenId) external view returns (address)",

    "function verifyMineral(uint256 tokenId,uint256 aiScore) external",

    "event MineralCreated(uint256 indexed tokenId,address indexed owner,string mineralType,uint256 weight)",

    "event MineralVerified(uint256 indexed tokenId,uint256 aiScore)"
];

