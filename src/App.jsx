import { useEffect, useRef, useState } from "react";

import Dashboard from "./pages/Dashboard";
import CreateAsset from "./pages/CreateAsset";
import Asset from "./pages/Asset";

import "./index.css";

function App() {
    const [page, setPage] = useState("dashboard");
    const [wallet, setWallet] = useState("");
    const [network, setNetwork] = useState("");
    const [connecting, setConnecting] = useState(false);

    // Controla se o usuário realmente clicou em Connect Wallet
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
    // CONNECT WALLET
    // ==========================================

    async function connectWallet() {
        if (!window.ethereum) {
            alert(
                "MetaMask não encontrada. Instale a extensão MetaMask para continuar."
            );

            return;
        }

        try {
            setConnecting(true);

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            });

            if (accounts && accounts.length > 0) {
                const account = accounts[0];

                // Agora sim o usuário autorizou a conexão
                walletConnectedRef.current = true;

                setWallet(account);

                console.log("Wallet conectada:", account);
            }

        } catch (error) {
            console.error(
                "Erro ao conectar carteira:",
                error
            );

            if (error.code === 4001) {
                alert(
                    "A conexão da carteira foi rejeitada no MetaMask."
                );
            } else {
                alert(
                    "Não foi possível conectar a carteira."
                );
            }

        } finally {
            setConnecting(false);
        }
    }


    // ==========================================
    // DISCONNECT WALLET
    // ==========================================

    function disconnectWallet() {
        // Impede que accountsChanged reconecte a carteira
        walletConnectedRef.current = false;

        setWallet("");

        console.log(
            "Wallet desconectada da aplicação."
        );
    }


    // ==========================================
    // ACCOUNT CHANGED
    // ==========================================

    useEffect(() => {
        if (!window.ethereum) {
            return;
        }

        function handleAccountsChanged(accounts) {

            console.log(
                "MetaMask accountsChanged:",
                accounts
            );

            /*
             * IMPORTANTE:
             *
             * Se o usuário ainda NÃO clicou em
             * Connect Wallet, ignoramos a conta.
             *
             * Isso impede que:
             *
             * 0xc2B5...
             *
             * apareça automaticamente.
             */

            if (!walletConnectedRef.current) {
                console.log(
                    "Conta ignorada: aplicação está desconectada."
                );

                return;
            }


            // MetaMask ficou sem conta
            if (
                !accounts ||
                accounts.length === 0
            ) {
                walletConnectedRef.current = false;

                setWallet("");

                return;
            }


            // Usuário trocou de conta depois de conectar
            setWallet(accounts[0]);

            console.log(
                "Wallet alterada para:",
                accounts[0]
            );
        }


        window.ethereum.on(
            "accountsChanged",
            handleAccountsChanged
        );


        return () => {
            window.ethereum.removeListener(
                "accountsChanged",
                handleAccountsChanged
            );
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
                const chainId =
                    await window.ethereum.request({
                        method: "eth_chainId"
                    });

                setNetwork(chainId);

                console.log(
                    "Chain ID:",
                    chainId
                );

            } catch (error) {
                console.error(
                    "Erro ao detectar rede:",
                    error
                );
            }
        }

        loadNetwork();


        function handleChainChanged(chainId) {
            console.log(
                "Rede alterada:",
                chainId
            );

            setNetwork(chainId);

            window.location.reload();
        }


        window.ethereum.on(
            "chainChanged",
            handleChainChanged
        );


        return () => {
            window.ethereum.removeListener(
                "chainChanged",
                handleChainChanged
            );
        };

    }, []);


    // ==========================================
    // NAVIGATION
    // ==========================================

    function navigateTo(destination) {
        setPage(destination);
    }


    // ==========================================
    // RENDER PAGE
    // ==========================================

    function renderPage() {

        switch (page) {

            case "create":
                return (
                    <CreateAsset
                        setPage={setPage}
                        wallet={wallet}
                    />
                );


            case "asset":
                return (
                    <Asset
                        setPage={setPage}
                        wallet={wallet}
                    />
                );


            case "dashboard":

            default:
                return (
                    <Dashboard
                        setPage={setPage}
                        wallet={wallet}
                    />
                );
        }
    }


    // ==========================================
    // APP
    // ==========================================

    return (
        <div className="app">

            {/* SIDEBAR */}

            <aside className="sidebar">

                {/* LOGO */}

                <div className="logo">

                    <span>
                        ◈
                    </span>

                    BOTMiner AI

                </div>


                {/* NAVIGATION */}

                <nav>

                    <button
                        className={
                            page === "dashboard"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            navigateTo("dashboard")
                        }
                    >
                        Dashboard
                    </button>


                    <button
                        className={
                            page === "create"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            navigateTo("create")
                        }
                    >
                        + New Mineral
                    </button>


                    <button
                        onClick={() =>
                            navigateTo("dashboard")
                        }
                    >
                        My Assets
                    </button>


                    <button
                        onClick={() =>
                            alert(
                                "Marketplace module coming soon."
                            )
                        }
                    >
                        Marketplace
                    </button>


                    <button
                        onClick={() =>
                            alert(
                                "AI Analytics module coming soon."
                            )
                        }
                    >
                        AI Analytics
                    </button>


                    <button
                        onClick={() =>
                            alert(
                                "Documents module coming soon."
                            )
                        }
                    >
                        Documents
                    </button>

                </nav>


                {/* NETWORK */}

                <div className="network">

                    <small>
                        NETWORK
                    </small>

                    <strong>
                        Hardhat Local
                    </strong>

                    <span>
                        ● Local Testnet
                    </span>

                    {network && (
                        <small>
                            Chain ID: {network}
                        </small>
                    )}

                </div>


                {/* CONNECTED WALLET */}

                {wallet && (

                    <div className="wallet-info">

                        <small>
                            CONNECTED WALLET
                        </small>

                        <strong>
                            {formatWallet(wallet)}
                        </strong>

                    </div>

                )}

            </aside>


            {/* MAIN */}

            <main className="main">

                {/* HEADER */}

                <header className="header">

                    <div>

                        <strong>
                            BOTMiner AI
                        </strong>

                        <span>
                            AI × RWA × Blockchain
                        </span>

                    </div>


                    {/* WALLET */}

                    {!wallet ? (

                        <button
                            className="wallet-button"
                            onClick={connectWallet}
                            disabled={connecting}
                        >

                            {connecting
                                ? "Connecting..."
                                : "Connect Wallet"
                            }

                        </button>

                    ) : (

                        <div className="wallet-connected">

                            <span>
                                {formatWallet(wallet)}
                            </span>


                            <button
                                className="disconnect-button"
                                onClick={disconnectWallet}
                            >
                                Disconnect
                            </button>

                        </div>

                    )}

                </header>


                {/* PAGE CONTENT */}

                {renderPage()}

            </main>

        </div>
    );
}


export default App;