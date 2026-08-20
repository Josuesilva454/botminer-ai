import React, { useState, useEffect } from "react";
import { 
  getConnectedWallet, 
  getNFTBalance, 
  getMineral 
} from "../services/blockchain";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import "./Dashboard.css";

function Dashboard({ setPage, setSelectedTokenId }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState("");
  const [stats, setStats] = useState({
    totalCount: 0,
    totalValue: 0,
    verifiedCount: 0,
    avgScore: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const userWallet = await getConnectedWallet();
      setWallet(userWallet);

      if (!userWallet) {
        setLoading(false);
        return;
      }

      const balanceBig = await getNFTBalance(userWallet);
      const balance = Number(balanceBig);

      const loadedAssets = [];
      let totalVal = 0;
      let verifiedCnt = 0;
      let scoreSum = 0;

      for (let i = 1; i <= balance; i++) {
        try {
          const mineralData = await getMineral(i);

          const weightTons = Number(mineralData.weight) / 1000;
          const purityPercent = Number(mineralData.purity) / 100;
          const valueUSD = Number(mineralData.estimatedValue);
          const score = Number(mineralData.aiScore);
          const isVerified = mineralData.verified;

          const assetItem = {
            id: `TOKEN-#${i}`,
            tokenId: i,
            mineral: mineralData.mineralType || "Mineral Asset",
            weight: `${weightTons} TON`,
            purity: `${purityPercent}%`,
            score: score,
            value: valueUSD,
            verified: isVerified
          };

          loadedAssets.push(assetItem);

          totalVal += valueUSD;
          if (isVerified) verifiedCnt++;
          scoreSum += score;
        } catch (err) {
          console.warn(`Error loading token #${i}:`, err);
        }
      }

      setAssets(loadedAssets);
      setStats({
        totalCount: loadedAssets.length,
        totalValue: totalVal,
        verifiedCount: verifiedCnt,
        avgScore: loadedAssets.length > 0 ? Math.round(scoreSum / loadedAssets.length) : 0
      });

    } catch (error) {
      console.error("Error loading blockchain data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Função para navegar e carregar o ID correto do ativo no Asset.jsx
  const handleViewAsset = (tokenId) => {
    if (setSelectedTokenId) {
      setSelectedTokenId(tokenId);
    }
    setPage("asset");
  };

  // Cores personalizadas para as barras do gráfico
  const BAR_COLORS = ["#0052ff", "#00d2ff", "#7928ca", "#ff0080", "#4ea8de"];

  return (
    <div className="dashboard">
      <div className="page-title">
        <div>
          <h1>Dashboard</h1>
          <p>Manage your tokenized mineral assets on the BOT Chain.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setPage("create")}
        >
          + New Mineral
        </button>
      </div>

      {/* REAL-TIME STATS PANEL */}
      <section className="stats">
        <div className="stat">
          <small>Total Assets</small>
          <strong>{stats.totalCount}</strong>
        </div>

        <div className="stat">
          <small>Tokenized Value</small>
          <strong>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0
            }).format(stats.totalValue)}
          </strong>
        </div>

        <div className="stat">
          <small>Verified Assets</small>
          <strong>{stats.verifiedCount}</strong>
        </div>

        <div className="stat">
          <small>Average AI Score</small>
          <strong>{stats.avgScore}/100</strong>
        </div>
      </section>

      {/* GRÁFICO DE DISTRIBUIÇÃO DE VALOR */}
      <section className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header">
          <h2>Asset Portfolio Valuation ($ USD)</h2>
        </div>
        
        {assets.length === 0 ? (
          <p style={{ padding: "1rem", color: "#888" }}>
            No chart data available. Mint or load assets to view analytics.
          </p>
        ) : (
          <div style={{ width: "100%", height: 260, marginTop: "1rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assets} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <XAxis dataKey="mineral" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false}
                  tickFormatter={(val) => `$${val.toLocaleString()}`} 
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, "Estimated Value"]}
                  contentStyle={{ backgroundColor: "#1a1d24", borderRadius: "8px", border: "1px solid #333", color: "#fff" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {assets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Recent Assets</h2>
            <button onClick={() => setPage("create")}>+ Register</button>
          </div>

          {!wallet ? (
            <p style={{ padding: "1rem", color: "#888" }}>
              Please connect your wallet to load your tokenized assets.
            </p>
          ) : loading ? (
            <p style={{ padding: "1rem", color: "#888" }}>
              Loading assets from blockchain...
            </p>
          ) : assets.length === 0 ? (
            <p style={{ padding: "1rem", color: "#888" }}>
              No tokenized mineral assets found in this wallet.
            </p>
          ) : (
            assets.map((asset) => (
              <div className="asset" key={asset.id}>
                <div className="mineral-icon">
                  {(asset.mineral || "NA").substring(0, 2).toUpperCase()}
                </div>

                <div className="asset-name">
                  <strong>{asset.id}</strong>
                  <span>{asset.mineral}</span>
                </div>

                <div>
                  <small>Weight</small>
                  <strong>{asset.weight}</strong>
                </div>

                <div>
                  <small>Purity</small>
                  <strong>{asset.purity}</strong>
                </div>

                <div>
                  <small>AI Score</small>
                  <strong>{asset.score}/100</strong>
                </div>

                <button
                  className="view-button"
                  onClick={() => handleViewAsset(asset.tokenId)}
                >
                  View
                </button>
              </div>
            ))
          )}
        </section>

        <section className="panel ai-panel">
          <div className="ai-label">✦ BOTMiner AI</div>
          <h2>Artificial Intelligence</h2>
          <p>
            Analyze documents, characteristics, and risk factors for mineral assets.
          </p>

          <div className="score">
            {stats.avgScore}
            <span>/100</span>
          </div>

          <small>Average Confidence Score</small>

          <button className="primary-button full">
            Analyze Asset
          </button>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;