# Xian Contract Linter - VS Code Extension

Real-time linter for Xian smart contracts that provides framework-specific validation directly in your editor.

## 🚀 Features

### Linting & Analysis
- **Real-time analysis** while you write code
- **Automatic detection** of Xian contracts (files with `con_` prefix or containing specific elements)
- **Specific validation** of Xian rules and restrictions
- **No external dependencies** - everything works locally
- **Complete integration** with VS Code

### Wallet Integration & Deployment 🆕
- **🔐 Secure wallet management** - Import and store your private keys securely (encrypted in SecretStorage)
- **💰 Wallet info with native balance** - View XIAN balance directly in the extension
- **🚀 One-click deployment** - Deploy contracts directly from VS Code
- **⚙️ Network configuration** - Configure RPC and explorer URLs
- **📊 Transaction monitoring** - Track deployment status and view in explorer
- **🔒 Password protection** - Encrypted private key storage

## 🔍 What it detects

### Syntax Errors
- Prohibited functions (`eval`, `exec`, `open`, etc.)
- Disallowed imports (system modules)
- Incorrect use of `try/except`
- Invalid names with `_` prefix

### Security
- Correct usage of `ctx.caller` vs `ctx.signer`
- Balance validation before operations
- Access control with `assert`
- Imported contract verification

### Performance
- Expensive operations in loops
- Multiple storage reads
- Efficient use of crypto functions

### Best Practices
- Correct contract structure
- `@export` and `@construct` functions
- Use of `random.seed()`
- Descriptive messages in `assert`

## 📦 Installation

1. Download the `.vsix` extension file
2. In VS Code Insiders, go to Extensions (Ctrl+Shift+X)
3. Click the three dots (...) and select "Install from VSIX..."
4. Select the downloaded file

## ⚙️ Configuration

The extension can be configured from VS Code Settings:

- `xianLinter.enabled`: Enable/disable the linter
- `xianLinter.autoDetect`: Automatically detect Xian contracts
- `xianLinter.showSuggestions`: Show best practice suggestions
- `xianLinter.strictMode`: Strict mode (warnings as errors)

## 🎯 Usage

The extension works automatically:

1. Open any `.py` file
2. If it's a Xian contract, you'll see real-time indicators
3. Errors appear underlined in red
4. Warnings in yellow
5. Suggestions in blue

### Available commands

#### Linting Commands
- `Xian Linter: Analyze current file` - Analyzes the active file
- `Xian Linter: Toggle Linter` - Toggle the linter

#### Wallet & Deployment Commands 🆕
- `Xian Wallet: Import Wallet` - Import your private key to enable deployment
- `Xian Wallet: Configure RPC` - Set up network configuration
- `Xian Wallet: Show Wallet Info` - View wallet, native balance, and network information
- `Xian Wallet: Remove Wallet` - Remove wallet from extension
- `Xian Linter: Deploy Contract` - Deploy the current contract (button in tab bar)

## 🚀 Getting Started with Contract Deployment

### 1. Import Your Wallet
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run `Xian Wallet: Import Wallet`
3. Enter your 64-character private key
4. Set a secure password for encryption
5. Optionally configure RPC settings

### 2. Deploy a Contract
1. Open a Xian contract file (`.py` with `con_` prefix or containing `@export`)
2. Click the deploy button (🚀) in the tab bar, or use `Xian Linter: Deploy Contract`
3. Enter contract name (must start with `con_`)
4. Provide constructor arguments (JSON format, if needed)
5. Set stamp limit (gas limit)
6. Enter your wallet password
7. Monitor deployment progress and get transaction hash

### 3. Network Configuration
- Default: Xian mainnet (`https://node.xian.org`)
- Use `Xian Wallet: Configure RPC` to change networks
- Supports custom RPC and explorer URLs

## 🔧 Development

To compile the extension:

```bash
npm install
npm run compile
```

To create the VSIX package:

```bash
npm install -g vsce
vsce package
```

## 📝 Usage example

```python
# ❌ This will generate warnings
def _private_function():  # _ prefix not allowed
    print("Hello")        # print() not available

# ✅ This is correct
@export
def transfer(to: str, amount: float):
    assert amount > 0, "Amount must be positive"
    # ... transfer logic
```

## 🤝 Contributing

1. Fork the project
2. Create a branch for your feature
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see the LICENSE file for more details.