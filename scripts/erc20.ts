import { HardhatRuntimeEnvironment } from "hardhat/types";
import { AddressLike } from "./types";
import { BigNumberish } from "ethers";

interface Argument {
  contract: string
}

export async function delegate(
  hre: HardhatRuntimeEnvironment,
  contractAddress: AddressLike,
  delegatee: AddressLike | undefined
): Promise<any> {
  const [signer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyToken", contractAddress, signer);

  const txn = await contract.delegate(delegatee ?? signer.address);
  await txn.wait(1);

  return txn;
}

export async function mint(
  hre: HardhatRuntimeEnvironment,
  contractAddress: AddressLike,
  to: AddressLike,
  amount: BigNumberish = hre.ethers.parseEther("10000")
) {
  const [signer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyToken", contractAddress, signer);

  const txn = await contract.mint(to ?? signer.address, amount);
  await txn.wait(1);

  return txn;
}

export async function getWinningProposal(args: Argument, hre: HardhatRuntimeEnvironment) {
  const contractAddress = args.contract
  const contract = await hre.ethers.getContractAt('TokenizedBallotV2', contractAddress)
  const winningProposal = await contract.winningProposal().then((idx) => contract.proposals(idx))

  if (winningProposal.voteCount <= 0n) {
    return undefined
  }

  return {
    winner: hre.ethers.decodeBytes32String(winningProposal.name),
    count: winningProposal.voteCount,
  }
}
