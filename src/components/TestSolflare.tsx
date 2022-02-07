import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, TransactionSignature, Connection } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import Solflare from '@solflare-wallet/sdk';

export const TestSolflare: FC = () => {
    const wallet = new Solflare({});
    const {connection} = useConnection();

    wallet.on('connect', () => console.log('connected', wallet.publicKey.toString()));
    wallet.on('disconnect', () => console.log('disconnected'));
    
    const onClick = useCallback(async () => {
        try {
            console.log("start")
            await wallet.connect();
            console.log("connected")

            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: Keypair.generate().publicKey,
                    lamports: 1,
                })
            );
            tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
            tx.feePayer = wallet.publicKey;
            const transaction = await wallet.signTransaction(tx);
            console.log("signed Transaction")
          
            const transactions = await wallet.signAllTransactions([ new Transaction(), new Transaction() ]);
          
            const encoder = new TextEncoder();
            const messageBytes = encoder.encode('Test message');
            const messageSignature = await wallet.signMessage(messageBytes, 'utf8');
          
            await wallet.disconnect();
          } catch (err) {
            console.log(err);
          }          
    }, [wallet]);

    return (
        <div>
            <button
                className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={onClick}
            >
                <span>Test Solflare </span>
            </button>
        </div>
    );
};

