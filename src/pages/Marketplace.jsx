import React, { useState, useEffect } from "react";
import { 
  getContract, 
  getReadContract, 
  getConnectedWallet 
} from "../services/blockchain.jsx";
import "./Dashboard.css";

function Marketplace({ setPage }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    initMarketplace();
  }, []);

  async function initMarketplace() {
    await fetchConnectedWallet();
    await loadMarketplaceAssets();
  }

  async function fetchConnectedWallet() {
    const connectedAccount = await getConnectedWallet();
    setWallet(connectedAccount);
  }

  async function loadMarketplaceAssets() {
    try {
      setLoading(true);
      const readContract = await getReadContract();

      // Fetch token balance or loop through items safely
      let totalTokens = 0;
      try {
        const total = await readContract.totalSupply();
        totalTokens = Number(total);
      } catch {
        // Fallback if totalSupply is not defined on contract: try query first 50
        totalTokens = 50; 
      }

      const loadedAssets = [];

      for (let i = 1; i <= totalTokens; i++) {
        try {
          const mineral = await readContract.getMineral(i);
          const owner = await readContract.ownerOf(i);

          // Convert BigInt values to readable numbers
          const weightVal = Number(mineral.weight) / 1000;
          const purityVal = Number(mineral.purity) / 100;
          const estimatedValue = Number(mineral.estimatedValue);

          loadedAssets.push({
            id: `TOKEN-#${i}`,
            tokenId: i,
            mineral: mineral.mineralType || "Unknown Mineral",
            weight: `${weightVal} TON`,
            purity: `${purityVal}%`,
            price: `$${estimatedValue.toLocaleString()}`,
            score: Number(mineral.aiScore) || 0,
            seller: owner,
            verified: mineral.verified
          });
        } catch {
          // Reached end of created tokens
          break;
        }
      }

      setListings(loadedAssets);
    } catch (error) {
      console.error("Error loading Marketplace assets:", error);
    } finally {
      setLoading(false);
    }
  }

  // Handle asset purchase via Smart Contract
  async function handleBuy(item) {
    if (!wallet) {
      alert("Please connect your wallet to make a purchase.");
      return;
    }

    try {
      const contract = await getContract();
      // Execute buy transaction
      const tx = await contract.buyMineral(item.tokenId);
      await tx.wait();

      alert(`Asset ${item.id} successfully purchased!`);
      loadMarketplaceAssets(); // Reload list after purchase
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to process asset purchase.");
    }
  }

  return (
    <div className="dashboard">
      <div className="page-title">
        <div>
          <h1>RWA Marketplace</h1>
          <p>Trade tokenized mineral assets verified on the BOT Chain.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel" style={{ gridColumn: "span 3" }}>
          <div className="panel-header">
            <h2>Available Assets</h2>
            <button className="secondary-button" onClick={loadMarketplaceAssets}>
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <p style={{ padding: "1rem", color: "#888" }}>Loading blockchain assets...</p>
          ) : listings.length === 0 ? (
            <p style={{ padding: "1rem", color: "#888" }}>No mineral assets registered yet.</p>
          ) : (
            listings.map((item) => (
              <div className="asset" key={item.id}>
                <div className="mineral-icon">
                  {item.mineral.substring(0, 2).toUpperCase()}
                </div>

                <div className="asset-name">
                  <strong>{item.id}</strong>
                  <span>{item.mineral}</span>
                </div>

                <div>
                  <small>Weight</small>
                  <strong>{item.weight}</strong>
                </div>

                <div>
                  <small>Purity</small>
                  <strong>{item.purity}</strong>
                </div>

                <div>
                  <small>AI Score</small>
                  <strong>{item.score}/100</strong>
                </div>

                <div>
                  <small>Price</small>
                  <strong>{item.price}</strong>
                </div>

                <button
                  className="primary-button"
                  onClick={() => handleBuy(item)}
                  disabled={Boolean(wallet && item.seller.toLowerCase() === wallet.toLowerCase())}
                >
                  {wallet && item.seller.toLowerCase() === wallet.toLowerCase()
                    ? "Your Asset"
                    : "Buy Asset"}
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default Marketplace;