import React, { useEffect, useState } from "react";
import "./AssetDetails.css";

import {
  getMineral,
  getMineralOwner,
  buyMineral,
  getConnectedWallet
} from "../services/blockchain";

function AssetDetails({ setPage, wallet }) {
  // ======================================================
  // STATE
  // ======================================================
  const [asset, setAsset] = useState(null);
  const [owner, setOwner] = useState("");
  const [currentWallet, setCurrentWallet] = useState(wallet || "");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // ======================================================
  // LOAD ASSET
  // ======================================================
  useEffect(() => {
    async function loadAsset() {
      try {
        setLoading(true);
        setError("");
        setStatusMessage("");

        // Check wallet
        const activeWallet = await getConnectedWallet().catch(() => wallet || "");
        setCurrentWallet(activeWallet);

        // Read LocalStorage
        const savedAsset = JSON.parse(
          localStorage.getItem("botminer_asset")
        );

        if (!savedAsset) {
          throw new Error("Nenhum ativo tokenizado foi encontrado em tela.");
        }

        if (
          savedAsset.tokenId === undefined ||
          savedAsset.tokenId === null ||
          savedAsset.tokenId === ""
        ) {
          throw new Error("Token ID não encontrado no registro local.");
        }

        const tokenId = savedAsset.tokenId;

        // Fetch Blockchain Data
        let mineral = null;
        try {
          mineral = await getMineral(tokenId);
        } catch {
          setStatusMessage("Aviso: Falha ao buscar dados diretos do contrato, usando fallback local.");
        }

        let mineralOwner = "";
        try {
          mineralOwner = await getMineralOwner(tokenId);
        } catch {
          setStatusMessage("Aviso: Não foi possível consultar o proprietário atual do token.");
        }

        // Normalize Data Structure
        const normalizedAsset = {
          ...savedAsset,
          tokenId: tokenId.toString(),
          id: savedAsset.id || `MIN-${tokenId}`,
          mineral: mineral?.mineralType || savedAsset.mineralType || savedAsset.mineral || "Desconhecido",
          mineralType: mineral?.mineralType || savedAsset.mineralType || "Desconhecido",
          weight: mineral ? mineral.weight.toString() : savedAsset.weight,
          purity: mineral ? mineral.purity.toString() : savedAsset.purity,
          origin: mineral?.origin || savedAsset.origin || "N/A",
          value: mineral?.estimatedValue || savedAsset.estimatedValue || savedAsset.value || "0",
          estimatedValue: mineral?.estimatedValue || savedAsset.estimatedValue || "0",
          documentHash: mineral?.documentHash || savedAsset.documentHash || "",
          aiScore: mineral ? Number(mineral.aiScore) : Number(savedAsset.aiScore || 0),
          verified: mineral ? mineral.verified : Boolean(savedAsset.verified),
          createdAt: mineral?.createdAt || savedAsset.createdAt || new Date().toISOString(),
          owner: mineralOwner || savedAsset.owner || ""
        };

        setAsset(normalizedAsset);
        setOwner(mineralOwner);

        // Update Sync LocalStorage
        localStorage.setItem(
          "botminer_asset",
          JSON.stringify(normalizedAsset)
        );

      } catch (err) {
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
  }, [wallet]);

  // ======================================================
  // HANDLE BUY ASSET
  // ======================================================
  async function handleBuy() {
    if (!asset || !asset.tokenId) return;

    try {
      setPurchasing(true);
      setStatusMessage("Enviando transação de compra para a rede BOT Chain...");

      const tx = await buyMineral(asset.tokenId, asset.value);
      
      setStatusMessage(`✓ Compra efetuada com sucesso! Tx: ${tx.hash || tx.transactionHash}`);

      // Atualiza dono local
      const updatedWallet = await getConnectedWallet();
      setOwner(updatedWallet);
      setAsset(prev => ({ ...prev, owner: updatedWallet }));

    } catch (err) {
      const errorMsg = err?.shortMessage || err?.reason || err?.message || "Erro desconhecido.";
      setStatusMessage(`Falha na compra: ${errorMsg}`);
    } finally {
      setPurchasing(false);
    }
  }

  // ======================================================
  // RENDER STATES
  // ======================================================
  if (loading) {
    return (
      <div className="page">
        <div className="page-title">
          <div>
            <h1>Carregando ativo...</h1>
            <p>Consultando MineralRWA na BOT Chain.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="page">
        <button
          className="back-button"
          onClick={() => setPage("dashboard")}
        >
          ← Voltar
        </button>

        <div className="panel">
          <h2>Não foi possível carregar o RWA</h2>
          <p>{error || "Ativo não encontrado."}</p>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentWallet && owner && currentWallet.toLowerCase() === owner.toLowerCase();

  return (
    <div className="page">
      <button
        className="back-button"
        onClick={() => setPage("dashboard")}
      >
        ← Voltar
      </button>

      <div className="page-title">
        <div>
          {asset.verified && (
            <span className="verified">
              ✓ RWA VERIFIED
            </span>
          )}
          <h1>{asset.id}</h1>
          <p>{asset.mineral}</p>
        </div>
      </div>

      {statusMessage && (
        <div className="status-message info">
          {statusMessage}
        </div>
      )}

      <div className="asset-grid">
        {/* INFORMATIONS */}
        <section className="panel">
          <h2>Informações do ativo</h2>
          <div className="details">
            <div>
              <small>Mineral</small>
              <strong>{asset.mineral}</strong>
            </div>

            <div>
              <small>Peso</small>
              <strong>{asset.weight} toneladas</strong>
            </div>

            <div>
              <small>Pureza</small>
              <strong>{asset.purity}%</strong>
            </div>

            <div>
              <small>Origem</small>
              <strong>{asset.origin}</strong>
            </div>

            <div>
              <small>Valor Estimado</small>
              <strong>
                {Number(asset.value || 0).toLocaleString()} BOT
              </strong>
            </div>

            <div>
              <small>Status</small>
              <strong className={asset.verified ? "verified" : ""}>
                {asset.verified ? "✓ Verificado" : "Não verificado"}
              </strong>
            </div>
          </div>

          {/* COMPRA DE ATIVO SE NÃO FOR O DONO */}
          {!isOwner && currentWallet && (
            <div style={{ marginTop: "20px" }}>
              <button
                className="primary-button"
                onClick={handleBuy}
                disabled={purchasing}
              >
                {purchasing ? "Processando Compra..." : `Comprar Ativo por ${asset.value} BOT`}
              </button>
            </div>
          )}
        </section>

        {/* AI PANEL */}
        <section className="panel ai-panel">
          <div className="ai-label">✦ BOTMiner AI</div>
          <h2>Análise de IA</h2>

          <div className="big-score">
            {asset.aiScore}
            <span>/100</span>
          </div>

          <p>Score de confiança do ativo na rede.</p>

          <div className="risk">
            <span>Risco documental</span>
            <strong>{asset.riskLevel || "Baixo"}</strong>
          </div>

          {asset.aiRecommendation && (
            <div className="ai-recommendation">
              <small>Recomendação</small>
              <p>{asset.aiRecommendation}</p>
            </div>
          )}
        </section>
      </div>

      {/* BLOCKCHAIN DETAILS */}
      <section className="panel blockchain">
        <h2>Registro Blockchain</h2>
        <div className="details">
          <div>
            <small>Network</small>
            <strong>BOT Chain Testnet</strong>
          </div>

          <div>
            <small>Chain ID</small>
            <strong>968</strong>
          </div>

          <div>
            <small>Asset ID</small>
            <strong>{asset.id}</strong>
          </div>

          <div>
            <small>NFT Token ID</small>
            <strong>#{asset.tokenId}</strong>
          </div>

          <div>
            <small>NFT Owner</small>
            <strong>
              {owner || asset.owner || "Não disponível"}
              {isOwner ? " (Você)" : ""}
            </strong>
          </div>

          <div>
            <small>Status On-Chain</small>
            <strong className="verified">
              {asset.verified ? "✓ VERIFIED ON CHAIN" : "PENDING VERIFICATION"}
            </strong>
          </div>

          {asset.transactionHash && (
            <div>
              <small>Creation Transaction</small>
              <strong>{asset.transactionHash}</strong>
            </div>
          )}

          {asset.verificationTransactionHash && (
            <div>
              <small>Verification Transaction</small>
              <strong>{asset.verificationTransactionHash}</strong>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AssetDetails;