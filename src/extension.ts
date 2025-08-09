import * as vscode from 'vscode';
import { XianLinter } from './xianLinter';

let linter: XianLinter;
let diagnosticCollection: vscode.DiagnosticCollection;
let walletManager: any = null;
let walletCommands: any = null;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Xian Contract Linter activated');

    // Crear colección de diagnósticos
    diagnosticCollection = vscode.languages.createDiagnosticCollection('xian-linter');
    context.subscriptions.push(diagnosticCollection);

    // Inicializar linter
    linter = new XianLinter();

    // Inicializar wallet (carga diferida y tolerante a fallos)
    try {
        const { WalletManager } = await import('./walletManager');
        const { WalletCommands } = await import('./walletCommands');
        walletManager = new WalletManager(context);
        walletCommands = new WalletCommands(walletManager);
    } catch (e) {
        console.warn('Wallet features disabled (dependency missing):', e);
    }

    // Comando para analizar archivo actual
    const lintCommand = vscode.commands.registerCommand('xianLinter.lintCurrentFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            lintDocument(editor.document);
        }
    });

    // Comando para toggle del linter
    const toggleCommand = vscode.commands.registerCommand('xianLinter.toggleLinter', () => {
        const config = vscode.workspace.getConfiguration('xianLinter');
        const enabled = config.get<boolean>('enabled', true);
        config.update('enabled', !enabled, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Xian Linter ${!enabled ? 'enabled' : 'disabled'}`);
    });

    // Comando para deploy del contrato
    const deployCommand = vscode.commands.registerCommand('xianLinter.deployContract', async () => {
        await deployContract();
    });

    // Eventos de documentos
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(lintDocument);
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'python') {
            // Debounce para evitar análisis excesivo
            setTimeout(() => lintDocument(event.document), 500);
        }
    });
    const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(lintDocument);

    // Registrar comandos de wallet (si están disponibles). Si no, registrar placeholders.
    let walletCommandsDisposables: vscode.Disposable[] = [];
    if (walletCommands) {
        walletCommandsDisposables = walletCommands.registerCommands(context);
    } else {
        walletCommandsDisposables = [
            vscode.commands.registerCommand('xianLinter.importWallet', () => vscode.window.showWarningMessage('Wallet features are not available in this environment.')),
            vscode.commands.registerCommand('xianLinter.configureRpc', () => vscode.window.showWarningMessage('Wallet features are not available in this environment.')),
            vscode.commands.registerCommand('xianLinter.showWalletInfo', () => vscode.window.showWarningMessage('Wallet features are not available in this environment.')),
            vscode.commands.registerCommand('xianLinter.removeWallet', () => vscode.window.showWarningMessage('Wallet features are not available in this environment.')),
        ];
    }

    // Registrar suscripciones
    context.subscriptions.push(
        lintCommand,
        toggleCommand,
        deployCommand,
        ...walletCommandsDisposables,
        onDidOpenTextDocument,
        onDidChangeTextDocument,
        onDidSaveTextDocument
    );

    // Analizar documentos ya abiertos
    vscode.workspace.textDocuments.forEach(lintDocument);
}

function lintDocument(document: vscode.TextDocument) {
    const config = vscode.workspace.getConfiguration('xianLinter');
    
    if (!config.get<boolean>('enabled', true)) {
        return;
    }

    if (document.languageId !== 'python') {
        return;
    }

    // Auto-detectar contratos Xian
    const autoDetect = config.get<boolean>('autoDetect', true);
    const fileName = document.fileName.toLowerCase();
    const isXianContract = fileName.includes('con_') || 
                          document.getText().includes('@export') ||
                          document.getText().includes('Variable(') ||
                          document.getText().includes('Hash(');

    if (autoDetect && !isXianContract) {
        // Limpiar diagnósticos si no es un contrato Xian
        diagnosticCollection.delete(document.uri);
        return;
    }

    try {
        const results = linter.lintCode(document.getText(), document.fileName);
        const diagnostics = convertToDiagnostics(results, config);
        diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
        console.error('Error in Xian Linter:', error);
    }
}

function convertToDiagnostics(results: any, config: vscode.WorkspaceConfiguration): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const strictMode = config.get<boolean>('strictMode', false);
    const showSuggestions = config.get<boolean>('showSuggestions', true);

    // Errores de sintaxis
    results.syntax_errors?.forEach((error: any) => {
        const line = Math.max(0, (error.line || 1) - 1);
        const range = new vscode.Range(line, error.column || 0, line, (error.column || 0) + 10);
        
        const diagnostic = new vscode.Diagnostic(
            range,
            error.message,
            vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = 'Xian Linter';
        diagnostic.code = 'syntax-error';
        diagnostics.push(diagnostic);
    });

    // Advertencias
    results.warnings?.forEach((warning: any) => {
        const line = Math.max(0, (warning.line || 1) - 1);
        const range = new vscode.Range(line, 0, line, 1000);
        
        const severity = strictMode ? vscode.DiagnosticSeverity.Error : 
                        getSeverityByType(warning.type);
        
        const diagnostic = new vscode.Diagnostic(
            range,
            warning.message,
            severity
        );
        diagnostic.source = 'Xian Linter';
        diagnostic.code = warning.type || 'warning';
        diagnostics.push(diagnostic);
    });

    // Sugerencias
    if (showSuggestions) {
        results.suggestions?.forEach((suggestion: any) => {
            const line = Math.max(0, (suggestion.line || 1) - 1);
            const range = new vscode.Range(line, 0, line, 1000);
            
            const diagnostic = new vscode.Diagnostic(
                range,
                suggestion.message,
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.source = 'Xian Linter';
            diagnostic.code = suggestion.type || 'suggestion';
            diagnostics.push(diagnostic);
        });
    }

    return diagnostics;
}

function getSeverityByType(type: string): vscode.DiagnosticSeverity {
    switch (type) {
        case 'security':
        case 'syntax_error':
        case 'error':
            return vscode.DiagnosticSeverity.Error;
        case 'naming_error':
        case 'performance':
            return vscode.DiagnosticSeverity.Warning;
        case 'best_practice':
        case 'xsc_compliance':
        case 'fix_suggestion':
        default:
            return vscode.DiagnosticSeverity.Information;
    }
}

async function deployContract() {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file to deploy.');
            return;
        }

        // Check if it's a Xian contract
        const fileName = editor.document.fileName.toLowerCase();
        const contractCode = editor.document.getText();
        const isXianContract = fileName.includes('con_') ||
                              contractCode.includes('@export') ||
                              contractCode.includes('Variable(') ||
                              contractCode.includes('Hash(');

        if (!isXianContract) {
            vscode.window.showWarningMessage('This file does not appear to be a Xian contract.');
            return;
        }

        // Check if wallet is configured
        if (!walletCommands || !walletManager) {
            vscode.window.showWarningMessage('Wallet features are not available. Install dependencies to enable deployment.');
            return;
        }

        const isWalletReady = await walletCommands.isWalletReady();
        if (!isWalletReady) {
            const action = await vscode.window.showWarningMessage(
                'Wallet not configured. Please import your wallet first.',
                'Import Wallet', 'Cancel'
            );
            if (action === 'Import Wallet') {
                await vscode.commands.executeCommand('xianLinter.importWallet');
            }
            return;
        }

        // Get contract name
        const contractName = await vscode.window.showInputBox({
            prompt: 'Enter contract name (must start with "con_")',
            validateInput: (value) => {
                if (!value) {
                    return 'Contract name is required';
                }
                if (!value.startsWith('con_')) {
                    return 'Contract name must start with "con_"';
                }
                if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    return 'Contract name can only contain letters, numbers, and underscores';
                }
                return null;
            }
        });

        if (!contractName) {
            return;
        }

        // Get constructor arguments (optional)
        const constructorArgs = await vscode.window.showInputBox({
            prompt: 'Constructor arguments (JSON format, leave empty if none)',
            placeHolder: '{"arg1": "value1", "arg2": 123}',
            validateInput: (value) => {
                if (!value) {
                    return null; // Empty is valid
                }
                try {
                    JSON.parse(value);
                    return null;
                } catch {
                    return 'Invalid JSON format';
                }
            }
        });

        // Get stamp limit
        const stampLimit = await vscode.window.showInputBox({
            prompt: 'Stamp limit (gas limit)',
            value: '800',
            validateInput: (value) => {
                if (!value) {
                    return 'Stamp limit is required';
                }
                const num = parseInt(value);
                if (isNaN(num) || num <= 0) {
                    return 'Stamp limit must be a positive number';
                }
                return null;
            }
        });

        if (!stampLimit) {
            return;
        }

        // Get password for signing
        const password = await vscode.window.showInputBox({
            prompt: 'Enter your wallet password to sign the transaction',
            password: true,
            validateInput: (value) => {
                if (!value) {
                    return 'Password is required';
                }
                return null;
            }
        });

        if (!password) {
            return;
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Deploying Contract',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Preparing transaction...' });

            // Create transaction
            const transaction = {
                payload: {
                    chain_id: '', // Will be set by wallet manager
                    contract: 'submission',
                    function: 'submit_contract',
                    kwargs: {
                        name: contractName,
                        code: contractCode,
                        ...(constructorArgs ? { constructor_args: JSON.parse(constructorArgs) } : {})
                    },
                    stamps_supplied: parseInt(stampLimit)
                },
                metadata: {
                    signature: ''
                }
            };

            progress.report({ increment: 30, message: 'Signing transaction...' });

            // Sign transaction
            const signedTx = await walletManager.signTransaction(transaction, password);
            if (!signedTx) {
                throw new Error('Failed to sign transaction. Please check your password.');
            }

            progress.report({ increment: 60, message: 'Broadcasting transaction...' });

            // Broadcast transaction
            const config = await walletManager.getWalletConfig();
            if (!config) {
                throw new Error('Wallet configuration not found');
            }

            const response = await walletManager.broadcastTransaction(signedTx, config.rpcUrl);

            progress.report({ increment: 100, message: 'Transaction sent!' });

            // Handle response
            if (response.result.code === 0) {
                const hash = response.result.hash;
                const explorerUrl = `${config.explorerUrl}/tx/${hash}`;

                const action = await vscode.window.showInformationMessage(
                    `✅ Contract deployed successfully! Hash: ${hash}`,
                    'View in Explorer', 'Copy Hash'
                );

                if (action === 'View in Explorer') {
                    vscode.env.openExternal(vscode.Uri.parse(explorerUrl));
                } else if (action === 'Copy Hash') {
                    vscode.env.clipboard.writeText(hash);
                    vscode.window.showInformationMessage('Hash copied to clipboard!');
                }
            } else {
                throw new Error(response.result.log || 'Transaction failed');
            }
        });

    } catch (error) {
        console.error('Error deploying contract:', error);
        vscode.window.showErrorMessage('❌ Deployment failed: ' + (error as Error).message);
    }
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}