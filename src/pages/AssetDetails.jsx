import React from "react";
import "./AssetDetails.css";
function AssetDetails({ setPage }) {

  const asset = JSON.parse(
    localStorage.getItem("botminer_asset")
  ) || {
    id: "MIN-0001",
    mineral: "Minério de Ferro",
    weight: "500",
    purity: "67",
    origin: "Brasil",
    value: "500000",
    aiScore: 96,
  };

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

          <span className="verified">
            ✓ RWA VERIFIED
          </span>

          <h1>
            {asset.id}
          </h1>

          <p>
            {asset.mineral}
          </p>

        </div>

      </div>


      <div className="asset-grid">

        <section className="panel">

          <h2>
            Informações do ativo
          </h2>

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
              <small>Valor estimado</small>
              <strong>
                US$ {Number(asset.value || 0).toLocaleString()}
              </strong>
            </div>

            <div>
              <small>Status</small>
              <strong className="verified">
                ✓ Verificado
              </strong>
            </div>

          </div>

        </section>


        <section className="panel ai-panel">

          <div className="ai-label">
            ✦ BOTMiner AI
          </div>

          <h2>
            Análise de IA
          </h2>

          <div className="big-score">
            {asset.aiScore}
            <span>/100</span>
          </div>

          <p>
            Score de confiança do ativo.
          </p>

          <div className="risk">

            <span>
              Risco documental
            </span>

            <strong>
              Baixo
            </strong>

          </div>

        </section>

      </div>


      <section className="panel blockchain">

        <h2>
          Registro Blockchain
        </h2>

        <div className="details">

          <div>
            <small>Network</small>
            <strong>
              BOT Chain Testnet
            </strong>
          </div>

          <div>
            <small>Asset ID</small>
            <strong>
              {asset.id}
            </strong>
          </div>

          <div>
            <small>NFT</small>
            <strong>
              #MIN0001
            </strong>
          </div>

          <div>
            <small>Status</small>
            <strong>
              Aguardando Smart Contract
            </strong>
          </div>

        </div>


        <button className="primary-button">
          Tokenizar na BOT Chain
        </button>

      </section>

    </div>
  );
}

export default AssetDetails;