# Changelog

All notable changes to the Xian Contract Linter extension will be documented in this file.

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