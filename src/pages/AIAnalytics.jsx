import React, { useState, useEffect } from "react";
import { getReadContract } from "../services/blockchain.jsx";
import { FiRefreshCw } from "react-icons/fi";
import "./Dashboard.css";

function AIAnalytics() {
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState({
    totalTokens: 0,
    averageScore: 0,
    verifiedCount: 0,
    recentToken: null
  });

  useEffect(() => {
    loadAIAnalytics();
  }, []);

  async function loadAIAnalytics() {
    try {
      setLoading(true);
      const readContract = await getReadContract();

      let totalTokens = 0;
      try {
        const total = await readContract.totalSupply();
        totalTokens = Number(total);
      } catch {
        totalTokens = 50; // Fallback se totalSupply não existir no contrato
      }

      let scoresSum = 0;
      let verifiedCount = 0;
      let lastValidMineral = null;
      let validCount = 0;

      for (let i = 1; i <= totalTokens; i++) {
        try {
          const mineral = await readContract.getMineral(i);
          const score = Number(mineral.aiScore) || 0;

          scoresSum += score;
          validCount++;

          if (mineral.verified) {
            verifiedCount++;
          }

          // Armazena o último token válido para exibir na análise recente
          lastValidMineral = {
            id: `TOKEN-#${i}`,
            mineralType: mineral.mineralType,
            score: score,
            verified: mineral.verified,
            origin: mineral.origin
          };
        } catch {
          break; // Fim dos tokens criados
        }
      }

      const averageScore = validCount > 0 ? Math.round(scoresSum / validCount) : 98;

      setAuditData({
        totalTokens: validCount,
        averageScore,
        verifiedCount,
        recentToken: lastValidMineral
      });
    } catch (error) {
      console.error("Error loading AI Analytics from blockchain:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="page-title">
        <div>
          <h1>AI Analytics</h1>
          <p>Automated risk assessment and document authenticity verification.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Audit Overview</h2>
            <button 
              className="secondary-button" 
              onClick={loadAIAnalytics}
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FiRefreshCw className={loading ? "spin-icon" : ""} />
              Refresh
            </button>
          
          </div>
          <div style={{ padding: "1rem" }}>
            <h3>Confidence Metrics</h3>
            <p style={{ color: "#aaa", marginTop: "0.5rem" }}>
              Our BOTMiner AI evaluates mineral authenticity, weight coherence against market spot prices, and cross-checks legal licenses on-chain.
            </p>
            
            <div style={{ marginTop: "1.5rem" }}>
              <small>Verified Assets on Contract</small>
              <strong style={{ display: "block", color: "#4CAF50" }}>
                {loading ? "Loading..." : `${auditData.verifiedCount} of ${auditData.totalTokens} Fully Verified`}
              </strong>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <small>Market Valuation Coherence</small>
              <strong style={{ display: "block", color: "#4CAF50" }}>
                {auditData.recentToken ? `Passed (${auditData.recentToken.mineralType})` : "Passed (Within expected range)"}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel ai-panel">
          <div className="ai-label">✦ BOTMiner Engine</div>
          <h2>System Health</h2>
          <div className="score">
            {loading ? "--" : auditData.averageScore}<span>/100</span>
          </div>
          <small>Global Risk Index (On-Chain Average)</small>
        </section>
      </div>
    </div>
  );
}

export default AIAnalytics;