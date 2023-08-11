import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function getDeploymentAt(
  hre: HardhatRuntimeEnvironment,
  contractName: string
): Promise<string | undefined> {
  const { deployments } = hre;
  const deployment = await deployments.get(contractName);
  const deployedAddress = deployment.address;

  if (!deployedAddress || !ethers.isAddress(deployedAddress)) {
    return undefined;
  }

  return deployedAddress;
}

export async function getContractOrDeployment(
  hre: HardhatRuntimeEnvironment,
  contractAddress?: string,
  contractName?: string
) {
  if (contractAddress && ethers.isAddress(contractAddress)) {
    return contractAddress;
  }

  if (!contractName) {
    return undefined;
  }

  return getDeploymentAt(hre, contractName);
}
