import * as vscode from 'vscode';
import { WalletManager } from './walletManager';

export class WalletCommands {
    private walletManager: WalletManager;

    constructor(walletManager: WalletManager) {
        this.walletManager = walletManager;
    }

    // Register all wallet-related commands
    registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        const commands = [
            vscode.commands.registerCommand('xianLinter.importWallet', () => this.importWallet()),
            vscode.commands.registerCommand('xianLinter.configureRpc', () => this.configureRpc()),
            vscode.commands.registerCommand('xianLinter.showWalletInfo', () => this.showWalletInfo()),
            vscode.commands.registerCommand('xianLinter.removeWallet', () => this.removeWallet()),
        ];

        return commands;
    }

    // Import wallet from private key
    private async importWallet(): Promise<void> {
        try {
            // Check if wallet already exists
            const isConfigured = await this.walletManager.isWalletConfigured();
            if (isConfigured) {
                const overwrite = await vscode.window.showWarningMessage(
                    'A wallet is already configured. Do you want to replace it?',
                    'Yes', 'No'
                );
                if (overwrite !== 'Yes') {
                    return;
                }
            }

            // Get private key
            const privateKey = await vscode.window.showInputBox({
                prompt: 'Enter your private key (64 character hex string)',
                password: true,
                validateInput: (value) => {
                    if (!value) {
                        return 'Private key is required';
                    }
                    if (!/^[0-9a-fA-F]{64}$/.test(value)) {
                        return 'Private key must be a 64 character hex string';
                    }
                    return null;
                }
            });

            if (!privateKey) {
                return;
            }

            // Get password for encryption
            const password = await vscode.window.showInputBox({
                prompt: 'Enter a password to encrypt your private key',
                password: true,
                validateInput: (value) => {
                    if (!value) {
                        return 'Password is required';
                    }
                    if (value.length < 8) {
                        return 'Password must be at least 8 characters';
                    }
                    return null;
                }
            });

            if (!password) {
                return;
            }

            // Confirm password
            const confirmPassword = await vscode.window.showInputBox({
                prompt: 'Confirm your password',
                password: true,
                validateInput: (value) => {
                    if (value !== password) {
                        return 'Passwords do not match';
                    }
                    return null;
                }
            });

            if (!confirmPassword) {
                return;
            }

            // Import wallet
            const success = await this.walletManager.importWallet(privateKey, password);
            if (success) {
                vscode.window.showInformationMessage('✅ Wallet imported successfully!');
                
                // Optionally configure RPC
                const configureRpc = await vscode.window.showInformationMessage(
                    'Would you like to configure RPC settings now?',
                    'Yes', 'Later'
                );
                if (configureRpc === 'Yes') {
                    await this.configureRpc();
                }
            } else {
                vscode.window.showErrorMessage('❌ Failed to import wallet. Please check your private key.');
            }
        } catch (error) {
            console.error('Error importing wallet:', error);
            vscode.window.showErrorMessage('❌ Error importing wallet: ' + (error as Error).message);
        }
    }

    // Configure RPC settings
    private async configureRpc(): Promise<void> {
        try {
            const config = await this.walletManager.getWalletConfig();
            const currentRpc = config?.rpcUrl || 'https://node.xian.org';
            const currentExplorer = config?.explorerUrl || 'https://explorer.xian.org';

            // Get RPC URL
            const rpcUrl = await vscode.window.showInputBox({
                prompt: 'Enter RPC URL',
                value: currentRpc,
                validateInput: (value) => {
                    if (!value) {
                        return 'RPC URL is required';
                    }
                    try {
                        new URL(value);
                        return null;
                    } catch {
                        return 'Please enter a valid URL';
                    }
                }
            });

            if (!rpcUrl) {
                return;
            }

            // Get Explorer URL
            const explorerUrl = await vscode.window.showInputBox({
                prompt: 'Enter Explorer URL',
                value: currentExplorer,
                validateInput: (value) => {
                    if (!value) {
                        return 'Explorer URL is required';
                    }
                    try {
                        new URL(value);
                        return null;
                    } catch {
                        return 'Please enter a valid URL';
                    }
                }
            });

            if (!explorerUrl) {
                return;
            }

            // Update configuration
            await this.walletManager.updateRpcConfig(rpcUrl, explorerUrl);
            vscode.window.showInformationMessage('✅ RPC configuration updated successfully!');

        } catch (error) {
            console.error('Error configuring RPC:', error);
            vscode.window.showErrorMessage('❌ Error configuring RPC: ' + (error as Error).message);
        }
    }

    // Show wallet information
    private async showWalletInfo(): Promise<void> {
        try {
            const config = await this.walletManager.getWalletConfig();
            if (!config) {
                vscode.window.showInformationMessage('No wallet configured. Use "Import Wallet" to get started.');
                return;
            }

            // Fetch balance
            const balance = await this.walletManager.getNativeBalance(config.publicKey);

            const info = [
                `**Wallet Information**`,
                ``,
                `**Address:** ${config.publicKey}`,
                `**Balance (XIAN):** ${balance}`,
                `**RPC URL:** ${config.rpcUrl}`,
                `**Explorer URL:** ${config.explorerUrl}`,
                `**Chain ID:** ${config.chainId || 'Not fetched'}`,
                ``,
                `**Available Commands:**`,
                `- Deploy Contract: Deploy the current contract file`,
                `- Configure RPC: Change network settings`,
                `- Remove Wallet: Remove wallet from extension`
            ].join('\n');

            const action = await vscode.window.showInformationMessage(
                'Wallet is configured and ready to use!',
                'View Details', 'Configure RPC', 'Remove Wallet'
            );

            switch (action) {
                case 'View Details':
                    const panel = vscode.window.createWebviewPanel(
                        'walletInfo',
                        'Xian Wallet Info',
                        vscode.ViewColumn.One,
                        {}
                    );
                    panel.webview.html = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Wallet Info</title>
                            <style>
                                body { font-family: var(--vscode-font-family); padding: 20px; }
                                .info-item { margin: 10px 0; }
                                .address { font-family: monospace; word-break: break-all; }
                                .section { margin: 20px 0; }
                            </style>
                        </head>
                        <body>
                            <h1>🔐 Xian Wallet Information</h1>
                            <div class="section">
                                <div class="info-item"><strong>Address:</strong></div>
                                <div class="address">${config.publicKey}</div>
                            </div>
                            <div class="section">
                                <div class="info-item"><strong>Balance (XIAN):</strong> ${balance}</div>
                                <div class="info-item"><strong>RPC URL:</strong> ${config.rpcUrl}</div>
                                <div class="info-item"><strong>Explorer URL:</strong> ${config.explorerUrl}</div>
                                <div class="info-item"><strong>Chain ID:</strong> ${config.chainId || 'Not fetched'}</div>
                            </div>
                            <div class="section">
                                <h3>Available Commands</h3>
                                <ul>
                                    <li><strong>Deploy Contract:</strong> Deploy the current contract file to the network</li>
                                    <li><strong>Configure RPC:</strong> Change network settings</li>
                                    <li><strong>Remove Wallet:</strong> Remove wallet from extension</li>
                                </ul>
                            </div>
                        </body>
                        </html>
                    `;
                    break;
                case 'Configure RPC':
                    await this.configureRpc();
                    break;
                case 'Remove Wallet':
                    await this.removeWallet();
                    break;
            }

        } catch (error) {
            console.error('Error showing wallet info:', error);
            vscode.window.showErrorMessage('❌ Error retrieving wallet information: ' + (error as Error).message);
        }
    }

    // Remove wallet
    private async removeWallet(): Promise<void> {
        try {
            const confirm = await vscode.window.showWarningMessage(
                '⚠️ Are you sure you want to remove the wallet? This action cannot be undone.',
                'Remove', 'Cancel'
            );

            if (confirm === 'Remove') {
                await this.walletManager.removeWallet();
                vscode.window.showInformationMessage('✅ Wallet removed successfully!');
            }
        } catch (error) {
            console.error('Error removing wallet:', error);
            vscode.window.showErrorMessage('❌ Error removing wallet: ' + (error as Error).message);
        }
    }

    // Check if wallet is ready for deployment
    async isWalletReady(): Promise<boolean> {
        const config = await this.walletManager.getWalletConfig();
        return !!(config && config.chainId);
    }

    // Get wallet manager instance
    getWalletManager(): WalletManager {
        return this.walletManager;
    }
}
