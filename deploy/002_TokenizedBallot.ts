import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "ethers";
import _ from "lodash";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const proposals = _.range(10).map((i) => {
    return ethers.encodeBytes32String("Proposal" + i);
  });

  const result = await deploy("TokenizedBallot", {
    from: deployer,
    args: [proposals, "0x42c9284864A50Ab5e9bE0c87220d829124Ff5d5A", 4068600],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  deployments.log(`Deployed TokenizedBallot: ${result.address}, Deployer: ${deployer}, network: ${hre.network.name}`);
};

export default func;
func.tags = ["TokenizedBallot"];
