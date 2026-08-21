import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  getConnectedWallet, 
  getNFTBalance, 
  getMineral 
} from "../services/blockchain";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import "./Dashboard.css";

function Dashboard({ setPage, setSelectedTokenId }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" });
  
  const [stats, setStats] = useState({
    totalCount: 0,
    totalValue: 0,
    verifiedCount: 0,
    avgScore: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Helper para exibir notificações na tela ao invés de alert() ou console
  const showToast = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "info" });
    }, 4000);
  };

  async function loadDashboardData() {
    try {
      setLoading(true);
      const userWallet = await getConnectedWallet().catch(() => "");
      setWallet(userWallet);

      const loadedAssets = [];
      let totalVal = 0;
      let verifiedCnt = 0;
      let scoreSum = 0;

      if (userWallet) {
        try {
          const balanceBig = await getNFTBalance(userWallet);
          const balance = Number(balanceBig);

          for (let i = 1; i <= balance; i++) {
            try {
              const mineralData = await getMineral(i);

              const weightTons = mineralData.weight ? String(Number(mineralData.weight) / 1000) : "0";
              const purityPercent = mineralData.purity ? String(Number(mineralData.purity) / 100) : "0";
              
              // Converte Wei para BOT (ex: 1500000000000000000 -> 1.5)
              const rawEthValue = mineralData.estimatedValue 
                ? parseFloat(ethers.formatEther(mineralData.estimatedValue)) 
                : 0;

              const score = Number(mineralData.aiScore || 0);
              const isVerified = Boolean(mineralData.verified);

              const assetItem = {
                id: `TOKEN-#${i}`,
                tokenId: i,
                mineral: mineralData.mineralType || "Mineral Asset",
                weight: `${weightTons} TON`,
                purity: `${purityPercent}%`,
                score: score,
                value: rawEthValue,
                verified: isVerified
              };

              loadedAssets.push(assetItem);
              totalVal += rawEthValue;
              if (isVerified) verifiedCnt++;
              scoreSum += score;
            } catch (err) {
              // Silencioso sem usar console.warn
            }
          }
        } catch (balErr) {
          showToast("Não foi possível carregar o saldo diretamente da blockchain.", "error");
        }
      }

      // Fallback: LocalStorage
      if (loadedAssets.length === 0) {
        const savedAsset = JSON.parse(localStorage.getItem("botminer_asset"));
        if (savedAsset) {
          const rawVal = savedAsset.estimatedValue 
            ? parseFloat(ethers.formatEther(savedAsset.estimatedValue))
            : Number(savedAsset.value || 0);
            
          const sc = Number(savedAsset.aiScore || 0);

          loadedAssets.push({
            id: savedAsset.id || `TOKEN-#${savedAsset.tokenId || 1}`,
            tokenId: savedAsset.tokenId || 1,
            mineral: savedAsset.mineralType || savedAsset.mineral || "Mineral Asset",
            weight: `${savedAsset.weight || 0} TON`,
            purity: `${savedAsset.purity || 0}%`,
            score: sc,
            value: rawVal,
            verified: Boolean(savedAsset.verified)
          });

          totalVal += rawVal;
          if (savedAsset.verified) verifiedCnt++;
          scoreSum += sc;
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
      showToast("Erro ao processar dados do Dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleViewAsset = (tokenId) => {
    if (setSelectedTokenId) {
      setSelectedTokenId(tokenId);
    }
    setPage("asset");
  };

  const PIE_COLORS = ["#0052FF", "#00D2FF", "#7928CA", "#FF0080", "#FF9900", "#10B981"];

  return (
    <div className="dashboard">
      {/* BANNER DE MENSAGEM (Substitui alerts e consoles) */}
      {notification.show && (
        <div className={`dashboard-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="page-title">
        <div>
          <h1>Dashboard</h1>
          <p>Manage your tokenized mineral assets on the BOT Chain.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setPage("createAsset")}
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
            {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} BOT
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

      {/* GRÁFICO DE PIZZA */}
      <section className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header">
          <h2>Portfolio Asset Allocation (BOT)</h2>
        </div>
        
        {assets.length === 0 ? (
          <p style={{ padding: "1rem", color: "#888" }}>
            No chart data available. Mint or load assets to view analytics.
          </p>
        ) : (
          <div style={{ width: "100%", height: 320, marginTop: "1rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assets}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={5}
                  cornerRadius={6}
                  dataKey="value"
                  nameKey="mineral"
                  animationDuration={800}
                >
                  {assets.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]} 
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${Number(value).toLocaleString()} BOT`, "Estimated Value"]}
                  contentStyle={{ 
                    backgroundColor: "#11141a", 
                    borderRadius: "10px", 
                    border: "1px solid #2a2e39", 
                    color: "#fff",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.5)"
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span style={{ color: "#aaa", fontSize: "13px" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Recent Assets</h2>
            <button onClick={() => setPage("createAsset")}>+ Register</button>
          </div>

          {!wallet && assets.length === 0 ? (
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

          <button 
            className="primary-button full"
            onClick={() => setPage("createAsset")}
          >
            Analyze Asset
          </button>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;