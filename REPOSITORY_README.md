# 🚀 Xian Contract Linter - VS Code Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-Insiders-blue.svg)](https://code.visualstudio.com/insiders/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)

Real-time linter for Xian smart contracts with framework-specific validation directly in VS Code.

![Xian Logo](xianlogo.png)

## ✨ Features

- **🔍 Real-time Analysis** - Lint your code as you type
- **🎯 Auto-detection** - Automatically recognizes Xian contracts
- **🛡️ Security Focused** - Catches security issues and bad practices
- **⚡ Performance Aware** - Identifies expensive operations
- **🎨 Professional UI** - Official Xian branding and clean interface
- **📱 Offline Ready** - No external dependencies required

## 🚀 Quick Start

### For Users
1. Download the latest `.vsix` file from releases
2. Run `install-extension.bat` (Windows) or install manually
3. Open any Xian contract file (`.py`)
4. See real-time feedback!

### For Developers
```bash
git clone https://github.com/xian-dev/xian-contract-linter.git
cd xian-contract-linter
npm install
npm run compile
```

## 🔍 What It Detects

### ❌ Errors (Must Fix)
- Prohibited functions (`eval`, `exec`, `open`, etc.)
- Invalid imports (system modules)
- Try/except usage (not allowed in Xian)
- Missing required functions (`@export`)

### ⚠️ Warnings (Should Fix)
- Security issues (`ctx.signer` vs `ctx.caller`)
- Naming violations (no `_` prefix)
- Missing error messages in `assert`
- Performance concerns

### 💡 Suggestions (Best Practices)
- Access control patterns
- Balance validation
- Efficient storage operations
- Proper random number usage

## 📖 Documentation

- [Installation Guide](INSTRUCTIONS.md)
- [Verification Guide](VERIFY_ENGLISH.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## 🛠️ Development

### Prerequisites
- Node.js 16+
- VS Code Insiders
- TypeScript knowledge

### Setup
```bash
npm install          # Install dependencies
npm run compile      # Compile TypeScript
npm run watch        # Watch mode for development
```

### Testing
```bash
F5                   # Launch extension in debug mode
```

### Building
```bash
npx vsce package     # Create .vsix package
```

## 🎯 Configuration

Configure via VS Code Settings:

```json
{
  "xianLinter.enabled": true,
  "xianLinter.autoDetect": true,
  "xianLinter.showSuggestions": true,
  "xianLinter.strictMode": false
}
```

## 📝 Example

```python
# ❌ This will show warnings
def _private_function():  # _ prefix not allowed
    print("Hello")        # print() not available

# ✅ This is correct
@export
def transfer(to: str, amount: float):
    assert amount > 0, "Amount must be positive"
    # ... transfer logic
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Xian blockchain team for the framework
- VS Code team for the excellent extension API
- Community contributors and testers

## 📞 Support

- 🐛 [Report Issues](https://github.com/xian-dev/xian-contract-linter/issues)
- 💬 [Discussions](https://github.com/xian-dev/xian-contract-linter/discussions)
- 📧 Contact: [your-email@example.com]

---

**Made with ❤️ for the Xian community**