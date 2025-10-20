(function() {
    const NETWORKS = [
        { 
            id: "base", 
            name: "Base", 
            chainId: 8453, 
            contractAddress: "0x4cA7cdA1A56bd2e9247f832BB863f92De53B16FD", 
            buttonColor: "#1a1a1a", 
            logoUrl: "img/base.jpg",
            rpcUrls: [
                "https://mainnet.base.org",
                "https://base.publicnode.com",
                "https://1rpc.io/base"
            ],
            blockExplorer: "https://basescan.org",
            currency: "ETH"
        },
        { 
            id: "celo", 
            name: "Celo", 
            chainId: 42220, 
            contractAddress: "0x316bBce718B16818434cD5E185Cec820086cf1fe", 
            buttonColor: "#35d07f", 
            logoUrl: "img/celo.logo.png",
            rpcUrls: ["https://forno.celo.org"],
            blockExplorer: "https://celoscan.io",
            currency: "CELO"
        },
        { 
            id: "optimism", 
            name: "Optimism", 
            chainId: 10, 
            contractAddress: "0x669364218144b85975218271f6001CA80d77781f",
            buttonColor: "#ff0000", 
            logoUrl: "img/optimism.svg",
            rpcUrls: [
                "https://mainnet.optimism.io",
                "https://optimism.publicnode.com",
                "https://1rpc.io/op"
            ],
            blockExplorer: "https://optimistic.etherscan.io",
            currency: "ETH"
        }
    ];

    const GM_ABI = [
        "function sayGM() external payable",
        "function getGmFee() view returns (uint256)",
        "function getUserStats(address) view returns (uint256,uint256,uint256)",
        "function getFeeInUSD() view returns (uint256)",
        "function getCeloPrice() view returns (uint256)"
    ];

    let provider = null;
    let signer = null;
    let currentNetworkId = null;

    const networksRow = document.getElementById("networksRow");
    const connectBtn = document.getElementById("connectBtn");
    const disconnectBtn = document.getElementById("disconnectBtn");

    function createProvider() {
        if (!window.ethereum) return null;
        return new ethers.providers.Web3Provider(window.ethereum);
    }

    async function updateSigner() {
        if (!provider) return;
        signer = provider.getSigner();
    }

    async function switchNetwork(network) {
        if (!window.ethereum) return false;
        
        try {
            const chainIdHex = `0x${network.chainId.toString(16)}`;
            
            console.log(`🔄 Switching to ${network.name} (${chainIdHex})`);
            
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainIdHex }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    console.log(`📝 Adding ${network.name} to wallet`);
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: chainIdHex,
                            chainName: network.name,
                            nativeCurrency: {
                                name: network.currency,
                                symbol: network.currency,
                                decimals: 18
                            },
                            rpcUrls: network.rpcUrls,
                            blockExplorerUrls: [network.blockExplorer]
                        }],
                    });
                } else {
                    throw switchError;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            
            provider = createProvider();
            await updateSigner();
            
            const networkInfo = await provider.getNetwork();
            currentNetworkId = networkInfo.chainId;
            
            console.log(`✅ Switched to ${network.name}, chainId: ${currentNetworkId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to switch to ${network.name}:`, error);
            return false;
        }
    }

    async function checkBalance(network) {
        try {
            if (!signer || currentNetworkId !== network.chainId) return;
            
            const address = await signer.getAddress();
            const balance = await provider.getBalance(address);
            const balanceEth = ethers.utils.formatEther(balance);
            
            console.log(`💰 Balance on ${network.name}: ${balanceEth} ${network.currency}`);
            
            const contract = new ethers.Contract(network.contractAddress, GM_ABI, provider);
            const fee = await contract.getGmFee();
            const feeEth = ethers.utils.formatEther(fee);
            
            console.log(`📋 GM Fee on ${network.name}: ${feeEth} ${network.currency}`);
            
            const balanceBN = ethers.BigNumber.from(balance);
            const feeBN = ethers.BigNumber.from(fee);
            
            if (balanceBN.lt(feeBN)) {
                console.log(`❌ Insufficient funds on ${network.name}: need ${feeEth} ${network.currency} but have ${balanceEth} ${network.currency}`);
                return false;
            }
            
            console.log(`✅ Sufficient funds on ${network.name}`);
            return true;
            
        } catch (error) {
            console.error(`Error checking balance on ${network.name}:`, error);
            return false;
        }
    }

    function createCards() {
        NETWORKS.forEach(net => {
            const col = document.createElement("div");
            col.className = "col-12 col-md-6 col-lg-4";
            col.innerHTML = `<div class="card" data-net="${net.id}">
                <div class="d-flex align-items-center mb-2">
                    <img src="${net.logoUrl}" width="30" height="30" class="me-2" alt="${net.name} logo">
                    <h5 class="m-0">${net.name}</h5>
                    <span class="networkIndicator badge bg-secondary ms-2">Switch Network</span>
                </div>
                <p>Chain ID: ${net.chainId}</p>
                <p>Status: <span class="statusText">—</span></p>
                <p>GM Fee: <span class="feeEth">—</span></p>
                <p>🔥 Streak: <span class="streak">—</span></p>
                <p>💬 Total GM: <span class="totalGm">—</span></p>
                <button class="switchNetworkBtn btn btn-outline-primary w-100 mb-2">Switch to ${net.name}</button>
                <button class="fetchFeeBtn btn text-white w-100 mb-2" style="background-color:${net.buttonColor}" disabled>Check Fee</button>
                <button class="sayGmBtn btn text-white w-100" style="background-color:${net.buttonColor}" disabled>Say GM ☀️</button>
                <p class="txStatus small">—</p>
            </div>`;
            networksRow.appendChild(col);
            net._dom = col;
        });
    }

    async function connectWallet() {
        if (!window.ethereum) {
            alert("Please install MetaMask or Rabby Wallet!");
            return;
        }

        try {
            provider = createProvider();
            
            const network = await provider.getNetwork();
            currentNetworkId = network.chainId;
            
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            
            connectBtn.disabled = true;
            connectBtn.textContent = "Connected";
            disconnectBtn.disabled = false;
            
            updateNetworkUI();
            enableNetworkButtons();

            window.ethereum.on('chainChanged', async (chainId) => {
                console.log(`🔗 Chain changed to: ${chainId}`);
                provider = createProvider();
                await updateSigner();
                currentNetworkId = parseInt(chainId, 16);
                updateNetworkUI();
                updateAllStats();
            });

            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    await updateSigner();
                    updateAllStats();
                }
            });

        } catch(e) {
            console.error("Connect error:", e);
            alert("Connection error: " + (e?.message || e));
        }
    }

    function enableNetworkButtons() {
        NETWORKS.forEach(net => {
            const root = net._dom;
            const switchBtn = root.querySelector(".switchNetworkBtn");
            const fetchBtn = root.querySelector(".fetchFeeBtn");
            const sayBtn = root.querySelector(".sayGmBtn");

            fetchBtn.disabled = false;
            sayBtn.disabled = false;

            if (!switchBtn._attached) {
                switchBtn.addEventListener("click", async () => {
                    switchBtn.disabled = true;
                    root.querySelector(".statusText").textContent = "Switching network...";
                    
                    const success = await switchNetwork(net);
                    if (success) {
                        root.querySelector(".statusText").textContent = "Network switched ✅";
                        updateNetworkUI();
                        updateAllStats();
                    } else {
                        root.querySelector(".statusText").textContent = "Network switch failed ❌";
                    }
                    switchBtn.disabled = false;
                });
                switchBtn._attached = true;
            }

            if (!fetchBtn._attached) {
                fetchBtn.addEventListener("click", async () => {
                    fetchBtn.disabled = true;
                    root.querySelector(".statusText").textContent = "Loading fee...";
                    try {
                        if (currentNetworkId !== net.chainId) {
                            root.querySelector(".statusText").textContent = "Switch network first!";
                            fetchBtn.disabled = false;
                            return;
                        }
                        
                        const contract = new ethers.Contract(net.contractAddress, GM_ABI, signer);
                        console.log(`💰 Fetching fee for ${net.name}...`);
                        const fee = await contract.getGmFee();
                        root.querySelector(".feeEth").textContent = ethers.utils.formatEther(fee);
                        root.querySelector(".statusText").textContent = "Fee loaded ✅";
                        console.log(`✅ ${net.name} fee:`, ethers.utils.formatEther(fee));
                    } catch (err) {
                        console.error(`❌ Fee fetch failed for ${net.name}:`, err);
                        root.querySelector(".statusText").textContent = `Error: ${err.message}`;
                        root.querySelector(".feeEth").textContent = "Error";
                    } finally {
                        fetchBtn.disabled = false;
                    }
                });
                fetchBtn._attached = true;
            }

            if (!sayBtn._attached) {
                sayBtn.addEventListener("click", async () => {
                    sayBtn.disabled = true;
                    root.querySelector(".statusText").textContent = "Checking balance...";
                    
                    try {
                        if (currentNetworkId !== net.chainId) {
                            root.querySelector(".statusText").textContent = "Switch network first!";
                            sayBtn.disabled = false;
                            return;
                        }

                        const hasFunds = await checkBalance(net);
                        if (!hasFunds) {
                            root.querySelector(".statusText").textContent = "Insufficient funds ❌";
                            root.querySelector(".txStatus").textContent = "Add more funds to your wallet";
                            sayBtn.disabled = false;
                            return;
                        }

                        root.querySelector(".statusText").textContent = "Sending GM...";
                        const contract = new ethers.Contract(net.contractAddress, GM_ABI, signer);
                        console.log(`📝 Sending GM on ${net.name}...`);
                        const fee = await contract.getGmFee();
                        console.log(`💰 Fee: ${ethers.utils.formatEther(fee)}`);
                        
                        const tx = await contract.sayGM({ value: fee });
                        root.querySelector(".txStatus").textContent = "Tx sent: " + tx.hash;
                        console.log(`📤 Tx sent: ${tx.hash}`);
                        
                        await tx.wait();
                        root.querySelector(".statusText").textContent = "GM sent ✅";
                        root.querySelector(".txStatus").textContent = "Confirmed: " + tx.hash;
                        console.log(`✅ GM confirmed on ${net.name}`);
                        
                        updateAllStats();
                    } catch (err) {
                        console.error(`❌ GM failed on ${net.name}:`, err);
                        root.querySelector(".statusText").textContent = "Tx failed ❌";
                        root.querySelector(".txStatus").textContent = `Error: ${err.message}`;
                    } finally {
                        sayBtn.disabled = false;
                    }
                });
                sayBtn._attached = true;
            }
        });
    }

    function updateNetworkUI() {
        NETWORKS.forEach(net => {
            const root = net._dom;
            const networkIndicator = root.querySelector(".networkIndicator");
            if (currentNetworkId === net.chainId) {
                networkIndicator.className = "networkIndicator badge bg-success";
                networkIndicator.textContent = "Connected";
            } else {
                networkIndicator.className = "networkIndicator badge bg-secondary";
                networkIndicator.textContent = "Switch Network";
            }
        });
    }

    function disconnectWallet() {
        signer = null;
        provider = null;
        currentNetworkId = null;
        
        connectBtn.disabled = false;
        connectBtn.textContent = "Connect Wallet";
        disconnectBtn.disabled = true;
        
        NETWORKS.forEach(net => {
            const root = net._dom;
            root.querySelector(".switchNetworkBtn").disabled = false;
            root.querySelector(".fetchFeeBtn").disabled = true;
            root.querySelector(".sayGmBtn").disabled = true;
            root.querySelector(".statusText").textContent = "—";
            root.querySelector(".feeEth").textContent = "—";
            root.querySelector(".streak").textContent = "—";
            root.querySelector(".totalGm").textContent = "—";
            root.querySelector(".txStatus").textContent = "—";
            
            const networkIndicator = root.querySelector(".networkIndicator");
            networkIndicator.className = "networkIndicator badge bg-secondary";
            networkIndicator.textContent = "Switch Network";
        });

        if (window.ethereum) {
            window.ethereum.removeAllListeners('chainChanged');
            window.ethereum.removeAllListeners('accountsChanged');
        }
    }

    async function updateAllStats() {
        if (!signer || !currentNetworkId) return;
        
        for (const net of NETWORKS) {
            const root = net._dom;
            try {
                if (currentNetworkId === net.chainId) {
                    const contract = new ethers.Contract(net.contractAddress, GM_ABI, signer);
                    const addr = await signer.getAddress();
                    const stats = await contract.getUserStats(addr);
                    root.querySelector(".streak").textContent = stats[0].toString();
                    root.querySelector(".totalGm").textContent = stats[1].toString();
                    root.querySelector(".statusText").textContent = "Stats loaded ✅";
                }
            } catch(err) {
                console.warn(`Stats update failed for ${net.name}:`, err);
                if (currentNetworkId === net.chainId) {
                    root.querySelector(".statusText").textContent = "Stats error";
                }
            }
        }
    }

    createCards();
    connectBtn.addEventListener("click", connectWallet);
    disconnectBtn.addEventListener("click", disconnectWallet);
    
    console.log("🚀 GM Hub CLEAN UI initialized");
})();