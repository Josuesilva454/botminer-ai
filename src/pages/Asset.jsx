import { useEffect, useState } from "react";
import "./Asset.css";
import {
  getMineral,
  getMineralOwner
} from "../services/rwa";
import { TbPdf } from "react-icons/tb";
import { jsPDF } from "jspdf";

function Asset({ setPage, tokenId = 1 }) {
  const [mineral, setMineral] = useState(null);
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD DATA FROM BLOCKCHAIN
  // ==========================================
  useEffect(() => {
    async function loadAsset() {
      try {
        setLoading(true);
        setError("");

        const data = await getMineral(tokenId);
        const mineralOwner = await getMineralOwner(tokenId);

        setMineral(data);
        setOwner(mineralOwner);
      } catch (err) {
        console.error("Failed to load RWA:", err);
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
  // GENERATE PDF CERTIFICATE (jsPDF)
  // ==========================================
  function generatePDF() {
    if (!mineral) return;

    const doc = new jsPDF();

    // Cabeçalho / Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 82, 255);
    doc.text("BOTMiner RWA Certificate", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 32);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 36, 190, 36);

    // Seção: Asset Identification
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Asset Identification", 20, 48);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const formattedPurity = (Number(mineral.purity) / 100).toFixed(2);
    const formattedWeight = (Number(mineral.weight) / 1000).toFixed(3);
    const formattedValue = Number(mineral.estimatedValue).toLocaleString("en-US");

    doc.text(`Token ID: #${tokenId}`, 20, 58);
    doc.text(`Mineral Type: ${mineral.mineralType || "N/A"}`, 20, 66);
    doc.text(`Weight: ${formattedWeight} tons`, 20, 74);
    doc.text(`Purity: ${formattedPurity}%`, 20, 82);
    doc.text(`Origin: ${mineral.origin || "N/A"}`, 20, 90);
    doc.text(`Estimated Value: $${formattedValue} USD`, 20, 98);

    // Seção: AI Status
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 106, 190, 106);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("BOTMiner AI Verification", 20, 118);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`AI Score: ${mineral.aiScore}/100`, 20, 128);
    doc.text(`Status: ${mineral.verified ? "VERIFIED ON-CHAIN" : "PENDING"}`, 20, 136);

    // Seção: Ownership & Blockchain
    doc.line(20, 144, 190, 144);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Blockchain Ownership", 20, 156);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Owner Address:", 20, 166);
    doc.setFont("courier", "normal");
    doc.text(owner || "N/A", 20, 172);

    doc.setFont("helvetica", "normal");
    doc.text("Contract Address:", 20, 182);
    doc.setFont("courier", "normal");
    doc.text(import.meta.env.VITE_MINERAL_RWA_ADDRESS || "Not configured", 20, 188);

    // Rodapé
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("BOT Chain RWA Protocol - Verifiable On-Chain Digital Asset Document", 20, 280);

    // Salvar arquivo
    doc.save(`Asset_Certificate_Token_${tokenId}.pdf`);
  }

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="page">
        <section className="form-panel">
          <h2>Loading Mineral RWA...</h2>
          <p>Reading asset data from the blockchain.</p>
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
          <h2>Unable to load RWA</h2>
          <p>{error}</p>

          <div className="actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPage("dashboard")}
            >
              Back to Dashboard
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => setPage("createAsset")}
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
          <h2>Mineral not found</h2>
          <p>Token #{tokenId} does not exist.</p>
        </section>
      </div>
    );
  }

  // ==========================================
  // FORMAT VALUES
  // ==========================================
  const purity = (Number(mineral.purity) / 100).toFixed(2);
  const weight = (Number(mineral.weight) / 1000).toFixed(3);
  const estimatedValue = Number(mineral.estimatedValue).toLocaleString("en-US");

  const createdDate = mineral.createdAt
    ? new Date(Number(mineral.createdAt) * 1000).toLocaleString()
    : "N/A";

  const status = mineral.verified
    ? "VERIFIED_ON_CHAIN"
    : "CREATED_ON_CHAIN";

  // ==========================================
  // PAGE RENDER
  // ==========================================
  return (
    <div className="page">
      {/* HEADER */}
      <div className="page-title">
        <div>
          <h1>Mineral RWA</h1>
          <p>Real-world asset registered on-chain.</p>
        </div>
        <span className="status-badge">{status}</span>
      </div>

      {/* ASSET INFORMATION */}
      <section className="form-panel">
        <h2>Asset Identification</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Token ID</label>
            <input value={`#${tokenId}`} readOnly />
          </div>

          <div className="form-group">
            <label>Mineral</label>
            <input value={mineral.mineralType} readOnly />
          </div>

          <div className="form-group">
            <label>Weight</label>
            <input value={`${weight} tons`} readOnly />
          </div>

          <div className="form-group">
            <label>Purity</label>
            <input value={`${purity}%`} readOnly />
          </div>

          <div className="form-group">
            <label>Origin</label>
            <input value={mineral.origin} readOnly />
          </div>

          <div className="form-group">
            <label>Estimated Value</label>
            <input value={`$${estimatedValue}`} readOnly />
          </div>

          <div className="form-group">
            <label>Created At</label>
            <input value={createdDate} readOnly />
          </div>

          <div className="form-group">
            <label>Owner</label>
            <input value={owner} readOnly />
          </div>
        </div>
      </section>

      {/* BOTMINER AI */}
      <section className="form-panel">
        <h2>BOTMiner AI</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>AI Score</label>
            <input value={`${mineral.aiScore}/100`} readOnly />
          </div>

          <div className="form-group">
            <label>Verification</label>
            <input value={mineral.verified ? "VERIFIED" : "PENDING"} readOnly />
          </div>
        </div>

        <div className="upload">
          <h3>AI Status</h3>
          <p>
            {mineral.verified
              ? "The BOTMiner AI score has been registered on the blockchain."
              : "The mineral has not been verified by BOTMiner AI yet."}
          </p>
        </div>
      </section>

      {/* DOCUMENT SECTION (PDF GENERATION) */}
      <section className="form-panel">
        <h2>Asset Documentation</h2>
        <div className="upload" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TbPdf size={24} color="#0052ff" /> Digital Certificate PDF
            </h3>
            <p>Generate and download an official PDF document containing on-chain asset details.</p>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={generatePDF}
            style={{ display: "flex", alignItems: "center", gap: "8px", width: "auto" }}
          >
            <TbPdf size={18} /> Download PDF
          </button>
        </div>
      </section>

      {/* BLOCKCHAIN */}
      <section className="form-panel">
        <h2>Blockchain</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Network</label>
            <input value="Hardhat Local" readOnly />
          </div>

          <div className="form-group">
            <label>Contract</label>
            <input
              value={import.meta.env.VITE_MINERAL_RWA_ADDRESS || "Not configured"}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Token Standard</label>
            <input value="ERC-721" readOnly />
          </div>

          <div className="form-group">
            <label>On-chain Status</label>
            <input value={mineral.verified ? "VERIFIED" : "UNVERIFIED"} readOnly />
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setPage("dashboard")}
        >
          Back to Dashboard
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={() => setPage("createAsset")}
        >
          Create Another RWA
        </button>
      </div>
    </div>
  );
}

export default Asset;
