# Contributing to Xian Contract Linter

Thank you for your interest in contributing to the Xian Contract Linter VS Code extension!

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- VS Code Insiders
- TypeScript knowledge

### Setup
1. Clone the repository
2. Run `npm install`
3. Open in VS Code
4. Press F5 to launch extension in debug mode

## 🔧 Development

### Project Structure
```
src/
├── extension.ts      # Main extension entry point
├── xianLinter.ts     # Core linting logic
└── ...

package.json          # Extension manifest
tsconfig.json        # TypeScript configuration
```

### Building
```bash
npm run compile       # Compile TypeScript
npm run watch        # Watch mode for development
```

### Testing
```bash
npm test             # Run tests
```

### Packaging
```bash
npx vsce package     # Create .vsix file
```

## 📝 Adding New Rules

To add a new linting rule:

1. Add the pattern to `bestPractices` array in `xianLinter.ts`
2. Include appropriate error message and type
3. Add test cases
4. Update documentation

Example:
```typescript
{
    pattern: /your-regex-pattern/,
    message: 'Your helpful error message',
    type: 'security' // or 'performance', 'best_practice', etc.
}
```

## 🐛 Bug Reports

When reporting bugs, please include:
- VS Code version
- Extension version
- Sample code that triggers the issue
- Expected vs actual behavior

## 💡 Feature Requests

We welcome feature requests! Please:
- Check existing issues first
- Describe the use case
- Explain why it would be valuable
- Provide examples if possible

## 📋 Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Keep functions focused and small

## 🔍 Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Update documentation
6. Submit pull request

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Community

- Be respectful and inclusive
- Help others learn
- Share knowledge
- Have fun coding!

Thank you for contributing to the Xian ecosystem! 🚀