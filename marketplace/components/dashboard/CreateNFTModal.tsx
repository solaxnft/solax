"use client";

import { createQR, encodeURL, TransactionRequestURLFields } from '@solana/pay';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useWalletContext } from '../../../contexts/WalletContext';
import { Transaction } from '@solana/web3.js';
import "./CreateNFTModal.css";

// Types from the API
type PostResponse = {
  transaction: string; // Transaction (unsigned or fully signed depending on step)
  message: string;
  mintAddress?: string; // Mint address for the NFT (needed for signing step)
};

type PostError = {
  error: string;
};

type CreateNFTModalProps = {
  isOpen: boolean;
  onClose: () => void;
  displayMode: string;
};

export default function CreateNFTModal({ isOpen, onClose, displayMode }: CreateNFTModalProps) {
  const { 
    publicKey, 
    signTransaction, 
    connection, 
    connected, 
    walletAddress, 
    isWalletReady 
  } = useWalletContext();
  const mintQrRef = useRef<HTMLDivElement>(null);
  
  // Use the context's isWalletReady which ensures both publicKey and signTransaction are available
  const isWalletAvailable = isWalletReady;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [nftName, setNftName] = useState('');
  const [nftSymbol, setNftSymbol] = useState('');
  const [nftUri, setNftUri] = useState('');
  const [mintAddress, setMintAddress] = useState<string | null>(null);

  // Handler to clear error
  const handleClearError = () => setError(null);

  // Generate the Solana Pay QR code
  useEffect(() => {
    if (!isOpen) return;
    
    const { location } = window;
    const apiUrl = `${location.protocol}//${location.host}/api/create-nft`;

    const mintUrlFields: TransactionRequestURLFields = {
      link: new URL(apiUrl),
    };
    const mintUrl = encodeURL(mintUrlFields);
    const mintQr = createQR(mintUrl, 300, 'transparent');

    // Set the generated QR code on the QR ref element
    if (mintQrRef.current) {
      mintQrRef.current.innerHTML = '';
      mintQr.append(mintQrRef.current);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError(null);
      setSuccess(false);
      setTransactionHash(null);
      setNftName('');
      setNftSymbol('');
      setNftUri('');
      setMintAddress(null);
    }
  }, [isOpen]);

  const handleCreateNFT = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      setError('Please connect your wallet first');
      return;
    }

    if (!nftName.trim()) {
      setError('Please enter an NFT name');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Fetch the unsigned transaction from our API
      console.log('Step 1: Fetching unsigned transaction...');
      const response = await fetch('/api/create-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          account: publicKey.toBase58(),
          name: nftName.trim(),
          symbol: nftSymbol.trim() || undefined,
          uri: nftUri.trim() || undefined,
        })
      });

      const responseBody = await response.json() as PostResponse | PostError;

      if ('error' in responseBody) {
        const { error: apiError } = responseBody;
        console.error(apiError);
        setError(`Error: ${apiError}`);
        setLoading(false);
        return;
      }

      // Store the mint address for the signing step
      if (responseBody.mintAddress) {
        setMintAddress(responseBody.mintAddress);
      }

      // Step 2: Deserialize the unsigned transaction
      console.log('Step 2: Deserializing unsigned transaction...');
      const unsignedTransaction = Transaction.from(Buffer.from(responseBody.transaction, 'base64'));
      
      // Step 3: User wallet signs the transaction first
      console.log('Step 3: User wallet signing transaction first...');
      const userSignedTransaction = await signTransaction(unsignedTransaction);
      
      // Step 4: Send user-signed transaction back to server to add shop and mint signatures
      console.log('Step 4: Sending user-signed transaction to server for additional signatures...');
      if (!mintAddress) {
        throw new Error('Mint address not found. Please try creating the NFT again.');
      }
      
      const signResponse = await fetch('/api/create-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          account: publicKey.toBase58(),
          signedTransaction: userSignedTransaction.serialize({ requireAllSignatures: false }).toString('base64'),
          mintAddress: mintAddress
        })
      });

      const signResponseBody = await signResponse.json() as PostResponse | PostError;

      if ('error' in signResponseBody) {
        const { error: apiError } = signResponseBody;
        console.error(apiError);
        setError(`Error: ${apiError}`);
        setLoading(false);
        return;
      }

      // Step 5: Deserialize the fully signed transaction
      console.log('Step 5: Deserializing fully signed transaction...');
      const fullySignedTransaction = Transaction.from(Buffer.from(signResponseBody.transaction, 'base64'));
      
      // Step 6: Send the fully signed transaction
      console.log('Step 6: Sending fully signed transaction...');
      const signature = await connection.sendRawTransaction(fullySignedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      
      // Step 7: Wait for transaction confirmation
      console.log('Step 7: Waiting for transaction confirmation...');
      const latestBlockhash = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction({
        signature: signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }
      
      setTransactionHash(signature);
      setSuccess(true);
      setLoading(false);
      
      console.log('NFT created successfully!');
      console.log('Transaction signature:', signature);
      
    } catch (txError: any) {
      console.error(txError);
      setError(`Transaction failed: ${txError?.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [publicKey, signTransaction, connection, nftName, nftSymbol, nftUri]);

  const modalClass = displayMode === "dark" ? "modal-overlay dark" : "modal-overlay light";

  // Debug: Log wallet state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal wallet state from context:', { 
        publicKey: publicKey?.toBase58(), 
        signTransaction: !!signTransaction,
        connected: connected,
        walletAddress,
        isWalletReady,
        isWalletAvailable
      });
    }
  }, [isOpen, publicKey, signTransaction, connected, walletAddress, isWalletReady, isWalletAvailable]);

  if (!isOpen) return null;

  return (
    <div className={modalClass} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create NFT</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* NFT Details Form */}
          <div className="form-section">
            <h3>NFT Details</h3>
            <div className="form-group">
              <label htmlFor="nft-name">Name *</label>
              <input
                id="nft-name"
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                placeholder="Enter NFT name"
                disabled={loading || success}
              />
            </div>
            <div className="form-group">
              <label htmlFor="nft-symbol">Symbol (optional)</label>
              <input
                id="nft-symbol"
                type="text"
                value={nftSymbol}
                onChange={(e) => setNftSymbol(e.target.value)}
                placeholder="Enter NFT symbol"
                disabled={loading || success}
              />
            </div>
            <div className="form-group">
              <label htmlFor="nft-uri">Metadata URI (optional)</label>
              <input
                id="nft-uri"
                type="text"
                value={nftUri}
                onChange={(e) => setNftUri(e.target.value)}
                placeholder="https://arweave.net/..."
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Payment Section */}
          <div className="payment-section">
            <h3>Payment Method</h3>
            
            {/* Wallet Connect Option */}
            <div className="payment-option">
              <h4>1. Wallet Connection</h4>
              {isWalletAvailable && walletAddress ? (
                <div className="wallet-status">
                  <div className="wallet-connected">
                    <span className="wallet-indicator">●</span>
                    <span className="wallet-address">
                      Connected: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                  <button
                    className="create-button"
                    onClick={handleCreateNFT}
                    disabled={loading || success || !nftName.trim()}
                  >
                    {loading ? 'Processing...' : success ? 'NFT Created!' : 'Create NFT'}
                  </button>
                </div>
              ) : (
                <div className="wallet-not-connected">
                  <p>Please connect your wallet using the button in the header to create an NFT.</p>
                </div>
              )}
            </div>

            <div className="divider">OR</div>

            {/* QR Code Option */}
            <div className="payment-option">
              <h4>2. Scan QR Code</h4>
              <div className="qr-container">
                <div ref={mintQrRef} className="qr-code" />
              </div>
              <p className="qr-hint">Scan with any Solana Pay compatible wallet</p>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="error-message">
              <span>{error}</span>
              <button className="error-close" onClick={handleClearError}>×</button>
            </div>
          )}

          {success && transactionHash && (
            <div className="success-message">
              <div className="success-header">
                <span>🎉 NFT created successfully!</span>
              </div>
              <div className="success-details">
                <a 
                  href={`https://solscan.io/tx/${transactionHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transaction-link"
                >
                  View Transaction →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
