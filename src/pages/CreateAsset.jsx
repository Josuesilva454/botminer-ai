import { useEffect, useState } from "react";
import "./CreateAsset.css";
import {
  createMineral,
  verifyMineral,
  getMineralOwner,
  getContractOwner,
  getConnectedWallet
} from "../services/blockchain";
import { analyzeMineral } from "../services/ai";

function CreateAsset({ setPage, wallet }) {
  // FORM STATE
  const [form, setForm] = useState({
    mineralType: "",
    weight: "",
    purity: "",
    origin: "",
    estimatedValue: "",
    documentHash: ""
  });

  // UI STATE
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");

  // WALLET & TRANSACTIONS
  const [connectedWallet, setConnectedWallet] = useState(wallet || "");
  const [transactionHash, setTransactionHash] = useState("");
  const [verificationHash, setVerificationHash] = useState("");
  const [tokenId, setTokenId] = useState("");

  // SERVICES
  const [aiResult, setAiResult] = useState(null);

  // SYNC WALLET PROPS
  useEffect(() => {
    setConnectedWallet(wallet || "");
  }, [wallet]);

  // HELPERS
  function showStatus(message, type = "info", step = 0) {
    setStatus(message);
    setStatusType(type);
    setCurrentStep(step);
  }

  function getErrorMessage(error) {
    if (!error) return "Unknown error.";
    if (error.code === "ACTION_REJECTED" || error.code === 4001) {
      return "Transaction rejected in MetaMask.";
    }
    return (
      error.shortMessage ||
      error.reason ||
      error.info?.error?.message ||
      error.error?.message ||
      error.message ||
      "An unexpected blockchain error occurred."
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function normalizeTokenId(value) {
    if (value === undefined || value === null) return "";
    return typeof value === "bigint" ? value.toString() : String(value);
  }

  // SUBMIT HANDLER
  async function handleSubmit(event) {
    event.preventDefault();

    if (!connectedWallet) {
      showStatus("Connect your wallet before tokenizing a mineral.", "error", 0);
      return;
    }

    if (!form.mineralType || !form.weight || !form.purity || !form.origin) {
      showStatus("Please fill in all required fields.", "error", 0);
      return;
    }

    const weight = Number(form.weight);
    const purity = Number(form.purity);

    if (!Number.isFinite(weight) || weight <= 0) {
      showStatus("Weight must be greater than zero.", "error", 0);
      return;
    }

    if (!Number.isFinite(purity) || purity <= 0 || purity > 100) {
      showStatus("Purity must be between 0.1% and 100%.", "error", 0);
      return;
    }

    try {
      setLoading(true);
      setStatus("");
      setTransactionHash("");
      setVerificationHash("");
      setTokenId("");
      setAiResult(null);

      // STEP 0: WALLET VERIFICATION
      showStatus("Checking connected wallet...", "info", 0);
      const currentWallet = await getConnectedWallet();

      if (!currentWallet) {
        showStatus("No wallet is connected.", "error", 0);
        return;
      }

      if (connectedWallet.toLowerCase() !== currentWallet.toLowerCase()) {
        setConnectedWallet(currentWallet);
        showStatus("Wallet changed. Please try again.", "error", 0);
        return;
      }

      const mineralData = {
        ...form,
        weight: form.weight,
        purity: form.purity,
        estimatedValue: form.estimatedValue || "0",
        documentHash: form.documentHash || `DOC-${Date.now()}`
      };

      // STEP 1: AI ANALYSIS
      showStatus("Running BOTMiner AI analysis...", "info", 1);
      let result;

      try {
        result = await analyzeMineral(mineralData);
      } catch (error) {
        showStatus(`BOTMiner AI analysis failed: ${getErrorMessage(error)}`, "error", 1);
        return;
      }

      if (!result || result.aiScore === undefined || result.aiScore === null) {
        showStatus("BOTMiner AI did not return a valid score.", "error", 1);
        return;
      }

      setAiResult(result);
      const aiScore = Number(result.aiScore);

      if (!Number.isFinite(aiScore) || aiScore < 0 || aiScore > 100) {
        showStatus("Invalid AI score received.", "error", 1);
        return;
      }

      // STEP 2: BLOCKCHAIN CREATION
      showStatus("Creating mineral NFT on BOT Chain...", "info", 2);
      let creationResult;

      try {
        creationResult = await createMineral(mineralData);
      } catch (error) {
        showStatus(`NFT creation failed: ${getErrorMessage(error)}`, "error", 2);
        return;
      }

      if (!creationResult) {
        showStatus("Blockchain did not return a creation result.", "error", 2);
        return;
      }

      const creationHash = creationResult.hash || creationResult.transactionHash || "";
      setTransactionHash(creationHash);

      const createdTokenId = normalizeTokenId(creationResult.tokenId);
      if (!createdTokenId) {
        showStatus("NFT created, but Token ID was not returned.", "error", 2);
        return;
      }

      setTokenId(createdTokenId);

      // STEP 3: CONTRACT READ CHECKS
      showStatus("Verifying MineralRWA contract state...", "info", 3);
      try {
        await getContractOwner();
      } catch {
        showStatus("Unable to verify contract owner state.", "info", 3);
      }

      try {
        await getMineralOwner(createdTokenId);
      } catch {
        showStatus("Unable to verify NFT ownership state.", "info", 3);
      }

      // STEP 4: ON-CHAIN AI VERIFICATION
      showStatus("Registering BOTMiner AI verification on-chain...", "info", 4);
      let verificationResult;

      try {
        verificationResult = await verifyMineral(createdTokenId, aiScore);
      } catch (error) {
        showStatus(`NFT created, but AI verification failed.\n\n${getErrorMessage(error)}`, "error", 4);
        return;
      }

      const verificationTxHash = verificationResult?.hash || verificationResult?.transactionHash || "";
      setVerificationHash(verificationTxHash);

      // STEP 5: SAVE TO LOCAL STORAGE
      showStatus("Saving tokenized mineral...", "info", 5);
      const asset = {
        id: `MIN-${createdTokenId}`,
        tokenId: createdTokenId,
        owner: connectedWallet,
        mineralType: mineralData.mineralType,
        mineral: mineralData.mineralType,
        weight: mineralData.weight,
        purity: mineralData.purity,
        origin: mineralData.origin,
        estimatedValue: mineralData.estimatedValue,
        value: mineralData.estimatedValue,
        documentHash: mineralData.documentHash,
        aiScore,
        riskLevel: result.riskLevel || "UNKNOWN",
        aiRecommendation: result.recommendation || "",
        aiAnalysis: result.analysis || "",
        status: "VERIFIED_ON_CHAIN",
        verified: true,
        transactionHash: creationHash,
        verificationTransactionHash: verificationTxHash,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem("botminer_asset", JSON.stringify(asset));

      // STEP 6: COMPLETE
      showStatus(
        `✓ Mineral successfully tokenized and verified!\n\nToken ID: #${createdTokenId}\nAI Score: ${aiScore}/100`,
        "success",
        6
      );

      setTimeout(() => setPage("asset"), 1500);
    } catch (error) {
      showStatus(`BOTMiner error: ${getErrorMessage(error)}`, "error", currentStep);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Tokenize Mineral</h1>
          <p>Register a real-world mineral asset on BOT Chain.</p>
        </div>
      </div>

      {connectedWallet ? (
        <div className="wallet-connected">
          <strong>✓ Wallet Connected</strong>
          <p>{connectedWallet}</p>
        </div>
      ) : (
        <div className="wallet-warning">
          <strong>⚠ Wallet Required</strong>
          <p>Connect your wallet before tokenizing a mineral.</p>
        </div>
      )}

      {status && (
        <div className={`status-message ${statusType}`} role="status">
          {status}
        </div>
      )}

      <section className="form-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Mineral Type *</label>
              <select
                name="mineralType"
                value={form.mineralType}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select mineral</option>
                <option value="Iron Ore">Iron Ore</option>
                <option value="Lithium">Lithium</option>
                <option value="Copper">Copper</option>
                <option value="Gold">Gold</option>
                <option value="Nickel">Nickel</option>
              </select>
            </div>

            <div className="form-group">
              <label>Weight (tons) *</label>
              <input
                name="weight"
                type="number"
                step="0.001"
                min="0"
                placeholder="500"
                value={form.weight}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Purity (%) *</label>
              <input
                name="purity"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="67"
                value={form.purity}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Origin *</label>
              <input
                name="origin"
                placeholder="Brazil"
                value={form.origin}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Estimated Value (BOT) *</label>
              <input
                name="estimatedValue"
                type="number"
                min="0"
                step="any"
                placeholder="10"
                value={form.estimatedValue}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Document Hash (Optional)</label>
              <input
                name="documentHash"
                placeholder="DOC-12345678"
                value={form.documentHash}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {aiResult && (
            <div className="upload">
              <h3>BOTMiner AI</h3>
              <p>
                AI Score: <strong>{aiResult.aiScore}/100</strong>
              </p>
              <p>
                Risk: <strong>{aiResult.riskLevel || "UNKNOWN"}</strong>
              </p>
              {aiResult.recommendation && <p>{aiResult.recommendation}</p>}
            </div>
          )}

          {tokenId && (
            <div className="transaction">
              <strong>✓ NFT Created</strong>
              <p>Token ID: #{tokenId}</p>
              <p>Owner: {connectedWallet}</p>
            </div>
          )}

          {transactionHash && (
            <div className="transaction">
              <strong>✓ Creation Transaction</strong>
              <p>{transactionHash}</p>
            </div>
          )}

          {verificationHash && (
            <div className="transaction">
              <strong>✓ AI Verification Confirmed</strong>
              <p>{verificationHash}</p>
            </div>
          )}

          <div className="actions">
            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={() => setPage("dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading || !connectedWallet}
            >
              {loading ? "Processing..." : "Tokenize Asset"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CreateAsset;