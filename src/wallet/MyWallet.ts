import { Cluster, clusterApiUrl, Transaction, PublicKey, Keypair, sendAndConfirmTransaction, Connection} from '@solana/web3.js';
import EventEmitter from 'eventemitter3';

abstract class MyWalletAdapter extends EventEmitter {
  abstract get publicKey (): PublicKey | null;
  abstract get connected (): boolean;

  abstract connect (): Promise<void>;
  abstract disconnect (): Promise<void>;
  abstract signTransaction (transaction: Transaction): Promise<Transaction>;
  abstract signAllTransactions (transactions: Transaction[]): Promise<Transaction[]>;
  abstract signMessage (data: Uint8Array, display: 'hex' | 'utf8'): Promise<Uint8Array>;
}

type PromiseCallback = (...args: unknown[]) => unknown;

type MessageHandlers = {
  [id: string]: {
    resolve: PromiseCallback,
    reject: PromiseCallback
  }
}

export interface MyWalletConfig {
  network?: Cluster
}

export default class MyWallet extends EventEmitter {
  private _connection: Connection;

  private _wallet: Keypair;

  private _isConnected: boolean = false;

  constructor (config: MyWalletConfig) {
    super();
    this._connection = new Connection(clusterApiUrl('devnet'));
    this._wallet = Keypair.generate();
  }

  get publicKey () {
    return this._wallet?.publicKey || null;
  }

  get isConnected () {
    return this._isConnected;
  }

  get connected () {
    return this.isConnected;
  }

  get autoApprove () {
    return false;
  }

  async connect () {
    if (this.connected) {
      return;
    }

    this._isConnected = true;
  }

  async disconnect () {
    if (!this._wallet) {
      return;
    }

    this._isConnected = false;

    this.emit('disconnect');
  }

  async signTransaction (transaction: Transaction): Promise<Transaction> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }
    const signature = await sendAndConfirmTransaction(this._connection, transaction, [this._wallet]);
    transaction.addSignature(this.publicKey, Buffer.from(signature))
    return transaction;
  }

  async signAllTransactions (transactions: Transaction[]): Promise<Transaction[]> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }
    const txs = transactions.map((transaction)=>{
      return this.signTransaction(transaction)
    });
    return await Promise.all(txs);
  }

  async signMessage (data: Uint8Array, display: 'hex' | 'utf8' = 'utf8'): Promise<Uint8Array> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    return data;
  }

  async sign (data: Uint8Array, display: 'hex' | 'utf8' = 'utf8'): Promise<Uint8Array> {
    return await this.signMessage(data, display);
  }
}
