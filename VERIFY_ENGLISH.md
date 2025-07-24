# 🔍 Verify English Messages

## ✅ How to Test the Extension

After installing the extension, open the `ejemplo_contrato.py` file to test that all messages appear in English.

### Expected English Messages:

#### ❌ **Errors (Red underlines):**
- `"System/external module imports are not allowed in contracts"`
- `"Function "_private_function" uses "_" prefix which is not allowed"`
- `"try/except is not allowed in Xian contracts. Use if/else instead"`

#### ⚠️ **Warnings (Yellow underlines):**
- `"Assert without custom error message - include descriptive message"`
- `"print() is not available in contracts (use return or events)"`
- `"Contract must have at least one @export function"`

#### 💡 **Suggestions (Blue underlines):**
- `"Consider verifying ctx.owner with assert for access control"`
- `"Consider validating balances before arithmetic operations"`
- `"ctx.signer should only be used for security guards. Use ctx.caller for authorization"`

## 🚨 If You See Spanish Messages

If you still see messages in Spanish like:
- `"función prohibida"`
- `"no está permitido"`
- `"usar ctx.caller"`

**Solution:**
1. Run `uninstall-and-reinstall.bat`
2. Restart VS Code Insiders completely
3. Open a new Xian contract file

## ✨ Clean Installation Steps

1. **Close VS Code Insiders completely**
2. **Run `uninstall-and-reinstall.bat`**
3. **Restart VS Code Insiders**
4. **Open `ejemplo_contrato.py`**
5. **Verify all messages are in English**

## 🎯 Extension Settings

Make sure these settings are correct in VS Code:
- `xianLinter.enabled`: `true`
- `xianLinter.autoDetect`: `true`
- `xianLinter.showSuggestions`: `true`

## 📝 Test File

Use the included `ejemplo_contrato.py` file to test. It contains intentional errors that should trigger English messages.

---

**All messages should be in English! 🇺🇸**