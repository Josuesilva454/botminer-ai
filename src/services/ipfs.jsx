import { PinataSDK } from "pinata";


// ==========================================================
// PINATA CONFIGURATION
// ==========================================================

const PINATA_JWT =
    import.meta.env.VITE_PINATA_JWT;

const PINATA_GATEWAY =
    import.meta.env.VITE_PINATA_GATEWAY;


// ==========================================================
// VALIDATION
// ==========================================================

if (!PINATA_JWT) {

    console.warn(
        "VITE_PINATA_JWT não está configurado."
    );

}


if (!PINATA_GATEWAY) {

    console.warn(
        "VITE_PINATA_GATEWAY não está configurado."
    );

}


// ==========================================================
// PINATA CLIENT
// ==========================================================

const pinata =
    new PinataSDK({

        pinataJwt:
            PINATA_JWT,

        pinataGateway:
            PINATA_GATEWAY

    });


// ==========================================================
// UPLOAD FILE TO IPFS
// ==========================================================

export async function uploadToIPFS(
    file
) {

    // ======================================================
    // VALIDATE FILE
    // ======================================================

    if (!file) {

        throw new Error(
            "No document selected."
        );

    }


    if (
        !PINATA_JWT
    ) {

        throw new Error(
            "Pinata JWT is not configured."
        );

    }


    // ======================================================
    // UPLOAD
    // ======================================================

    try {

        const upload =
            await pinata.upload.public.file(
                file
            );


        // ==================================================
        // VALIDATE CID
        // ==================================================

        if (
            !upload ||
            !upload.cid
        ) {

            throw new Error(
                "Pinata did not return an IPFS CID."
            );

        }


        return upload.cid;

    } catch (error) {

        console.error(
            "IPFS upload failed:",
            error
        );


        if (
            error?.message
        ) {

            throw new Error(
                `IPFS upload failed: ${error.message}`
            );

        }


        throw new Error(
            "IPFS upload failed."
        );

    }

}


// ==========================================================
// GET IPFS URL
// ==========================================================

export function getIPFSUrl(
    cid
) {

    if (!cid) {

        return "";

    }


    if (
        PINATA_GATEWAY
    ) {

        const gateway =
            PINATA_GATEWAY
                .replace(
                    /^https?:\/\//,
                    ""
                )
                .replace(
                    /\/$/,
                    ""
                );


        return `https://${gateway}/ipfs/${cid}`;

    }


    return `https://ipfs.io/ipfs/${cid}`;

}