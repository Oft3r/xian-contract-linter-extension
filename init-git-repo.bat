@echo off
echo ========================================
echo  Initialize Git Repository
echo ========================================
echo.

echo Initializing Git repository...
git init

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: Xian Contract Linter VS Code Extension v1.0.0

Features:
- Real-time linting for Xian smart contracts
- Automatic detection of contract files
- Framework-specific validation rules
- Security and performance checks
- Professional UI with Xian branding
- Complete English interface
- Offline functionality
- Cross-platform compatibility

Includes:
- Extension source code (TypeScript)
- Installation scripts
- Documentation
- Example contract
- Development configuration"

echo.
echo ✅ Git repository initialized successfully!
echo.
echo Next steps:
echo 1. Create a repository on GitHub
echo 2. Add remote: git remote add origin [your-repo-url]
echo 3. Push: git push -u origin main
echo.
pause