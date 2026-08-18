import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT,
    pinataGateway:
        import.meta.env.VITE_PINATA_GATEWAY
});


export async function uploadToIPFS(file) {

    if (!file) {
        throw new Error(
            "No document selected."
        );
    }


    console.log(
        "Uploading document to IPFS..."
    );


    const upload =
        await pinata.upload.public.file(file);


    console.log(
        "IPFS upload completed:",
        upload
    );


    return upload.cid;
}