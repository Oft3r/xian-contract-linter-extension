# Changelog

All notable changes to the Xian Contract Linter extension will be documented in this file.

## [1.2.0] - 2025-08-09

### Added
- Wallet Info now shows native balance (XIAN) fetched from `currency.balances:<address>`

### Changed
- Nonce retrieval aligned with wallide using `/get_next_nonce/<address>`
- RPC calls include `Accept: application/json` and better error messages when RPC returns HTML
- Placeholder wallet commands registered when crypto deps are unavailable (linter remains functional)

### Fixed
- Avoid base64 decoding when ABCI value is `AA==` or empty

## [1.1.0] - 2025-07-24

### Added
- **Enhanced Builtin Detection**: Added detection for prohibited Python builtins
  - `float()` - Suggests using `value + 0.0` for ContractingDecimal conversion
  - `int()` - Suggests using `value // 1` for integer conversion
  - `str()` - Suggests using `"" + value` for string conversion
  - `bool()` - Suggests using explicit comparisons
  - `len()` - Suggests using object-specific methods
  - `type()` - Marked as prohibited builtin
  - `isinstance()` - Suggests using explicit comparisons

### Improved
- **Error Classification**: Builtin violations now classified as `syntax_error` (higher severity)
- **Fix Suggestions**: Specific replacement suggestions for each prohibited builtin
- **Pattern Matching**: Enhanced regex patterns for better detection accuracy
- **User Experience**: More actionable error messages with concrete solutions

### Fixed
- Better handling of ContractingDecimal type conversion issues
- Improved error categorization for VS Code diagnostics

## [1.0.0] - 2025-07-24

### Added
- Initial release of Xian Contract Linter VS Code extension
- Real-time linting for Xian smart contracts
- Automatic detection of Xian contract files
- Framework-specific validation rules
- Support for the following validations:
  - Prohibited functions (`eval`, `exec`, `print`, etc.)
  - Invalid imports (system modules)
  - Incorrect naming conventions (no `_` prefix)
  - Security issues (`ctx.signer` vs `ctx.caller`)
  - Performance problems (expensive operations in loops)
  - Missing `@export` and `@construct` functions
  - Try/except usage validation
- Configuration options:
  - `xianLinter.enabled` - Enable/disable linter
  - `xianLinter.autoDetect` - Auto-detect Xian contracts
  - `xianLinter.showSuggestions` - Show best practices
  - `xianLinter.strictMode` - Treat warnings as errors
- Official Xian logo as extension icon
- Complete English interface
- Offline functionality (no external dependencies)
- Cross-platform compatibility
- Professional installation scripts
- Comprehensive documentation

### Features
- **Error Detection**: Critical issues that must be fixed
- **Warning System**: Potential problems and security concerns
- **Suggestions**: Best practice recommendations
- **Real-time Feedback**: Immediate validation while coding
- **Auto-detection**: Automatically recognizes Xian contracts
- **Configurable**: Customizable behavior via VS Code settings

### Documentation
- Complete installation guide
- Usage instructions
- Troubleshooting guide
- Contributing guidelines
- Example contract for testing

### Technical
- Built with TypeScript
- Uses VS Code Extension API
- AST-based code analysis
- Pattern matching for rule validation
- Diagnostic collection for VS Code integration