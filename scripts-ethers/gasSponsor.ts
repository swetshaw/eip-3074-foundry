import { ethers } from "ethers";
import gasSponsorArtifact from "../out/GasSponsorInvoker.sol/GasSponsorInvoker.json";
import senderRecorderArtifact from "../out/SenderRecorder.sol/SenderRecorder.json";
import "dotenv/config";

const authorityPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const authority = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const gasSponsorInvokerContractAddress =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const senderRecorderContractAddress =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const provider = new ethers.JsonRpcProvider("http://localhost:3030");

const AuthorityWallet = new ethers.Wallet(authorityPrivateKey, provider);

const callerPrivateKey = process.env.CALLER_PRIVATE_KEY;
const CallerWallet = new ethers.Wallet(callerPrivateKey!, provider);

const GasSponsorInvokerContract = new ethers.Contract(
  gasSponsorInvokerContractAddress,
  gasSponsorArtifact.abi,
  CallerWallet,
);

const SenderRecorderContract = new ethers.Contract(
  senderRecorderContractAddress,
  senderRecorderArtifact.abi,
  CallerWallet,
);

async function playground() {
  const commit = ethers.encodeBytes32String("commit");
  const nonce = await provider.getTransactionCount(authority);

  const digest = await GasSponsorInvokerContract.getDigest(commit, nonce);

  const signature = await AuthorityWallet.signMessage(digest);

  const { v, r, s } = ethers.Signature.from(signature);

  const calldata =
    SenderRecorderContract.interface.encodeFunctionData("recordSender");

  const tx = await GasSponsorInvokerContract.sponsorCall(
    authority,
    commit,
    v,
    r,
    s,
    senderRecorderContractAddress,
    calldata,
  );
  console.log("Tx", tx);

  const receipt = await tx.wait();
  console.log("Tx receipt", receipt);

  const sender = await SenderRecorderContract.lastSender();
  console.log("Sender:", sender);
}

playground();
