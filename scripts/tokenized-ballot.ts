import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function vote(
  hre: HardhatRuntimeEnvironment,
  signerAddress: string,
  contractAddress: string,
  proposalIndex: bigint,
  amount: bigint
): Promise<any> {
  const signer = await hre.ethers.getSigner(signerAddress);
  const contract = await hre.ethers.getContractAt("TokenizedBallot", contractAddress, signer);
  return contract.vote(proposalIndex, amount).then((response) => response.wait(1));
}
