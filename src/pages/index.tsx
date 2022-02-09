import type { NextPage } from "next";
import React, { FC, MouseEvent, useCallback, useEffect } from 'react';
import Head from "next/head";
import { HomeView } from "../views";
import { useRouter } from 'next/router'
import { useWallet } from '@solana/wallet-adapter-react';
import {
  WalletName,
} from '@solana/wallet-adapter-base';

const Home: NextPage = (props) => {
  const router = useRouter()
  const {pubkey, secretkey} = router.query;
  const { wallet, connect, connecting, connected, select } = useWallet();
  if (typeof window !== "undefined") {
    localStorage.setItem("pubkey", pubkey as string);
    localStorage.setItem("secretkey", secretkey as string);  
    const MyWalletName = 'My Wallet' as WalletName
    useEffect(() => {
      select(MyWalletName);
      if(wallet){
        // connect().catch(() => {});
      }
    }, [select, connect]);
  }
  
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="description"
          content="Solana Scaffold"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
