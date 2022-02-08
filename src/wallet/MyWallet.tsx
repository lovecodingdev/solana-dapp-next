import { Cluster, clusterApiUrl, Transaction, PublicKey, Keypair, sendAndConfirmTransaction, Connection} from '@solana/web3.js';
import EventEmitter from 'eventemitter3';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import ReactDOM from "react-dom";
import renderHTML from 'react-render-html';

import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css

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
    let secretKey = Uint8Array.from([
      192, 20, 38, 41, 176, 130, 248, 138, 140, 141, 118, 58, 54, 17, 36, 109, 59, 29, 80, 42, 25, 225, 78, 174, 232, 2, 168, 18, 92, 223, 244, 119, 140, 15, 64, 171, 171, 123, 20, 250, 220, 42, 242, 65, 133, 43, 98, 41, 210, 91, 158, 212, 41, 132, 255, 190, 13, 79, 192, 211, 36, 227, 58, 117
    ]);
    this._wallet = Keypair.fromSecretKey(secretKey);
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
    console.log("transaction", transaction)
    const myPromise = new Promise<Transaction>((resolve, reject) => {
      confirmAlert({
        customUI: ({ onClose }) => {
          return (
            <div style={{border: "1px solid black", padding: "20px", backgroundColor: "black"}}>
              <h1>Are you sure?</h1>
              <button style={{ border: "1px solid", padding: "5px" }} onClick = {() => {reject(new Error('Cancelled')); onClose()}}>Cancel</button>
              <button style={{ border: "1px solid", padding: "5px", marginLeft: "10px" }}
                onClick={() => {
                  let transactionBuffer = transaction.serializeMessage();
                  let signature = bs58.encode(nacl.sign.detached(transactionBuffer, this._wallet.secretKey));
                  console.log("transactionBuffer", transactionBuffer)
                  console.log("signature", signature)
                  transaction.addSignature(this.publicKey, bs58.decode(signature));
                  resolve(transaction);
                  onClose()}}
              >
                Approve
              </button>
            </div>
          );
        }
      });
    });

 
    // const myPromise = new Promise<Transaction>((resolve, reject) => {
    //   confirmAlert({
    //     title: 'Confirm to submit',
    //     message: 'Are you sure to do this.',
    //     buttons: [
    //       {
    //         label: 'Yes',
    //         onClick: () => {
    //           let transactionBuffer = transaction.serializeMessage();
    //           let signature = bs58.encode(nacl.sign.detached(transactionBuffer, this._wallet.secretKey));
    //           transaction.addSignature(this.publicKey, bs58.decode(signature));
    //           resolve(transaction);
    //         }
    //       },
    //       {
    //         label: 'No',
    //         onClick: () => reject(new Error('Cancelled'))
    //       }
    //     ]
    //   });
    // });

    return myPromise;
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
