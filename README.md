# Xian Contract Linter - VS Code Extension

Real-time linter for Xian smart contracts that provides framework-specific validation directly in your editor.

## 🚀 Features

- **Real-time analysis** while you write code
- **Automatic detection** of Xian contracts (files with `con_` prefix or containing specific elements)
- **Specific validation** of Xian rules and restrictions
- **No external dependencies** - everything works locally
- **Complete integration** with VS Code Insiders

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

- `Xian Linter: Analyze current file` - Analyzes the active file
- `Xian Linter: Toggle Linter` - Toggle the linter

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