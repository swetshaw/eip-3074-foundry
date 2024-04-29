import React, { useState } from 'react';
import { Box, Button, Heading, Text, VStack, Image, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import kkrt from './kkrt.jpg'
import './App.css';
import gasSponsorArtifact from "./abis/GasSponsorInvoker.json";
import senderRecorderArtifact from "./abis/SenderRecorder.json";

function App() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const [encodedCommit, setEncodedCommit] = useState('')
  const [signature, setSignature] = useState('')

  const toast = useToast();  // Using Chakra UI toast for notifications

  const GAS_SPONSOR_INVOKER_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const SENDER_RECORDER_CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

  const authority = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

  // Function to connect to the wallet
  async function connectWallet() {
    if (!connected) {
      try {
        // @ts-ignore
        const { ethereum } = window;
        if (ethereum && ethereum.isMetaMask) {
          // Request account access
          await ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(ethereum);
          const signer = await provider.getSigner();
          const _walletAddress = await signer.getAddress();
          console.log('Wallet Address:', _walletAddress);
          setConnected(true);
          setWalletAddress(_walletAddress);
          toast({
            title: "Wallet connected.",
            description: `Address: ${_walletAddress}`,
            status: "success",
            duration: 1000,
            isClosable: true,
          });
        } else {
          // MetaMask is not installed
          toast({
            title: "Error",
            description: "Please install MetaMask!",
            status: "error",
            duration: 1000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
      }
    } else {
      setConnected(false);
      setWalletAddress('');
      toast({
        title: "Disconnected",
        description: "The wallet has been disconnected.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function getDigest() {
    // @ts-ignore
    const { ethereum } = window;
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    console.log('Signer:', signer.address)

    const gasSponsorContract = new ethers.Contract(GAS_SPONSOR_INVOKER_CONTRACT_ADDRESS, gasSponsorArtifact.abi, signer);

    const nonce = await provider.getTransactionCount(authority)
    const commit = "newCommit"
    const encodedCommit = ethers.encodeBytes32String(commit)
    const digest = await gasSponsorContract.getDigest(encodedCommit, nonce)

    setEncodedCommit(encodedCommit)

    const signature = await signer.signMessage(digest)

    setSignature(signature)
  }

  async function invokeGasSponsor() {
    try {
      // @ts-ignore
      const { ethereum } = window;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      console.log('Signer:', signer.address)
      const gasSponsorContract = new ethers.Contract(GAS_SPONSOR_INVOKER_CONTRACT_ADDRESS, gasSponsorArtifact.abi, signer);
      const senderRecorderContract = new ethers.Contract(SENDER_RECORDER_CONTRACT_ADDRESS, senderRecorderArtifact.abi, signer);
      const { v, r, s } = ethers.Signature.from(signature);

      const calldata = senderRecorderContract?.interface.encodeFunctionData("recordSender")

      console.log('Authority:', authority)
      console.log('Encoded commit:', encodedCommit)

      const tx = await gasSponsorContract.sponsorCall(
        authority,
        encodedCommit,
        v,
        r,
        s,
        SENDER_RECORDER_CONTRACT_ADDRESS,
        calldata
      )

      console.log('Tx', tx)

      const receipt = await tx.wait()
      console.log('Tx receipt', receipt)

      const sender = await senderRecorderContract?.lastSender()
      console.log('Sender:', sender)
    } catch (error) {
      console.error("Invoke error", error);
      toast({
        title: "Invoke Error",
        description: "Failed to invoke the transaction.",
        status: "error",
        duration: 1000,
        isClosable: true,
      });
    }
  }

  return (
    <Box p={4} display="flex" alignItems="center" flexDirection="column" gap={4}>
      <VStack spacing={4}>
        <Heading as="h1" size="2xl">Kakarot EIP3074 Demo</Heading>
        <Image src={kkrt} boxSize="400px" alt="React Logo" />
        <Text>
          {connected ? `Connected Wallet: ${walletAddress}` : "No Wallet Connected"}
        </Text>
        <Button colorScheme="blue" onClick={connectWallet}>
          {connected ? 'Disconnect Wallet' : 'Connect Wallet'}
        </Button>
        <Button colorScheme="blue" onClick={getDigest}>
          Get Digest
        </Button>
        <Button colorScheme="green" onClick={invokeGasSponsor}>
          Invoke
        </Button>
      </VStack>
    </Box>
  );
}

export default App;
