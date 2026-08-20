import React, { useState, useEffect } from "react";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiRefreshCw, 
  FiDownload 
} from "react-icons/fi";
import { jsPDF } from "jspdf";
import { getReadContract, getConnectedWallet } from "../services/blockchain.jsx";
import "./Dashboard.css";

export function Documents() {
  const [wallet, setWallet] = useState("");
  const [userAssets, setUserAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDocumentsPage();
  }, []);

  async function initDocumentsPage() {
    const account = await getConnectedWallet();
    setWallet(account);
    await loadUserDocuments(account);
  }

  async function loadUserDocuments(account) {
    try {
      setLoading(true);
      const readContract = await getReadContract();

      let totalTokens = 0;
      try {
        const total = await readContract.totalSupply();
        totalTokens = Number(total);
      } catch {
        totalTokens = 50;
      }

      const assets = [];

      for (let i = 1; i <= totalTokens; i++) {
        try {
          const owner = await readContract.ownerOf(i);
          const mineral = await readContract.getMineral(i);

          if (account && owner.toLowerCase() === account.toLowerCase()) {
            assets.push({
              tokenId: i,
              id: `TOKEN-#${i}`,
              mineralType: mineral.mineralType || "Mineral Asset",
              ipfsHash: mineral.documentHash || "",
              purity: mineral.purity ? Number(mineral.purity) : 0,
              verified: mineral.verified,
              owner
            });
          }
        } catch {
          break;
        }
      }

      setUserAssets(assets);
    } catch (error) {
      console.error("Error loading documents from blockchain:", error);
    } finally {
      setLoading(false);
    }
  }

  // Generates On-Chain Provenance Certificate PDF
  function generateCertificatePDF(asset) {
    const doc = new jsPDF();

    // Header and Document Styling
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("BOTMiner RWA - Certificate of Provenance", 14, 20);

    // Asset Details
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    doc.text(`Certificate ID: ${asset.id}`, 14, 45);
    doc.text(`Mineral Type: ${asset.mineralType}`, 14, 55);
    doc.text(`Purity / Quality Score: ${asset.purity}%`, 14, 65);
    doc.text(`Verification Status: ${asset.verified ? "Verified On-Chain" : "Pending Audit"}`, 14, 75);
    doc.text(`Owner Address: ${asset.owner}`, 14, 85);
    doc.text(`IPFS CID Hash: ${asset.ipfsHash || "N/A"}`, 14, 95);
    doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, 14, 105);

    // Authenticity Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 120, 196, 120);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("This document certifies the immutable provenance recorded on BOT Chain Testnet.", 14, 130);

    doc.save(`Certificate_${asset.id}.pdf`);
  }

  return (
    <div className="dashboard">
      <div className="page-title">
        <div>
          <h1>Asset Provenance Certificates</h1>
          <p>Generate and download verified on-chain provenance certificates for your assets.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel" style={{ gridColumn: "span 3" }}>
          <div className="panel-header">
            <h2>Your Asset On-Chain Certificates</h2>
            <button
              className="secondary-button"
              onClick={() => loadUserDocuments(wallet)}
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh
            </button>
          </div>

          <div style={{ padding: "1rem" }}>
            {loading ? (
              <p style={{ color: "#aaa" }}>Loading assets from blockchain...</p>
            ) : userAssets.length === 0 ? (
              <p style={{ color: "#aaa" }}>No assets found for the connected wallet ({wallet ? `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}` : "Wallet disconnected"}).</p>
            ) : (
              userAssets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    borderBottom: "1px solid #222",
                    gap: "1rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <FiFileText size={24} style={{ color: "#3b82f6" }} />
                    <div>
                      <strong style={{ display: "block", fontSize: "1rem" }}>
                        {asset.id} ({asset.mineralType})
                      </strong>
                      <small style={{ color: "#aaa" }}>
                        Purity: {asset.purity}% | Owner: {asset.owner.substring(0, 6)}...{asset.owner.substring(asset.owner.length - 4)}
                      </small>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                    <span style={{ color: asset.verified ? "#10b981" : "#eab308", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <FiCheckCircle /> {asset.verified ? "Verified On-Chain" : "Pending Audit"}
                    </span>

                    <button
                      onClick={() => generateCertificatePDF(asset)}
                      style={{
                        background: "#10b981",
                        border: "none",
                        color: "#fff",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.4rem 0.8rem",
                        borderRadius: "4px",
                        marginTop: "0.25rem"
                      }}
                    >
                      <FiDownload /> Download PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Documents;