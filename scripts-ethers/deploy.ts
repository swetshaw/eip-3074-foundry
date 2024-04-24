// use ethers js to deploy bytecode

import { ContractFactory, ethers } from 'ethers';
import AutherizedTransferABI from '../out/AuthorizedTransfer.sol/AuthorizedTransfer.json';
import ERC20ABI from '../out/ERC20.sol/ERC20.json';


async function deploy() {
    const provider = new ethers.JsonRpcProvider('http://localhost:3030');
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    const factory = new ContractFactory(AutherizedTransferABI.abi, AutherizedTransferABI.bytecode, wallet);

    console.log('Deploying contract...');
    const contract = await factory.deploy();
    console.log('Contract address:', contract);
    const deploymentReceipt = await contract.deploymentTransaction()?.wait();

    console.log('transaction receipt:', deploymentReceipt)

    console.log('Contract deployed to:', deploymentReceipt?.contractAddress);
    console.log('Transaction hash:', deploymentReceipt?.hash);
}

deploy();

// async function playground() {
//     const provider = new ethers.JsonRpcProvider('http://localhost:3030');
    
//     // interact with contract at address 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

//     const contract = new ethers.Contract('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', AutherizedTransferABI.abi, provider);

//     // call contract methods
//     const res = await contract.dummyFunction()

//     console.log('res:', res)
// }

// playground()

// async function erc20Playground () {
//     const provider = new ethers.JsonRpcProvider('http://localhost:3030');

//     const contract = new ethers.Contract('0x0165878A594ca255338adfa4d48449f69242Eb8F', ERC20ABI.abi, provider);

//     const res = await contract.balanceOf('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

//     console.log('res:', res)
// }

// erc20Playground()
