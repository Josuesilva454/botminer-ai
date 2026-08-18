import { useEffect, useState } from "react";

import "./CreateAsset.css";

import {
    createMineral,
    verifyMineral,
    getMineralOwner,
    getContractOwner,
    getConnectedWallet
} from "../services/blockchain";

import {
    analyzeMineral
} from "../services/ai";

import {
    uploadToIPFS
} from "../services/ipfs";


function CreateAsset({ setPage, wallet }) {

    // ==========================================
    // FORM
    // ==========================================

    const [form, setForm] = useState({
        mineralType: "",
        weight: "",
        purity: "",
        origin: "",
        estimatedValue: "",
        documentHash: ""
    });


    // ==========================================
    // FILE
    // ==========================================

    const [documentFile, setDocumentFile] = useState(null);


    // ==========================================
    // UI STATE
    // ==========================================

    const [loading, setLoading] = useState(false);

    const [currentStep, setCurrentStep] = useState(0);

    const [status, setStatus] = useState("");

    const [statusType, setStatusType] = useState("info");


    // ==========================================
    // BLOCKCHAIN
    // ==========================================

    const [connectedWallet, setConnectedWallet] =
        useState(wallet || "");

    const [transactionHash, setTransactionHash] =
        useState("");

    const [verificationHash, setVerificationHash] =
        useState("");

    const [tokenId, setTokenId] =
        useState("");


    // ==========================================
    // AI
    // ==========================================

    const [aiResult, setAiResult] =
        useState(null);


    // ==========================================
    // IPFS
    // ==========================================

    const [ipfsCid, setIpfsCid] =
        useState("");


    // ==========================================
    // CHECK CONNECTED WALLET
    // ==========================================

    useEffect(() => {

        setConnectedWallet(
            wallet || ""
        );

    }, [wallet]);


    // ==========================================
    // STATUS MESSAGE
    // ==========================================

    function showStatus(
        message,
        type = "info",
        step = 0
    ) {

        setStatus(message);

        setStatusType(type);

        setCurrentStep(step);
    }


    // ==========================================
    // ERROR MESSAGE
    // ==========================================

    function getErrorMessage(error) {

        if (!error) {
            return "Unknown error.";
        }


        if (
            error.code === "ACTION_REJECTED" ||
            error.code === 4001
        ) {

            return "Transaction rejected in your wallet.";
        }


        if (error.shortMessage) {
            return error.shortMessage;
        }


        if (error.reason) {
            return error.reason;
        }


        if (error.revert?.args) {

            return (
                `Smart contract reverted: ` +
                `${error.revert.args.join(", ")}`
            );
        }


        if (
            error.data &&
            typeof error.data === "string" &&
            error.data !== "0x"
        ) {

            return (
                `Smart contract error.\n\n` +
                `Error data: ${error.data}`
            );
        }


        if (error.info?.error?.message) {
            return error.info.error.message;
        }


        if (error.error?.message) {
            return error.error.message;
        }


        if (error.message) {
            return error.message;
        }


        return "An unexpected blockchain error occurred.";
    }


    // ==========================================
    // HANDLE INPUT
    // ==========================================

    function handleChange(event) {

        const {
            name,
            value
        } = event.target;


        setForm((previousForm) => ({
            ...previousForm,
            [name]: value
        }));
    }


    // ==========================================
    // HANDLE FILE
    // ==========================================

    function handleFileChange(event) {

        const file =
            event.target.files?.[0];


        if (!file) {

            setDocumentFile(null);

            return;
        }


        setDocumentFile(file);
    }


    // ==========================================
    // NORMALIZE TOKEN ID
    // ==========================================

    function normalizeTokenId(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return "";
        }


        if (
            typeof value === "bigint"
        ) {

            return value.toString();
        }


        if (
            typeof value === "object"
        ) {

            if (
                value.tokenId !== undefined
            ) {

                return normalizeTokenId(
                    value.tokenId
                );
            }


            if (
                value.toString
            ) {

                return value.toString();
            }
        }


        return String(value);
    }


    // ==========================================
    // HANDLE SUBMIT
    // ==========================================

    async function handleSubmit(event) {

        event.preventDefault();


        // ======================================
        // WALLET REQUIRED
        // ======================================

        if (!connectedWallet) {

            showStatus(
                "Connect your wallet before tokenizing a mineral.",
                "error",
                0
            );

            return;
        }


        // ======================================
        // REQUIRED FIELDS
        // ======================================

        if (
            !form.mineralType ||
            !form.weight ||
            !form.purity ||
            !form.origin
        ) {

            showStatus(
                "Please fill in all required fields.",
                "error",
                0
            );

            return;
        }


        // ======================================
        // NUMERIC VALIDATION
        // ======================================

        const weight =
            Number(form.weight);

        const purity =
            Number(form.purity);


        if (
            !Number.isFinite(weight) ||
            weight <= 0
        ) {

            showStatus(
                "Weight must be greater than zero.",
                "error",
                0
            );

            return;
        }


        if (
            !Number.isFinite(purity) ||
            purity < 0 ||
            purity > 100
        ) {

            showStatus(
                "Purity must be between 0 and 100.",
                "error",
                0
            );

            return;
        }


        try {

            setLoading(true);

            setStatus("");

            setStatusType("info");

            setCurrentStep(0);

            setTransactionHash("");

            setVerificationHash("");

            setTokenId("");

            setAiResult(null);

            setIpfsCid("");


            // ==================================
            // VERIFY WALLET
            // ==================================

            showStatus(
                "Checking connected wallet...",
                "info",
                0
            );


            const currentWallet =
                await getConnectedWallet();


            if (!currentWallet) {

                showStatus(
                    "No wallet is connected. Connect your wallet and try again.",
                    "error",
                    0
                );

                return;
            }


            // ==================================
            // SECURITY CHECK
            // ==================================

            if (
                connectedWallet.toLowerCase() !==
                currentWallet.toLowerCase()
            ) {

                showStatus(
                    "The connected wallet changed. Please reconnect the wallet.",
                    "error",
                    0
                );

                setConnectedWallet(
                    currentWallet
                );

                return;
            }


            // ==================================
            // STEP 1 - IPFS
            // ==================================

            showStatus(
                "Preparing mineral data...",
                "info",
                1
            );


            let documentHash =
                form.documentHash;


            if (documentFile) {

                showStatus(
                    "Uploading document to IPFS...",
                    "info",
                    1
                );


                try {

                    documentHash =
                        await uploadToIPFS(
                            documentFile
                        );

                } catch (error) {

                    showStatus(
                        `IPFS upload failed: ${getErrorMessage(error)}`,
                        "error",
                        1
                    );

                    return;
                }


                if (!documentHash) {

                    showStatus(
                        "IPFS upload did not return a CID.",
                        "error",
                        1
                    );

                    return;
                }


                setIpfsCid(
                    documentHash
                );
            }


            // ==================================
            // MINERAL DATA
            // ==================================

            const mineralData = {

                ...form,

                weight:
                    form.weight,

                purity:
                    form.purity,

                estimatedValue:
                    form.estimatedValue || "0",

                documentHash

            };


            // ==================================
            // STEP 2 - BOTMINER AI
            // ==================================

            showStatus(
                "Running BOTMiner AI analysis...",
                "info",
                2
            );


            let result;


            try {

                result =
                    await Promise.resolve(
                        analyzeMineral(
                            mineralData
                        )
                    );

            } catch (error) {

                showStatus(
                    `BOTMiner AI analysis failed: ${getErrorMessage(error)}`,
                    "error",
                    2
                );

                return;
            }


            if (!result) {

                showStatus(
                    "BOTMiner AI did not return a result.",
                    "error",
                    2
                );

                return;
            }


            if (
                result.aiScore === undefined ||
                result.aiScore === null
            ) {

                showStatus(
                    "BOTMiner AI did not return an AI score.",
                    "error",
                    2
                );

                return;
            }


            setAiResult(
                result
            );


            // ==================================
            // AI SCORE
            // ==================================

            const aiScore =
                Number(result.aiScore);


            if (
                !Number.isFinite(aiScore) ||
                aiScore < 0 ||
                aiScore > 100
            ) {

                showStatus(
                    `Invalid AI score: ${result.aiScore}`,
                    "error",
                    2
                );

                return;
            }


            // ==========================================
            // STEP 3 - CREATE NFT
            // ==========================================

            showStatus(
                "Creating mineral NFT on BOT Chain...",
                "info",
                3
            );


            let creationResult;


            try {

                creationResult =
                    await createMineral(
                        mineralData
                    );

            } catch (error) {

                showStatus(
                    `NFT creation failed: ${getErrorMessage(error)}`,
                    "error",
                    3
                );

                return;
            }


            if (!creationResult) {

                showStatus(
                    "The blockchain did not return a creation result.",
                    "error",
                    3
                );

                return;
            }


            // ==================================
            // TRANSACTION HASH
            // ==================================

            const creationHash =
                creationResult.hash ||
                creationResult.transactionHash ||
                "";


            if (creationHash) {

                setTransactionHash(
                    creationHash
                );
            }


            // ==================================
            // TOKEN ID
            // ==================================

            const createdTokenId =
                normalizeTokenId(
                    creationResult.tokenId
                );


            if (
                !createdTokenId ||
                createdTokenId === "undefined" ||
                createdTokenId === "null"
            ) {

                showStatus(
                    "NFT was created, but the Token ID was not returned.",
                    "error",
                    3
                );

                return;
            }


            setTokenId(
                createdTokenId
            );


            // ==========================================
            // STEP 4 - CONTRACT OWNER
            // ==========================================

            showStatus(
                "Checking MineralRWA contract...",
                "info",
                4
            );


            try {

                await getContractOwner();

            } catch {

                // Informational check only.
            }


            // ==========================================
            // TOKEN OWNER
            // ==========================================

            try {

                await getMineralOwner(
                    createdTokenId
                );

            } catch {

                // Informational check only.
            }


            // ==========================================
            // STEP 5 - VERIFY AI
            // ==========================================

            showStatus(
                "Registering BOTMiner AI verification on-chain...",
                "info",
                5
            );


            let verificationResult;


            try {

                verificationResult =
                    await verifyMineral(

                        createdTokenId,

                        aiScore

                    );

            } catch (error) {

                showStatus(
                    `NFT created, but AI verification failed.\n\n${getErrorMessage(error)}`,
                    "error",
                    5
                );

                return;
            }


            // ==================================
            // VERIFICATION HASH
            // ==================================

            const verificationTxHash =
                verificationResult?.hash ||
                verificationResult?.transactionHash ||
                "";


            if (verificationTxHash) {

                setVerificationHash(
                    verificationTxHash
                );
            }


            // ==========================================
            // STEP 6 - SAVE
            // ==========================================

            showStatus(
                "Saving tokenized mineral...",
                "info",
                6
            );


            const asset = {

                id:
                    `MIN-${createdTokenId}`,

                tokenId:
                    createdTokenId,

                owner:
                    connectedWallet,

                mineralType:
                    mineralData.mineralType,

                mineral:
                    mineralData.mineralType,

                weight:
                    mineralData.weight,

                purity:
                    mineralData.purity,

                origin:
                    mineralData.origin,

                estimatedValue:
                    mineralData.estimatedValue,

                value:
                    mineralData.estimatedValue,

                documentHash:
                    mineralData.documentHash,

                ipfsCid:
                    mineralData.documentHash,

                aiScore:
                    aiScore,

                riskLevel:
                    result.riskLevel || "UNKNOWN",

                aiRecommendation:
                    result.recommendation || "",

                aiAnalysis:
                    result.analysis || "",

                status:
                    "VERIFIED_ON_CHAIN",

                verified:
                    true,

                transactionHash:
                    creationHash,

                verificationTransactionHash:
                    verificationTxHash,

                createdAt:
                    new Date().toISOString()

            };


            localStorage.setItem(
                "botminer_asset",
                JSON.stringify(asset)
            );


            // ==========================================
            // SUCCESS
            // ==========================================

            showStatus(
                `✓ Mineral successfully tokenized and verified! Token ID: #${createdTokenId} | AI Score: ${aiScore}/100`,
                "success",
                7
            );


            // ==========================================
            // OPEN ASSET
            // ==========================================

            setTimeout(() => {

                setPage(
                    "asset"
                );

            }, 1500);


        } catch (error) {

            showStatus(
                `BOTMiner error: ${getErrorMessage(error)}`,
                "error",
                currentStep
            );

        } finally {

            setLoading(false);
        }
    }


    // ==========================================
    // UI
    // ==========================================

    return (

        <div className="page">


            {/* ==================================
                TITLE
            ================================== */}

            <div className="page-title">

                <div>

                    <h1>
                        Tokenize Mineral
                    </h1>

                    <p>
                        Register a real-world mineral
                        asset on BOT Chain.
                    </p>

                </div>

            </div>


            {/* ==================================
                WALLET
            ================================== */}

            {connectedWallet ? (

                <div className="wallet-connected">

                    <strong>
                        ✓ Wallet Connected
                    </strong>

                    <p>
                        {connectedWallet}
                    </p>

                </div>

            ) : (

                <div className="wallet-warning">

                    <strong>
                        ⚠ Wallet Required
                    </strong>

                    <p>
                        Connect your wallet before
                        tokenizing a mineral.
                    </p>

                </div>

            )}


            {/* ==================================
                STATUS
            ================================== */}

            {status && (

                <div
                    className={
                        `status-message ${statusType}`
                    }
                    role="status"
                >

                    {status}

                </div>

            )}


            {/* ==================================
                FORM
            ================================== */}

            <section className="form-panel">

                <form
                    onSubmit={handleSubmit}
                >

                    <div className="form-grid">


                        {/* MINERAL */}

                        <div className="form-group">

                            <label>
                                Mineral Type *
                            </label>

                            <select
                                name="mineralType"
                                value={
                                    form.mineralType
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={loading}
                            >

                                <option value="">
                                    Select mineral
                                </option>

                                <option value="Iron Ore">
                                    Iron Ore
                                </option>

                                <option value="Lithium">
                                    Lithium
                                </option>

                                <option value="Copper">
                                    Copper
                                </option>

                                <option value="Gold">
                                    Gold
                                </option>

                                <option value="Nickel">
                                    Nickel
                                </option>

                            </select>

                        </div>


                        {/* WEIGHT */}

                        <div className="form-group">

                            <label>
                                Weight (tons) *
                            </label>

                            <input
                                name="weight"
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="500"
                                value={
                                    form.weight
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={loading}
                            />

                        </div>


                        {/* PURITY */}

                        <div className="form-group">

                            <label>
                                Purity (%) *
                            </label>

                            <input
                                name="purity"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="67"
                                value={
                                    form.purity
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={loading}
                            />

                        </div>


                        {/* ORIGIN */}

                        <div className="form-group">

                            <label>
                                Origin *
                            </label>

                            <input
                                name="origin"
                                placeholder="Brazil"
                                value={
                                    form.origin
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={loading}
                            />

                        </div>


                        {/* VALUE */}

                        <div className="form-group">

                            <label>
                                Estimated Value (USD)
                            </label>

                            <input
                                name="estimatedValue"
                                type="number"
                                min="0"
                                placeholder="500000"
                                value={
                                    form.estimatedValue
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={loading}
                            />

                        </div>


                        {/* DOCUMENT CID */}

                        <div className="form-group">

                            <label>
                                IPFS Document CID
                            </label>

                            <input
                                name="documentHash"
                                placeholder="bafy..."
                                value={
                                    form.documentHash
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={loading}
                            />

                        </div>

                    </div>


                    {/* ==================================
                        DOCUMENT
                    ================================== */}

                    <div className="upload">

                        <h3>
                            Documentation
                        </h3>

                        <p>
                            Upload the mineral
                            documentation to IPFS.
                        </p>

                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={
                                handleFileChange
                            }
                            disabled={loading}
                        />


                        {documentFile && (

                            <p>

                                Selected:
                                {" "}

                                <strong>
                                    {documentFile.name}
                                </strong>

                            </p>

                        )}


                        {ipfsCid && (

                            <p>

                                IPFS CID:
                                {" "}

                                <strong>
                                    {ipfsCid}
                                </strong>

                            </p>

                        )}

                    </div>


                    {/* ==================================
                        AI
                    ================================== */}

                    {aiResult && (

                        <div className="upload">

                            <h3>
                                BOTMiner AI
                            </h3>

                            <p>

                                AI Score:
                                {" "}

                                <strong>
                                    {aiResult.aiScore}/100
                                </strong>

                            </p>

                            <p>

                                Risk:
                                {" "}

                                <strong>
                                    {
                                        aiResult.riskLevel ||
                                        "UNKNOWN"
                                    }
                                </strong>

                            </p>


                            {aiResult.recommendation && (

                                <p>
                                    {
                                        aiResult.recommendation
                                    }
                                </p>

                            )}

                        </div>

                    )}


                    {/* ==================================
                        TOKEN
                    ================================== */}

                    {tokenId && (

                        <div className="transaction">

                            <strong>
                                ✓ NFT Created
                            </strong>

                            <p>
                                Token ID: #{tokenId}
                            </p>

                            <p>
                                Owner: {connectedWallet}
                            </p>

                        </div>

                    )}


                    {/* ==================================
                        CREATION TX
                    ================================== */}

                    {transactionHash && (

                        <div className="transaction">

                            <strong>
                                ✓ Creation Transaction
                            </strong>

                            <p>
                                {transactionHash}
                            </p>

                        </div>

                    )}


                    {/* ==================================
                        VERIFICATION TX
                    ================================== */}

                    {verificationHash && (

                        <div className="transaction">

                            <strong>
                                ✓ AI Verification Confirmed
                            </strong>

                            <p>
                                {verificationHash}
                            </p>

                        </div>

                    )}


                    {/* ==================================
                        ACTIONS
                    ================================== */}

                    <div className="actions">

                        <button
                            type="button"
                            className="secondary-button"
                            disabled={loading}
                            onClick={() =>
                                setPage(
                                    "dashboard"
                                )
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="primary-button"
                            disabled={
                                loading ||
                                !connectedWallet
                            }
                        >

                            {loading
                                ? "Processing..."
                                : connectedWallet
                                    ? "Tokenize on BOT Chain"
                                    : "Connect Wallet First"
                            }

                        </button>

                    </div>

                </form>

            </section>

        </div>
    );
}


export default CreateAsset;