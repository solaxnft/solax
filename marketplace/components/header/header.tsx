"use client";

import "./header.css";

import Display from "./images/darkDisplay.svg";
import lmDisplay from "./images/lightDisplay.svg";
import Notifications from "./images/Notifications.svg";
import Avatar from "./images/Avatar.svg";

import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useWalletContext } from "../../../contexts/WalletContext";
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

import Image from "next/image";
import { TRANSACTION_CONFIG } from "../../../../lib/config";

const Header = ({
  displayMode,
  setDisplayMode,
}: {
  displayMode: string;
  setDisplayMode: Function;
}) => {
  const { publicKey, connected, signTransaction, connection, walletAddress } = useWalletContext();
  const [transactionStatus, setTransactionStatus] = useState<string>("");
  const [isTransactionInProgress, setIsTransactionInProgress] = useState(false);

  let displayIcon;
  let searchId;

  const handleClick = () => {
    if (displayMode === "dark") {
      displayIcon = lmDisplay;
      setDisplayMode("light");
    } else {
      displayIcon = Display;
      setDisplayMode("dark");
    }
  };

  if (displayMode === "dark") {
    searchId = "search";
    displayIcon = Display;
  } else {
    searchId = "search-lm";
    displayIcon = lmDisplay;
  }



  return (
    <header className="header--container">
      <input id={searchId} type="search" placeholder="Search..." />
      <div className="img--container">
        <Image onClick={handleClick} src={displayIcon} alt="display" />
        <Image src={Notifications} alt="notifs" />
        <Image src={Avatar} alt="user" />
        <WalletMultiButton />
        <WalletDisconnectButton />
        
        {/* Transaction Status Display */}
        {transactionStatus && (
          <div style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            backgroundColor: displayMode === "dark" ? "#2d2d2d" : "#f0f0f0",
            color: displayMode === "dark" ? "#fff" : "#000",
            padding: "10px",
            borderRadius: "5px",
            maxWidth: "300px",
            fontSize: "12px",
            zIndex: 1000,
            border: "1px solid #ccc"
          }}>
            {transactionStatus}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
