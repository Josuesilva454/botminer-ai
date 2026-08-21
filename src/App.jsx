import { useEffect, useRef, useState } from "react";

import Dashboard from "./pages/Dashboard";
import CreateAsset from "./pages/CreateAsset";
import Asset from "./pages/Asset";
import Marketplace from "./pages/Marketplace";
import AIAnalytics from "./pages/AIAnalytics";
import Documents from "./pages/Documents";

import "./index.css";

// ==========================================
// NETWORK CONFIGURATION
// ==========================================

const NETWORKS = {
    // Hardhat Local
    "0x7a69": {
        name: "Hardhat Local",
        status: "Local Testnet"
    },

    // BOT Chain Testnet
    "0x3c8": {
        name: "BOT Chain Testnet",
        status: "Testnet"
    }
};

// ==========================================
// APP
// ==========================================

function App() {
    const [page, setPage] = useState("dashboard");
    const [wallet, setWallet] = useState("");
    const [network, setNetwork] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [networkName, setNetworkName] = useState("Unknown Network");
    const [networkStatus, setNetworkStatus] = useState("");
    
    // UI Notification State
    const [notification, setNotification] = useState({ type: "", message: "" });

    // ==========================================
    // CONTROL WALLET CONNECTION
    // ==========================================

    const walletConnectedRef = useRef(false);

    // ==========================================
    // FORMAT WALLET
    // ==========================================

    function formatWallet(address) {
        if (!address) {
            return "";
        }
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // ==========================================
    // DETECT NETWORK
    // ==========================================

    function updateNetwork(chainId) {
        setNetwork(chainId);
        const networkInfo = NETWORKS[chainId];

        if (networkInfo) {
            setNetworkName(networkInfo.name);
            setNetworkStatus(networkInfo.status);
        } else {
            setNetworkName("Unknown Network");
            setNetworkStatus("Unsupported Network");
        }
    }

    // ==========================================
    // CONNECT WALLET
    // ==========================================

    async function connectWallet() {
        setNotification({ type: "", message: "" });

        if (!window.ethereum) {
            setNotification({
                type: "error",
                message: "MetaMask not found. Please install the MetaMask extension to continue."
            });
            return;
        }

        try {
            setConnecting(true);

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            });

            if (accounts && accounts.length > 0) {
                const account = accounts[0];

                walletConnectedRef.current = true;
                setWallet(account);

                const chainId = await window.ethereum.request({
                    method: "eth_chainId"
                });

                updateNetwork(chainId);
                setNotification({
                    type: "success",
                    message: "Wallet successfully connected!"
                });
            }
        } catch (error) {
            if (error.code === 4001) {
                setNotification({
                    type: "error",
                    message: "Wallet connection was rejected in MetaMask."
                });
            } else {
                setNotification({
                    type: "error",
                    message: "Failed to connect wallet. Please try again."
                });
            }
        } finally {
            setConnecting(false);
        }
    }

    // ==========================================
    // DISCONNECT WALLET
    // ==========================================

    function disconnectWallet() {
        walletConnectedRef.current = false;
        setWallet("");
        setPage("dashboard");
        setNotification({
            type: "info",
            message: "Wallet disconnected successfully."
        });
    }

    // ==========================================
    // ACCOUNT CHANGED
    // ==========================================

    useEffect(() => {
        if (!window.ethereum) {
            return;
        }

        function handleAccountsChanged(accounts) {
            if (!walletConnectedRef.current) {
                return;
            }

            if (!accounts || accounts.length === 0) {
                walletConnectedRef.current = false;
                setWallet("");
                setPage("dashboard");
                setNotification({
                    type: "info",
                    message: "Wallet disconnected via MetaMask."
                });
                return;
            }

            setWallet(accounts[0]);
            setNotification({
                type: "info",
                message: `Active account changed to ${formatWallet(accounts[0])}`
            });
        }

        window.ethereum.on("accountsChanged", handleAccountsChanged);

        return () => {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        };
    }, []);

    // ==========================================
    // NETWORK
    // ==========================================

    useEffect(() => {
        if (!window.ethereum) {
            return;
        }

        async function loadNetwork() {
            try {
                const chainId = await window.ethereum.request({
                    method: "eth_chainId"
                });
                updateNetwork(chainId);
            } catch (error) {
                setNotification({
                    type: "error",
                    message: "Error detecting network configuration."
                });
            }
        }

        loadNetwork();

        function handleChainChanged(chainId) {
            updateNetwork(chainId);
            window.location.reload();
        }

        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
    }, []);

    // ==========================================
    // NAVIGATION
    // ==========================================

    function navigateTo(destination) {
        setNotification({ type: "", message: "" });
        
        if (!wallet && destination !== "dashboard") {
            setNotification({
                type: "error",
                message: "Please connect your wallet to access this section."
            });
            return;
        }
        setPage(destination);
    }

    // ==========================================
    // RENDER PAGE
    // ==========================================

    function renderPage() {
        switch (page) {
            case "create":
                return <CreateAsset setPage={setPage} wallet={wallet} />;

            case "asset":
                return <Asset setPage={setPage} wallet={wallet} />;

            case "marketplace":
                return <Marketplace setPage={setPage} wallet={wallet} />;

            case "analytics":
                return <AIAnalytics setPage={setPage} wallet={wallet} />;

            case "documents":
                return <Documents setPage={setPage} wallet={wallet} />;

            case "dashboard":
            default:
                return <Dashboard setPage={setPage} wallet={wallet} />;
        }
    }

    // ==========================================
    // APP UI
    // ==========================================

    return (
        <div className="app">
            {/* ==================================
                SIDEBAR
            ================================== */}
            <aside className="sidebar">
                {/* LOGO */}
                <div className="logo">
                    <span>◈</span>
                    BOTMiner AI
                </div>

                {/* NAVIGATION */}
                <nav>
                    {/* DASHBOARD */}
                    <button
                        className={page === "dashboard" ? "active" : ""}
                        onClick={() => navigateTo("dashboard")}
                    >
                        Dashboard
                    </button>

                    {/* CREATE MINERAL */}
                    <button
                        className={page === "create" ? "active" : ""}
                        onClick={() => navigateTo("create")}
                    >
                        + New Mineral
                    </button>

                    {/* MY ASSETS */}
                    <button
                        className={page === "asset" ? "active" : ""}
                        onClick={() => navigateTo("asset")}
                    >
                        My Assets
                    </button>

                    {/* MARKETPLACE */}
                    <button
                        className={page === "marketplace" ? "active" : ""}
                        onClick={() => navigateTo("marketplace")}
                    >
                        Marketplace
                    </button>

                    {/* AI ANALYTICS */}
                    <button
                        className={page === "analytics" ? "active" : ""}
                        onClick={() => navigateTo("analytics")}
                    >
                        AI Analytics
                    </button>

                    {/* DOCUMENTS */}
                    <button
                        className={page === "documents" ? "active" : ""}
                        onClick={() => navigateTo("documents")}
                    >
                        Documents
                    </button>
                </nav>

                {/* ==================================
                    NETWORK
                ================================== */}
                <div className="network">
                    <small>NETWORK</small>
                    <strong>{networkName}</strong>
                    <span>● {networkStatus}</span>
                    {network && <small>Chain ID: {network}</small>}
                </div>

                {/* ==================================
                    CONNECTED WALLET
                ================================== */}
                {wallet && (
                    <div className="wallet-info">
                        <small>CONNECTED WALLET</small>
                        <strong>{formatWallet(wallet)}</strong>
                    </div>
                )}
            </aside>

            {/* ==================================
                MAIN
            ================================== */}
            <main className="main">
                {/* ==================================
                    HEADER
                ================================== */}
                <header className="header">
                    <div>
                        <strong>BOTMiner AI</strong>
                        <span>AI × RWA × Blockchain</span>
                    </div>

                    {/* WALLET BUTTON */}
                    {!wallet ? (
                        <button
                            className="wallet-button"
                            onClick={connectWallet}
                            disabled={connecting}
                        >
                            {connecting ? "Connecting..." : "Connect Wallet"}
                        </button>
                    ) : (
                        <div className="wallet-connected">
                            <span>{formatWallet(wallet)}</span>
                            <button
                                className="disconnect-button"
                                onClick={disconnectWallet}
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </header>

                {/* GLOBAL NOTIFICATION BANNER */}
                {notification.message && (
                    <div className={`status-message ${notification.type}`}>
                        {notification.message}
                    </div>
                )}

                {/* ==================================
                    PAGE CONTENT
                ================================== */}
                {renderPage()}
            </main>
        </div>
    );
}

export default App;