import React, { useState } from 'react';
import { Box, Button, Heading, Text, VStack, Image, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import kkrt from './kkrt.jpg'
import AuthorizedTransferABI from './abis/AuthorizedTransfer.json'
import ERC20_ABI from './abis/MyToken.json'
import VyperContractArtifacts from './abis/VyperContractArtifacts.json'
import './App.css';
import { privateKeyToAccount } from 'viem/accounts'
import { keccak256 } from 'viem/utils'

function App() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const toast = useToast();  // Using Chakra UI toast for notifications

  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Invoker contract address
  const tokenAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const contractAddressVyper = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" // Vyper impl of Invoker contract address
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // private key of first anvil account
  const authority  = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

  const commitMessage = 'newcommit';

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
          setConnected(true);
          setWalletAddress(_walletAddress);
          toast({
            title: "Wallet connected.",
            description: `Address: ${_walletAddress}`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } else {
          // MetaMask is not installed
          toast({
            title: "Error",
            description: "Please install MetaMask!",
            status: "error",
            duration: 5000,
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

  // Function to convert an empty string into 24 bytes of zeros
  function getEmptyBytes24() {
    // Create an empty hex string with 0x prefix
    const emptyHex = "0x";

    // Pad this hex string to 24 bytes (24 bytes = 48 characters + 2 for '0x')
    return ethers.zeroPadValue(emptyHex, 24);
  }

  async function authorizeTransfer() {
    // @ts-ignore
    const { ethereum } = window;
    if (ethereum && ethereum.isMetaMask) {
      try {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner()
        const authorizedTransfer = new ethers.Contract(contractAddress, AuthorizedTransferABI.abi, signer);


        console.log("Authorized Transfer contract", authorizedTransfer);

        const commit = {
          validAfter: 0,
          validUntil: 1714040667,
          data: getEmptyBytes24(),
        };

        console.log("Commit", commit);

        const coder = ethers.AbiCoder.defaultAbiCoder()
        // const commitEncoded = coder.encode(
        //   ["uint32", "uint32", "bytes24" ],
        //   [commit.validAfter, commit.validUntil, commit.data]
        // );

        const commitEncoded = ethers.encodeBytes32String(commitMessage)
        console.log("Commit Encoded", commitEncoded);

        const digest = await authorizedTransfer.getDigest(commitEncoded);
        console.log("Digest", digest);
        const signature = await signer.signMessage(ethers.getBytes(digest));
        console.log("Signature", signature);
        const { v, r, s } = ethers.Signature.from(signature);
        console.log("v", v);

        // const txResponse = await authorizedTransfer.setAuth(commitEncoded, walletAddress, v, r, s);
        // console.log("Transaction Response", txResponse);
        // await txResponse.wait();

        // setIsAuthorised(true);

        toast({
          title: "Authorization Success",
          description: "Successfully authorized transaction invoke.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Authorization error", error);
        toast({
          title: "Authorization Error",
          description: "Failed to authorize.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }

  async function invokeTransferVyper() {
    // @ts-ignore
    const { ethereum } = window;
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    const account = privateKeyToAccount(privateKey)
    try {
      const signature = await account.experimental_signAuthMessage({
        chainId: 1263227476,
        commit: keccak256("0x12345"),
        invokerAddress: contractAddressVyper,
        nonce: 4,
      })

      const authorizedTransfer = new ethers.Contract(contractAddressVyper, VyperContractArtifacts.abi, signer);

      // Replace with your ERC20 token address
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI.abi, signer);

      const receiverAddress = '0x93EDF6c557C61c4E73F152935e8D9eb6c0dFf0A4';

      const txResponse = await authorizedTransfer.authorizeInvoke(contractAddressVyper, signature, tokenAddress, receiverAddress, ethers.parseEther("10000"))
      console.log("Transaction Response", txResponse);
    } catch (error) {
      console.error("Invoke error", error);
      toast({
        title: "Invoke Error",
        description: "Failed to invoke the transaction.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }

  async function invokeTransfer() {
    // @ts-ignore
    const { ethereum } = window;
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    const authorizedTransfer = new ethers.Contract(contractAddress, AuthorizedTransferABI.abi, signer);

    // Replace with your ERC20 token address
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI.abi, signer);

    const receiverAddress = '0x93EDF6c557C61c4E73F152935e8D9eb6c0dFf0A4';

    const commitEncoded = ethers.encodeBytes32String(commitMessage)
    console.log("Commit Encoded", commitEncoded);

    const digest = await authorizedTransfer.getDigest(commitEncoded);
    console.log("Digest", digest);
    const signature = await signer.signMessage(ethers.getBytes(digest));
    console.log("Signature", signature);
    const { v, r, s } = ethers.Signature.from(signature);
    console.log("v", v);

    // Prepare the data for the calls
    const call1 = {
      target: tokenAddress,
      value: 0,
      data: tokenContract.interface.encodeFunctionData("approve", ["0x93EDF6c557C61c4E73F152935e8D9eb6c0dFf0A4", ethers.parseEther("100000")])
    };

    const call2 = {
      target: tokenAddress,
      value: 0,
      data: tokenContract.interface.encodeFunctionData("transferFrom", ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", receiverAddress, ethers.parseEther("10000")])
    };

    const call0 = {
      target: tokenAddress,
      value: 0,
      data: tokenContract.interface.encodeFunctionData("transfer", ["0x93EDF6c557C61c4E73F152935e8D9eb6c0dFf0A4", ethers.parseUnits("100000", 18)])
    };

    const calls = [call0];

    try {
      const txResponse = await authorizedTransfer.authorisedInvokeTransfer(calls, ethers.encodeBytes32String(commitMessage), v, r, s, authority);
      await txResponse.wait();
      toast({
        title: "Invoke Success",
        description: "Transaction successfully invoked.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Invoke error", error);
      toast({
        title: "Invoke Error",
        description: "Failed to invoke the transaction.",
        status: "error",
        duration: 5000,
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
        {/* {connected && (
          <Button colorScheme="green" onClick={authorizeTransfer}>
            Authorize Invoke
          </Button>
        )} */}
        <Button colorScheme="green" onClick={invokeTransfer}>
          Invoke
        </Button>
        <Button colorScheme="green" onClick={invokeTransferVyper}>
          Invoke Vyper
        </Button>
      </VStack>
    </Box>
  );
}

export default App;
