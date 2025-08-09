import * as vscode from 'vscode';
import * as nacl from 'tweetnacl';

export interface WalletConfig {
    publicKey: string;
    encryptedPrivateKey: string;
    rpcUrl: string;
    explorerUrl: string;
    chainId: string;
}

export interface TransactionPayload {
    chain_id: string;
    contract: string;
    function: string;
    kwargs: any;
    stamps_supplied: number;
    nonce?: number;
    sender?: string;
}

export interface Transaction {
    payload: TransactionPayload;
    metadata: {
        signature: string;
    };
}

export class WalletManager {
    private context: vscode.ExtensionContext;
    private secretStorage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.secretStorage = context.secrets;
    }

    // Helper function for base64 decoding (atob equivalent)
    private atob(str: string): string {
        return Buffer.from(str, 'base64').toString('utf8');
    }

    // Utility functions from wallide
    private toHexString(byteArray: Uint8Array): string {
        return Array.from(byteArray, (byte) => {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
    }

    private fromHexString(hexString: string): Uint8Array {
        return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    }

    // Encrypt private key with password
    private encryptPrivateKey(privateKey: Uint8Array, password: string): string {
        const passwordBytes = new TextEncoder().encode(password);
        const nonce = nacl.randomBytes(24);
        const key = nacl.hash(passwordBytes).slice(0, 32);
        const encrypted = nacl.secretbox(privateKey, nonce, key);
        
        const combined = new Uint8Array(nonce.length + encrypted.length);
        combined.set(nonce);
        combined.set(encrypted, nonce.length);
        
        return this.toHexString(combined);
    }

    // Decrypt private key with password
    private decryptPrivateKey(encryptedHex: string, password: string, publicKey: string): Uint8Array | null {
        try {
            const combined = this.fromHexString(encryptedHex);
            const nonce = combined.slice(0, 24);
            const encrypted = combined.slice(24);
            
            const passwordBytes = new TextEncoder().encode(password);
            const key = nacl.hash(passwordBytes).slice(0, 32);
            
            const decrypted = nacl.secretbox.open(encrypted, nonce, key);
            if (!decrypted) {
                return null;
            }

            // Verify the key pair
            const keyPair = nacl.sign.keyPair.fromSeed(decrypted.slice(0, 32));
            if (this.toHexString(keyPair.publicKey) === publicKey) {
                return decrypted.slice(0, 32);
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    // Check if wallet is configured
    async isWalletConfigured(): Promise<boolean> {
        const publicKey = await this.secretStorage.get('xian.publicKey');
        const encryptedPrivateKey = await this.secretStorage.get('xian.encryptedPrivateKey');
        return !!(publicKey && encryptedPrivateKey);
    }

    // Import wallet from private key
    async importWallet(privateKeyHex: string, password: string): Promise<boolean> {
        try {
            const privateKey = this.fromHexString(privateKeyHex);
            if (privateKey.length !== 32) {
                throw new Error('Invalid private key length');
            }

            const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
            const publicKey = this.toHexString(keyPair.publicKey);
            const encryptedPrivateKey = this.encryptPrivateKey(privateKey, password);

            await this.secretStorage.store('xian.publicKey', publicKey);
            await this.secretStorage.store('xian.encryptedPrivateKey', encryptedPrivateKey);

            // Store default configuration
            await this.context.globalState.update('xian.rpcUrl', 'https://node.xian.org');
            await this.context.globalState.update('xian.explorerUrl', 'https://explorer.xian.org');

            return true;
        } catch (error) {
            console.error('Error importing wallet:', error);
            return false;
        }
    }

    // Get wallet configuration
    async getWalletConfig(): Promise<WalletConfig | null> {
        const publicKey = await this.secretStorage.get('xian.publicKey');
        const encryptedPrivateKey = await this.secretStorage.get('xian.encryptedPrivateKey');
        const rpcUrl = this.context.globalState.get<string>('xian.rpcUrl', 'https://node.xian.org');
        const explorerUrl = this.context.globalState.get<string>('xian.explorerUrl', 'https://explorer.xian.org');
        const chainId = this.context.globalState.get<string>('xian.chainId', '');

        if (!publicKey || !encryptedPrivateKey) {
            return null;
        }

        return {
            publicKey,
            encryptedPrivateKey,
            rpcUrl,
            explorerUrl,
            chainId
        };
    }

    // Update RPC configuration
    async updateRpcConfig(rpcUrl: string, explorerUrl?: string): Promise<void> {
        await this.context.globalState.update('xian.rpcUrl', rpcUrl);
        if (explorerUrl) {
            await this.context.globalState.update('xian.explorerUrl', explorerUrl);
        }

        // Fetch and update chain ID
        try {
            const chainId = await this.getChainId(rpcUrl);
            if (chainId) {
                await this.context.globalState.update('xian.chainId', chainId);
            } else {
                console.warn('Unable to fetch chain_id from RPC.');
            }
        } catch (error) {
            console.error('Error fetching chain ID:', error);
        }
    }

    // Get chain ID from RPC
    private async getChainId(rpcUrl: string): Promise<string | null> {
        try {
            const response = await (globalThis as any).fetch(`${rpcUrl}/genesis`, { headers: { 'accept': 'application/json' } });
            const data = await response.json() as any;
            return data?.result?.genesis?.chain_id ?? null;
        } catch (error) {
            console.error('Error fetching chain ID:', error);
            return null;
        }
    }

    // Remove wallet
    async removeWallet(): Promise<void> {
        await this.secretStorage.delete('xian.publicKey');
        await this.secretStorage.delete('xian.encryptedPrivateKey');
        await this.context.globalState.update('xian.chainId', undefined);
    }

    // Get nonce for transaction (aligned with wallide: /get_next_nonce/<address>)
    private async getNonce(rpcUrl: string, address: string): Promise<number> {
        try {
            const url = `${rpcUrl}/abci_query?path="/get_next_nonce/${address}"`;
            const response = await (globalThis as any).fetch(url, { headers: { 'accept': 'application/json' } });
            const data = await response.json() as any;

            const base64 = data?.result?.response?.value;
            if (!base64 || base64 === "AA==") {
                return 0;
            }

            return parseInt(this.atob(base64), 10);
        } catch (error) {
            console.error('Error fetching nonce:', error);
            return 0;
        }
    }

    // Sign transaction
    async signTransaction(transaction: Transaction, password: string): Promise<Transaction | null> {
        try {
            const config = await this.getWalletConfig();
            if (!config) {
                throw new Error('Wallet not configured');
            }

            const privateKey = this.decryptPrivateKey(config.encryptedPrivateKey, password, config.publicKey);
            if (!privateKey) {
                throw new Error('Invalid password');
            }

            // Get nonce and set sender
            const nonce = await this.getNonce(config.rpcUrl, config.publicKey);
            transaction.payload.nonce = nonce;
            transaction.payload.sender = config.publicKey;
            transaction.payload.chain_id = config.chainId;

            // Sort payload keys for deterministic signature
            const orderedPayload: any = {};
            Object.keys(transaction.payload).sort().forEach(key => {
                orderedPayload[key] = (transaction.payload as any)[key];
            });

            const serializedTransaction = JSON.stringify(orderedPayload);
            const transactionBytes = new TextEncoder().encode(serializedTransaction);

            // Create combined key for signing
            const combinedKey = new Uint8Array(64);
            combinedKey.set(privateKey);
            combinedKey.set(this.fromHexString(config.publicKey), 32);

            // Sign transaction
            const signature = nacl.sign.detached(transactionBytes, combinedKey);
            
            transaction.payload = orderedPayload;
            transaction.metadata.signature = this.toHexString(signature);

            return transaction;
        } catch (error) {
            console.error('Error signing transaction:', error);
            return null;
        }
    }

    // Broadcast transaction
    async broadcastTransaction(signedTransaction: Transaction, rpcUrl: string): Promise<any> {
        try {
            const serialized = JSON.stringify(signedTransaction);
            const transactionHex = this.toHexString(new TextEncoder().encode(serialized));

            const response = await (globalThis as any).fetch(`${rpcUrl}/broadcast_tx_sync?tx="${transactionHex}"`, { headers: { 'accept': 'application/json' } });

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON RPC response:', text.slice(0, 300));
                throw new Error('RPC did not return JSON. Check RPC URL or network.');
            }

            const responseData = await response.json() as any;
            return responseData;
        } catch (error) {
            console.error('Error broadcasting transaction:', error);
            throw error;
        }
    }

    // Get native Xian balance using state variable currency.balances:<address>
    async getNativeBalance(address: string): Promise<number> {
        try {
            const config = await this.getWalletConfig();
            if (!config) return 0;
            const url = `${config.rpcUrl}/abci_query?path="/get/currency.balances:${address}"`;
            const res = await (globalThis as any).fetch(url, { headers: { 'accept': 'application/json' } });
            const data = await res.json() as any;
            const base64 = data?.result?.response?.value;
            if (!base64 || base64 === 'AA==') return 0;
            const decoded = this.atob(base64);
            const num = parseFloat(decoded);
            return isNaN(num) ? 0 : num;
        } catch (e) {
            console.error('Error fetching native balance:', e);
            return 0;
        }
    }
}
