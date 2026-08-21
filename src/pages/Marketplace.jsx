import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  getContract, 
  getReadContract, 
  getConnectedWallet,
  buyMineral,
  getBlockchainError
} from "../services/blockchain.jsx";
import { FiRefreshCw } from "react-icons/fi";
import "./Dashboard.css";

function Marketplace({ setPage }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [wallet, setWallet] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });

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

      let totalTokens = 0;
      try {
        const total = await readContract.nextTokenId();
        totalTokens = Number(total) - 1;
      } catch {
        totalTokens = 50; 
      }

      const loadedAssets = [];

      for (let i = 1; i <= totalTokens; i++) {
        try {
          const mineral = await readContract.getMineral(i);
          const owner = await readContract.ownerOf(i);

          // BigInt conversion and scaling
          const weightVal = Number(mineral.weight) / 1000;
          const purityVal = Number(mineral.purity) / 100;
          
          // Formats Wei to a readable string (e.g., 1.0 BOT / USD)
          const priceInEth = ethers.formatEther(mineral.estimatedValue);

          loadedAssets.push({
            id: `TOKEN-#${i}`,
            tokenId: i,
            mineral: mineral.mineralType || "Unknown Mineral",
            weight: `${weightVal} TON`,
            purity: `${purityVal}%`,
            priceFormatted: `$${priceInEth} BOT`,
            priceRaw: priceInEth,
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
      setNotification({
        type: "error",
        message: "Failed to load marketplace assets from the blockchain."
      });
    } finally {
      setLoading(false);
    }
  }

  // Buy asset using the blockchain.js service
  async function handleBuy(item) {
    setNotification({ type: "", message: "" });

    if (!wallet) {
      setNotification({
        type: "error",
        message: "Please connect your wallet to make a purchase."
      });
      return;
    }

    try {
      setBuyingId(item.tokenId);

      // Execute purchase with token ID and exact price value
      const result = await buyMineral(item.tokenId, item.priceRaw);
      
      setNotification({
        type: "success",
        message: `Asset ${item.id} successfully purchased! Transaction Hash: ${result.hash}`
      });
      await loadMarketplaceAssets(); // Reload assets
    } catch (error) {
      setNotification({
        type: "error",
        message: `Purchase failed: ${error.message}`
      });
    } finally {
      setBuyingId(null);
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
            <button 
              className="secondary-button" 
              onClick={loadMarketplaceAssets}
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FiRefreshCw className={loading ? "spin-icon" : ""} />
              Refresh
            </button>
          </div>

          {/* UI NOTIFICATION MESSAGE */}
          {notification.message && (
            <div className={`status-message ${notification.type}`}>
              {notification.message}
            </div>
          )}

          {loading ? (
            <p style={{ padding: "1rem", color: "#888" }}>Loading blockchain assets...</p>
          ) : listings.length === 0 ? (
            <p style={{ padding: "1rem", color: "#888" }}>No mineral assets registered yet.</p>
          ) : (
            listings.map((item) => {
              const isOwner = wallet && item.seller.toLowerCase() === wallet.toLowerCase();
              const isBuyingThis = buyingId === item.tokenId;

              return (
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
                    <strong>{item.priceFormatted}</strong>
                  </div>

                  <button
                    className="primary-button"
                    onClick={() => handleBuy(item)}
                    disabled={isOwner || isBuyingThis}
                  >
                    {isBuyingThis 
                      ? "Processing..." 
                      : isOwner 
                      ? "Your Asset" 
                      : "Buy Asset"}
                  </button>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}

export default Marketplace;