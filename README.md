# 🌅 GM Hub Ecosystem

A multi-chain decentralized application (DApp) that allows users to send "GM" messages across multiple blockchain networks with a small fee. Built for the Base, Celo, and Optimism ecosystems.

## 🚀 Live Application

**🌐 Live Demo: [https://gm-dapp-hub-ecosystem.vercel.app/](https://gm-dapp-hub-ecosystem.vercel.app/)**

## 🚀 Features

- **Multi-Chain Support**: Connect and interact with Base, Celo, and Optimism networks
- **Dynamic Pricing**: Always pay ~$0.01 equivalent in native currency (ETH/CELO)
- **User Statistics**: Track your GM streak and total GM count
- **Wallet Integration**: Supports MetaMask, Rabby Wallet, and other EVM wallets
- **Real-time Fee Calculation**: Automatic fee adjustment based on current token prices

## 🌐 Supported Networks

| Network | Chain ID | Native Token | Contract Address |
|---------|----------|--------------|------------------|
| Base | 8453 | ETH | [0x4cA7...16FD](https://basescan.org/address/0x4cA7cdA1A56bd2e9247f832BB863f92De53B16FD) |
| Celo | 42220 | CELO | [0x316b...f1fe](https://celoscan.io/address/0x316bBce718B16818434cD5E185Cec820086cf1fe) |
| Optimism | 10 | ETH | [0x6693...781f](https://optimistic.etherscan.io/address/0x669364218144b85975218271f6001CA80d77781f) |

## 💻 How to Use

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Switch Networks**: Use the "Switch to [Network]" buttons to change chains
3. **Check Fee**: Verify the current GM fee for each network
4. **Say GM**: Click "Say GM ☀️" to send your message and maintain your streak!

## 📊 Smart Contracts

Each network has its own deployed contract with the following features:
- `sayGM()` - Send a GM message with fee
- `getGmFee()` - Get current fee amount
- `getUserStats()` - Retrieve user statistics (streak, total GM)
- Automatic fee calculation based on current ETH/USD price (Base & Optimism)
- Fixed fee with manual adjustment (Celo)

## 🔧 Technical Stack

- **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript
- **Blockchain**: Ethers.js 5.7.2
- **Smart Contracts**: Solidity 0.8.20
- **Networks**: Base, Celo, Optimism
- **Price Oracles**: Chainlink Price Feeds

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
