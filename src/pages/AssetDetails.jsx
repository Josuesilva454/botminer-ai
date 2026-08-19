import React, { useEffect, useState } from "react";
import "./AssetDetails.css";

import {
    getMineral,
    getMineralOwner
} from "../services/rwa";


function AssetDetails({ setPage }) {

    // ======================================================
    // STATE
    // ======================================================

    const [asset, setAsset] = useState(null);

    const [owner, setOwner] = useState("");

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ======================================================
    // LOAD ASSET
    // ======================================================

    useEffect(() => {

        async function loadAsset() {

            try {

                setLoading(true);

                setError("");


                // ==================================================
                // LOCAL ASSET
                // ==================================================

                const savedAsset =
                    JSON.parse(
                        localStorage.getItem(
                            "botminer_asset"
                        )
                    );


                if (!savedAsset) {

                    throw new Error(
                        "Nenhum ativo tokenizado foi encontrado."
                    );

                }


                if (
                    savedAsset.tokenId === undefined ||
                    savedAsset.tokenId === null ||
                    savedAsset.tokenId === ""
                ) {

                    throw new Error(
                        "Token ID não encontrado no ativo."
                    );

                }


                // ==================================================
                // TOKEN ID
                // ==================================================

                const tokenId =
                    savedAsset.tokenId;


                // ==================================================
                // BLOCKCHAIN
                // ==================================================

                const mineral =
                    await getMineral(
                        tokenId
                    );


                // ==================================================
                // OWNER
                // ==================================================

                let mineralOwner = "";

                try {

                    mineralOwner =
                        await getMineralOwner(
                            tokenId
                        );

                } catch (ownerError) {

                    console.warn(
                        "Não foi possível consultar ownerOf():",
                        ownerError
                    );

                }


                // ==================================================
                // NORMALIZE
                // ==================================================

                const normalizedAsset = {

                    ...savedAsset,

                    tokenId:

                        tokenId.toString(),

                    id:
                        savedAsset.id ||
                        `MIN-${tokenId}`,

                    mineral:
                        mineral.mineralType,

                    mineralType:
                        mineral.mineralType,

                    weight:
                        Number(mineral.weight) / 1000,

                    purity:
                        Number(mineral.purity) / 100,

                    origin:
                        mineral.origin,

                    value:
                        mineral.estimatedValue,

                    estimatedValue:
                        mineral.estimatedValue,

                    documentHash:
                        mineral.documentHash,

                    aiScore:
                        Number(mineral.aiScore),

                    verified:
                        mineral.verified,

                    createdAt:
                        mineral.createdAt,

                    owner:
                        mineralOwner ||
                        savedAsset.owner ||
                        ""

                };


                setAsset(
                    normalizedAsset
                );


                setOwner(
                    mineralOwner
                );


                // ==================================================
                // UPDATE LOCAL STORAGE
                // ==================================================

                localStorage.setItem(
                    "botminer_asset",
                    JSON.stringify(
                        normalizedAsset
                    )
                );


            } catch (err) {

                console.error(
                    "Failed to load RWA:",
                    err
                );


                setError(
                    err?.shortMessage ||
                    err?.reason ||
                    err?.message ||
                    "Não foi possível carregar o ativo."
                );

            } finally {

                setLoading(false);

            }

        }


        loadAsset();

    }, []);


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (

            <div className="page">

                <div className="page-title">

                    <div>

                        <h1>
                            Carregando ativo...
                        </h1>

                        <p>
                            Consultando MineralRWA na BOT Chain.
                        </p>

                    </div>

                </div>

            </div>

        );

    }


    // ======================================================
    // ERROR
    // ======================================================

    if (error || !asset) {

        return (

            <div className="page">

                <button
                    className="back-button"
                    onClick={() =>
                        setPage("dashboard")
                    }
                >
                    ← Voltar
                </button>


                <div className="panel">

                    <h2>
                        Não foi possível carregar o RWA
                    </h2>

                    <p>
                        {error ||
                            "Ativo não encontrado."
                        }
                    </p>


                    <button
                        className="primary-button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        Tentar novamente
                    </button>

                </div>

            </div>

        );

    }


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <div className="page">

            {/* ==================================================
                BACK
            ================================================== */}

            <button
                className="back-button"
                onClick={() =>
                    setPage("dashboard")
                }
            >
                ← Voltar
            </button>


            {/* ==================================================
                TITLE
            ================================================== */}

            <div className="page-title">

                <div>

                    {asset.verified && (

                        <span className="verified">
                            ✓ RWA VERIFIED
                        </span>

                    )}


                    <h1>
                        {asset.id}
                    </h1>


                    <p>
                        {asset.mineral}
                    </p>

                </div>

            </div>


            {/* ==================================================
                ASSET
            ================================================== */}

            <div className="asset-grid">

                {/* ==================================================
                    INFORMATION
                ================================================== */}

                <section className="panel">

                    <h2>
                        Informações do ativo
                    </h2>


                    <div className="details">

                        <div>

                            <small>
                                Mineral
                            </small>

                            <strong>
                                {asset.mineral}
                            </strong>

                        </div>


                        <div>

                            <small>
                                Peso
                            </small>

                            <strong>
                                {asset.weight} toneladas
                            </strong>

                        </div>


                        <div>

                            <small>
                                Pureza
                            </small>

                            <strong>
                                {asset.purity}%
                            </strong>

                        </div>


                        <div>

                            <small>
                                Origem
                            </small>

                            <strong>
                                {asset.origin}
                            </strong>

                        </div>


                        <div>

                            <small>
                                Valor estimado
                            </small>

                            <strong>

                                US${" "}

                                {Number(
                                    asset.value || 0
                                ).toLocaleString()}

                            </strong>

                        </div>


                        <div>

                            <small>
                                Status
                            </small>

                            <strong className="verified">

                                {asset.verified

                                    ? "✓ Verificado"

                                    : "Não verificado"

                                }

                            </strong>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    AI
                ================================================== */}

                <section className="panel ai-panel">

                    <div className="ai-label">
                        ✦ BOTMiner AI
                    </div>


                    <h2>
                        Análise de IA
                    </h2>


                    <div className="big-score">

                        {asset.aiScore}

                        <span>
                            /100
                        </span>

                    </div>


                    <p>
                        Score de confiança do ativo.
                    </p>


                    <div className="risk">

                        <span>
                            Risco documental
                        </span>

                        <strong>

                            {asset.riskLevel ||
                                "Baixo"
                            }

                        </strong>

                    </div>


                    {asset.aiRecommendation && (

                        <div className="ai-recommendation">

                            <small>
                                Recomendação
                            </small>

                            <p>
                                {asset.aiRecommendation}
                            </p>

                        </div>

                    )}

                </section>

            </div>


            {/* ==================================================
                BLOCKCHAIN
            ================================================== */}

            <section className="panel blockchain">

                <h2>
                    Registro Blockchain
                </h2>


                <div className="details">

                    <div>

                        <small>
                            Network
                        </small>

                        <strong>
                            BOT Chain Testnet
                        </strong>

                    </div>


                    <div>

                        <small>
                            Chain ID
                        </small>

                        <strong>
                            968
                        </strong>

                    </div>


                    <div>

                        <small>
                            Asset ID
                        </small>

                        <strong>
                            {asset.id}
                        </strong>

                    </div>


                    <div>

                        <small>
                            NFT Token ID
                        </small>

                        <strong>
                            #{asset.tokenId}
                        </strong>

                    </div>


                    <div>

                        <small>
                            NFT Owner
                        </small>

                        <strong>

                            {owner ||
                                asset.owner ||
                                "Não disponível"
                            }

                        </strong>

                    </div>


                    <div>

                        <small>
                            Status
                        </small>

                        <strong className="verified">

                            {asset.verified

                                ? "✓ VERIFIED ON CHAIN"

                                : "PENDING VERIFICATION"

                            }

                        </strong>

                    </div>


                    {asset.transactionHash && (

                        <div>

                            <small>
                                Creation Transaction
                            </small>

                            <strong>
                                {asset.transactionHash}
                            </strong>

                        </div>

                    )}


                    {asset.verificationTransactionHash && (

                        <div>

                            <small>
                                Verification Transaction
                            </small>

                            <strong>
                                {asset.verificationTransactionHash}
                            </strong>

                        </div>

                    )}


                    {asset.documentHash && (

                        <div>

                            <small>
                                IPFS CID
                            </small>

                            <strong>
                                {asset.documentHash}
                            </strong>

                        </div>

                    )}

                </div>

            </section>

        </div>

    );

}


export default AssetDetails;