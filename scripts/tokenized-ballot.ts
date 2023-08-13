import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getContractOrDeployment } from "../utils/contract";
import { ethers } from "ethers";
import { logTransaction } from "../utils";
import { Contract, VoteArgument, VotingPowerArgument } from "./types";

export async function vote(args: VoteArgument, hre: HardhatRuntimeEnvironment): Promise<any> {
  const { proposal, amount } = args;
  const contractAddr = await getContractOrDeployment(hre, args.contract, "TokenizedBallotV2");

  if (!contractAddr || !ethers.isAddress(contractAddr)) {
    return console.error("Invalid contract Address");
  }

  const proposalBn = hre.ethers.toBigInt(proposal);
  const amountBn = hre.ethers.toBigInt(amount);

  console.log(`Voting to proposal index ${proposal} with ${amount} decimal unit...`);

  const signer = await hre.ethers.getSigner(args.signer).catch(async () => {
    const [signer] = await hre.ethers.getSigners();
    return signer;
  });

  const contract = await hre.ethers.getContractAt("TokenizedBallotV2", contractAddr, signer);
  const txn = await contract.vote(proposalBn, amountBn).then((response) => response.wait(1));

  logTransaction(hre, txn);
}

export async function votingPower(args: VotingPowerArgument, hre: HardhatRuntimeEnvironment) {
  const contractAddr = await getContractOrDeployment(hre, args.contract, "TokenizedBallotV2");

  if (!contractAddr || !ethers.isAddress(contractAddr)) {
    return console.error("Invalid contract Address");
  }

  const contract = await hre.ethers.getContractAt("TokenizedBallotV2", contractAddr);
  const amount = await contract.votingPower(args.address);

  console.log("Voting power:", amount.toString());
}
