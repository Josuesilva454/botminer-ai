import { PinataSDK } from "pinata";

// ==========================================================
// PINATA CONFIGURATION & SANITIZATION
// ==========================================================

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
let rawGateway = import.meta.env.VITE_PINATA_GATEWAY || "gateway.pinata.cloud";

// Clean gateway: strips http(s):// and trailing slashes to prevent Invalid URL errors
const CLEAN_GATEWAY = rawGateway.replace(/^https?:\/\//, "").replace(/\/$/, "");

if (!PINATA_JWT) {
  console.warn("VITE_PINATA_JWT is not configured in your .env file.");
}

// ==========================================================
// PINATA CLIENT INSTANCE
// ==========================================================

export const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: CLEAN_GATEWAY,
});

// ==========================================================
// UPLOAD FILE TO IPFS
// ==========================================================

export async function uploadToIPFS(file) {
  if (!file) {
    throw new Error("No document selected.");
  }

  if (!PINATA_JWT) {
    throw new Error("Pinata JWT is not configured.");
  }

  try {
    const upload = await pinata.upload.file(file);

    if (!upload || !upload.cid) {
      throw new Error("Pinata did not return an IPFS CID.");
    }

    return upload.cid;
  } catch (error) {
    console.error("IPFS upload failed:", error);
    throw new Error(`IPFS upload failed: ${error?.message || "Unknown error"}`);
  }
}

// ==========================================================
// SAFE IPFS URL GENERATOR
// ==========================================================

export function getIPFSUrl(cid) {
  if (!cid || typeof cid !== "string" || cid.trim() === "") {
    return "";
  }

  const cleanCid = cid.trim();
  return `https://${CLEAN_GATEWAY}/ipfs/${cleanCid}`;
}