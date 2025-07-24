@echo off
echo ========================================
echo  Xian Contract Linter - Clean Install
echo ========================================
echo.

REM Check if VS Code Insiders is installed
where code-insiders >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: VS Code Insiders not found in PATH
    echo.
    echo Please install VS Code Insiders from:
    echo https://code.visualstudio.com/insiders/
    echo.
    pause
    exit /b 1
)

echo Step 1: Uninstalling any previous version...
code-insiders --uninstall-extension xian-dev.xian-contract-linter

echo.
echo Step 2: Installing fresh version...
echo.

REM Check if VSIX file exists
if not exist "xian-contract-linter-1.0.0.vsix" (
    echo ERROR: xian-contract-linter-1.0.0.vsix file not found
    echo.
    echo Make sure this file is in the same folder as the installer.
    echo.
    pause
    exit /b 1
)

REM Install the extension
code-insiders --install-extension xian-contract-linter-1.0.0.vsix --force

if %errorlevel% equ 0 (
    echo.
    echo ✅ Extension installed successfully!
    echo.
    echo The Xian Contract Linter extension is ready to use.
    echo All messages should now be in English.
    echo.
    echo Please restart VS Code Insiders to ensure clean activation.
    echo.
    echo Features:
    echo - Real-time analysis of Xian contracts
    echo - Automatic detection of errors and warnings
    echo - Best practice suggestions
    echo - No external dependencies
    echo.
    echo Enjoy programming Xian contracts! 🚀
) else (
    echo.
    echo ❌ Error installing the extension
    echo.
    echo Try installing manually:
    echo 1. Open VS Code Insiders
    echo 2. Go to Extensions (Ctrl+Shift+X)
    echo 3. Click the three dots (...) 
    echo 4. Select "Install from VSIX..."
    echo 5. Select the xian-contract-linter-1.0.0.vsix file
)

echo.
echo IMPORTANT: Please restart VS Code Insiders after installation!
echo.
pause