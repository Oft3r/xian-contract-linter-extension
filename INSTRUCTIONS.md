# 🚀 Xian Contract Linter - VS Code Extension

## 📦 Quick Installation

### Option 1: Automatic Installation (Recommended)
1. Download all extension files
2. Run `install-extension.bat`
3. Done! The extension will install automatically

### Option 2: Manual Installation
1. Open VS Code Insiders
2. Go to Extensions (Ctrl+Shift+X)
3. Click the three dots (...) at the top
4. Select "Install from VSIX..."
5. Select the `xian-contract-linter-1.0.0.vsix` file

## ✨ What does the extension do?

This extension analyzes your Xian contract code **in real-time** and shows you:

- ❌ **Errors** (red lines): Issues you must fix
- ⚠️ **Warnings** (yellow lines): Things that could cause problems
- 💡 **Suggestions** (blue lines): Recommended best practices

## 🎯 Works automatically

The extension activates automatically when:
- You open `.py` files
- The file contains Xian contract code (detects `@export`, `Variable()`, etc.)
- The filename starts with `con_`

## 🔧 Configuration

You can configure the extension from VS Code Settings:

- **Enable/Disable**: `xianLinter.enabled`
- **Auto-detection**: `xianLinter.autoDetect`
- **Show suggestions**: `xianLinter.showSuggestions`
- **Strict mode**: `xianLinter.strictMode`

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

## 🆘 Troubleshooting

### Extension doesn't activate
- Verify the file is `.py`
- Make sure it contains Xian contract code
- Check that `xianLinter.enabled` is set to `true`

### I don't see warnings
- Verify that `xianLinter.showSuggestions` is enabled
- Check the `xianLinter.autoDetect` configuration

### I see messages in Spanish instead of English
- You might have an old version installed
- Use `uninstall-and-reinstall.bat` for a clean installation
- Restart VS Code Insiders after installation

### I want to temporarily disable
- Use the command: `Xian Linter: Toggle Linter`
- Or change `xianLinter.enabled` to `false`

## 🎉 Ready to use!

Once installed, the extension works completely **offline** and **without dependencies**. 

Enjoy programming safer and more efficient Xian contracts! 🚀