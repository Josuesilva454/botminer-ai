import React from "react";
import "./Dashboard.css";

function AIAnalytics() {
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
          </div>
          <div style={{ padding: "1rem" }}>
            <h3>Confidence Metrics</h3>
            <p style={{ color: "#aaa", marginTop: "0.5rem" }}>
              Our BOTMiner AI evaluates mineral authenticity, weight coherence against market spot prices, and cross-checks legal licenses.
            </p>
            
            <div style={{ marginTop: "1.5rem" }}>
              <small>Document Integrity Check</small>
              <strong style={{ display: "block", color: "#4CAF50" }}>100% Valid Hash Match</strong>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <small>Market Valuation Coherence</small>
              <strong style={{ display: "block", color: "#4CAF50" }}>Passed (Within expected range)</strong>
            </div>
          </div>
        </section>

        <section className="panel ai-panel">
          <div className="ai-label">✦ BOTMiner Engine</div>
          <h2>System Health</h2>
          <div className="score">
            98<span>/100</span>
          </div>
          <small>Global Risk Index</small>
        </section>
      </div>
    </div>
  );
}

export default AIAnalytics;