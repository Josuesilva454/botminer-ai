import { useEffect, useState } from "react";

import "./Asset.css";

import {
    getMineral,
    getMineralOwner
} from "../services/rwa";


function Asset({ setPage, tokenId = 1 }) {

    const [mineral, setMineral] =
        useState(null);

    const [owner, setOwner] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==========================================
    // LOAD DATA FROM BLOCKCHAIN
    // ==========================================

    useEffect(() => {

        async function loadAsset() {

            try {

                setLoading(true);

                setError("");


                const data =
                    await getMineral(
                        tokenId
                    );


                const mineralOwner =
                    await getMineralOwner(
                        tokenId
                    );


                setMineral(data);

                setOwner(
                    mineralOwner
                );


            } catch (err) {

                console.error(
                    "Failed to load RWA:",
                    err
                );


                setError(
                    err?.shortMessage ||
                    err?.message ||
                    "Failed to load mineral from blockchain."
                );

            } finally {

                setLoading(false);

            }

        }


        loadAsset();

    }, [tokenId]);


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="page">

                <section className="form-panel">

                    <h2>
                        Loading Mineral RWA...
                    </h2>

                    <p>
                        Reading asset data
                        from the blockchain.
                    </p>

                </section>

            </div>

        );

    }


    // ==========================================
    // ERROR
    // ==========================================

    if (error) {

        return (

            <div className="page">

                <section className="form-panel">

                    <h2>
                        Unable to load RWA
                    </h2>

                    <p>
                        {error}
                    </p>


                    <div className="actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                                setPage(
                                    "dashboard"
                                )
                            }
                        >
                            Back to Dashboard
                        </button>


                        <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                                setPage(
                                    "createAsset"
                                )
                            }
                        >
                            Create Mineral
                        </button>

                    </div>

                </section>

            </div>

        );

    }


    // ==========================================
    // NO ASSET
    // ==========================================

    if (!mineral) {

        return (

            <div className="page">

                <section className="form-panel">

                    <h2>
                        Mineral not found
                    </h2>

                    <p>
                        Token #{tokenId}
                        does not exist.
                    </p>

                </section>

            </div>

        );

    }


    // ==========================================
    // IPFS
    // ==========================================

    const ipfsUrl =
        mineral.documentHash
            ? `https://ipfs.io/ipfs/${mineral.documentHash}`
            : "";


    // ==========================================
    // FORMAT VALUES
    // ==========================================

    const purity =
        (
            Number(
                mineral.purity
            ) / 100
        ).toFixed(2);


    const weight =
        (
            Number(
                mineral.weight
            ) / 1000
        ).toFixed(3);


    const estimatedValue =
        Number(
            mineral.estimatedValue
        ).toLocaleString(
            "en-US"
        );


    const createdDate =
        mineral.createdAt
            ? new Date(
                Number(
                    mineral.createdAt
                ) * 1000
            ).toLocaleString()
            : "N/A";


    // ==========================================
    // STATUS
    // ==========================================

    const status =
        mineral.verified
            ? "VERIFIED_ON_CHAIN"
            : "CREATED_ON_CHAIN";


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <div className="page">


            {/* ==================================
                HEADER
            ================================== */}

            <div className="page-title">

                <div>

                    <h1>
                        Mineral RWA
                    </h1>

                    <p>
                        Real-world asset
                        registered on-chain.
                    </p>

                </div>


                <span className="status-badge">

                    {status}

                </span>

            </div>


            {/* ==================================
                ASSET INFORMATION
            ================================== */}

            <section className="form-panel">

                <h2>
                    Asset Identification
                </h2>


                <div className="form-grid">


                    <div className="form-group">

                        <label>
                            Token ID
                        </label>

                        <input
                            value={
                                `#${tokenId}`
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Mineral
                        </label>

                        <input
                            value={
                                mineral.mineralType
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Weight
                        </label>

                        <input
                            value={
                                `${weight} tons`
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Purity
                        </label>

                        <input
                            value={
                                `${purity}%`
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Origin
                        </label>

                        <input
                            value={
                                mineral.origin
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Estimated Value
                        </label>

                        <input
                            value={
                                `$${estimatedValue}`
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Created At
                        </label>

                        <input
                            value={
                                createdDate
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Owner
                        </label>

                        <input
                            value={
                                owner
                            }
                            readOnly
                        />

                    </div>

                </div>

            </section>


            {/* ==================================
                BOTMINER AI
            ================================== */}

            <section className="form-panel">

                <h2>
                    BOTMiner AI
                </h2>


                <div className="form-grid">


                    <div className="form-group">

                        <label>
                            AI Score
                        </label>

                        <input
                            value={
                                `${mineral.aiScore}/100`
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Verification
                        </label>

                        <input
                            value={
                                mineral.verified
                                    ? "VERIFIED"
                                    : "PENDING"
                            }
                            readOnly
                        />

                    </div>

                </div>


                <div className="upload">

                    <h3>
                        AI Status
                    </h3>


                    <p>

                        {mineral.verified

                            ? "The BOTMiner AI score has been registered on the blockchain."

                            : "The mineral has not been verified by BOTMiner AI yet."

                        }

                    </p>

                </div>

            </section>


            {/* ==================================
                DOCUMENT
            ================================== */}

            <section className="form-panel">

                <h2>
                    Documentation
                </h2>


                <div className="upload">

                    <h3>
                        IPFS Document
                    </h3>


                    {mineral.documentHash ? (

                        <>

                            <p>
                                CID:
                            </p>

                            <p>
                                <strong>
                                    {mineral.documentHash}
                                </strong>
                            </p>


                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                    window.open(
                                        ipfsUrl,
                                        "_blank"
                                    )
                                }
                            >
                                Open IPFS Document
                            </button>

                        </>

                    ) : (

                        <p>
                            No document registered.
                        </p>

                    )}

                </div>

            </section>


            {/* ==================================
                BLOCKCHAIN
            ================================== */}

            <section className="form-panel">

                <h2>
                    Blockchain
                </h2>


                <div className="form-grid">


                    <div className="form-group">

                        <label>
                            Network
                        </label>

                        <input
                            value={
                                "Hardhat Local"
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Contract
                        </label>

                        <input
                            value={
                                import.meta.env
                                    .VITE_MINERAL_RWA_ADDRESS ||
                                "Not configured"
                            }
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Token Standard
                        </label>

                        <input
                            value="ERC-721"
                            readOnly
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            On-chain Status
                        </label>

                        <input
                            value={
                                mineral.verified
                                    ? "VERIFIED"
                                    : "UNVERIFIED"
                            }
                            readOnly
                        />

                    </div>

                </div>

            </section>


            {/* ==================================
                ACTIONS
            ================================== */}

            <div className="actions">

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                        setPage(
                            "dashboard"
                        )
                    }
                >
                    Back to Dashboard
                </button>


                <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                        setPage(
                            "createAsset"
                        )
                    }
                >
                    Create Another RWA
                </button>

            </div>

        </div>

    );

}


export default Asset;