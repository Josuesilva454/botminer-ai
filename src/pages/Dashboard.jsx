import React from "react";
import "./Dashboard.css";
function Dashboard({ setPage }) {

  const assets = [
    {
      id: "MIN-0001",
      mineral: "Minério de Ferro",
      weight: "500 TON",
      purity: "67%",
      score: 96,
    },
    {
      id: "MIN-0002",
      mineral: "Lítio",
      weight: "50 TON",
      purity: "98.5%",
      score: 91,
    },
  ];

  return (

    <div className="dashboard">

      <div className="page-title">

        <div>
          <h1>Dashboard</h1>

          <p>
            Gerencie seus ativos minerais tokenizados.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setPage("create")}
        >
          + Novo Mineral
        </button>

      </div>


      <section className="stats">

        <div className="stat">
          <small>Total de ativos</small>
          <strong>12</strong>
        </div>

        <div className="stat">
          <small>Valor tokenizado</small>
          <strong>US$ 2.450.000</strong>
        </div>

        <div className="stat">
          <small>Ativos verificados</small>
          <strong>10</strong>
        </div>

        <div className="stat">
          <small>AI Score médio</small>
          <strong>94/100</strong>
        </div>

      </section>


      <div className="dashboard-grid">

        <section className="panel">

          <div className="panel-header">

            <h2>
              Ativos recentes
            </h2>

            <button
              onClick={() => setPage("create")}
            >
              + Cadastrar
            </button>

          </div>


          {assets.map((asset) => (

            <div
              className="asset"
              key={asset.id}
            >

              <div className="mineral-icon">
                {asset.mineral.substring(0, 2).toUpperCase()}
              </div>

              <div className="asset-name">

                <strong>
                  {asset.id}
                </strong>

                <span>
                  {asset.mineral}
                </span>

              </div>

              <div>
                <small>Peso</small>
                <strong>{asset.weight}</strong>
              </div>

              <div>
                <small>Pureza</small>
                <strong>{asset.purity}</strong>
              </div>

              <div>
                <small>AI Score</small>
                <strong>{asset.score}/100</strong>
              </div>

              <button
                className="view-button"
                onClick={() => setPage("asset")}
              >
                Ver
              </button>

            </div>

          ))}

        </section>


        <section className="panel ai-panel">

          <div className="ai-label">
            ✦ BOTMiner AI
          </div>

          <h2>
            Inteligência Artificial
          </h2>

          <p>
            Analise documentos, características
            e riscos dos ativos minerais.
          </p>

          <div className="score">
            96
            <span>/100</span>
          </div>

          <small>
            Score de confiança
          </small>

          <button className="primary-button full">
            Analisar ativo
          </button>

        </section>

      </div>

    </div>
  );
}

export default Dashboard;