import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";
import { getContractOrDeployment } from "../utils/contract";
import { delegate, mint, getWinningProposal } from "../scripts/erc20";
import { AddressLike } from "../scripts/types";
import { logTransaction } from "../utils";
import log from '../utils/log'  
import { record } from "../scripts/records";
import { vote, votingPower } from "../scripts/tokenized-ballot";

task("record", "Running a complete tokenized ballot system").setAction(record);

// Hardhat tasks for ERC20.delegate(delegatee)
task("delegate", "Delegating to ERC20Votes contract")
  .addOptionalParam("contract", "token contract address")
  .addOptionalParam("address", "address of delegatee")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contractAddress = await getContractOrDeployment(hre, taskArgs.contract, "MyToken");

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      console.error("Invalid contract Address");
    }

    const txn = await delegate(hre, contractAddress as AddressLike, taskArgs.address);

    logTransaction(hre, txn);
  });

task("mint", "Minting token")
  .addOptionalParam("contract", "token contract address")
  .addOptionalParam("address", "address of recipient")
  .addOptionalParam("amount", "amount to be minted")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contractAddress = await getContractOrDeployment(hre, taskArgs.contract, "MyToken");

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      console.error("Invalid contract Address");
    }

    const txn = await mint(hre, contractAddress as AddressLike, taskArgs.address, taskArgs.amount);

    logTransaction(hre, txn);
  });

task('winning-proposal', 'Give the name of the winner and total vote')
  .addParam('contract', 'Ballot contract address')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const winningProposal = await getWinningProposal(taskArgs, hre)
    if (!winningProposal) {
      log.error('Winning proposal not found')
      return
    }
    log.info('Winner:', winningProposal.winner)
    log.info('Total Count:', winningProposal.count.toString())
  })

task("vote", "Voting proposal")
  .addOptionalParam("signer", "Signer address", ethers.ZeroAddress, types.string)
  .addOptionalParam("contract", "Ballot contract address", ethers.ZeroAddress, types.string)
  .addOptionalParam("proposal", "Proposal index", "0", types.string)
  .addOptionalParam("amount", "Vote amount", "0", types.string)
  .setAction(vote);

task("voting-power", "Account voting power")
  .addOptionalParam("contract", "Ballot contract address", ethers.ZeroAddress, types.string)
  .addOptionalParam("address", "Account address", ethers.ZeroAddress, types.string)
  .setAction(votingPower);
