import fs from "fs";

import { ethers } from "ethers";
import { MyToken__factory, TokenizedBallot__factory } from "../typechain-types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

enum Status {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

interface Receipt {
  name: string;
  from: {
    name: string;
    address: string;
  };
  to: string | null;
  params: any;
  status: Status;
  hash?: string;
  blockNumber?: number;
  explorerURL?: string;
  reason?: string;
}

const PROPOSALS = ["CAT", "FISH", "DOG"];
const MINT_VALUE = ethers.parseUnits("1");
const RECEIPTS: Receipt[] = [];
const RECORD = {
  network: "localhost",
  receipts: RECEIPTS,
  winner: { name: "none", totalVote: "0" },
};

export async function record(args: any, hre: HardhatRuntimeEnvironment) {
  const { ethers, run } = hre;

  await run("compile");

  const allAccounts = await ethers.getSigners();
  const accounts = allAccounts.slice(0, 3);
  const [deployer, account1, account2] = accounts;
  const network = await ethers.provider.getNetwork();

  console.log(`Running on network ${network.name}...\n`);
  console.log(`Total accounts: ${accounts.length}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Account1: ${account1?.address}`);
  console.log(`Account2: ${account2?.address}\n`);

  // Explorer URL
  const baseURL = `https://${network.name}.etherscan.io/tx`;
  const isLocal = network.name === "localhost" || network.name === "hardhat";

  RECORD.network = network.name;

  // Initiate contract factory
  const tokenFactory = new MyToken__factory(deployer);
  const ballotFactory = new TokenizedBallot__factory(deployer);

  // Deploy token contract
  console.log("Deploying token contract...");

  const tokenContract = await tokenFactory.deploy().then((contract) => contract.waitForDeployment());

  const tokenContractAddress = await tokenContract.getAddress();

  console.log(`Token contract deployed at ${tokenContractAddress}!\n`);

  // Minting
  console.log(`Minting...`);

  const connectedContract = tokenContract.connect(deployer);
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const address = account.address;
    const accountName = i === 0 ? "deployer" : `account${i}`;
    const mint = connectedContract.mint(address, MINT_VALUE);
    const txReceipt = await mint.then((contract) => contract.wait()).catch((err: Error) => err.message);
    const receipt: Receipt = {
      name: "mint",
      from: {
        name: "deployer",
        address: deployer.address,
      },
      to: tokenContractAddress,
      params: {
        account: { name: accountName, address },
        amount: MINT_VALUE.toString(),
      },
      status: Status.SUCCESS,
    };

    if (typeof txReceipt === "string" || !txReceipt) {
      receipt.status = Status.FAILED;
      receipt.reason = !txReceipt ? "Error" : txReceipt;
      console.log("Failed to mint!");
    } else {
      receipt.hash = txReceipt.hash;
      receipt.blockNumber = txReceipt.blockNumber;
      receipt.explorerURL = isLocal ? "" : `${baseURL}/${txReceipt.hash}`;
      console.log(`Minted ${MINT_VALUE} decimal units to ${accountName}!`);
    }

    RECEIPTS.push(receipt);
  }

  // Delegating
  console.log("\nSelf delegating...");

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const address = account.address;
    const accountName = i === 0 ? "deployer" : `account${i}`;
    const connectedContract = tokenContract.connect(account);
    const delegate = connectedContract.delegate(address);
    const txReceipt = await delegate.then((contract) => contract.wait()).catch((error: Error) => error.message);
    const receipt: Receipt = {
      name: "delegate (self delegate)",
      from: {
        name: accountName,
        address: account.address,
      },
      to: tokenContractAddress,
      params: {
        account: { name: accountName, address },
      },
      status: Status.SUCCESS,
    };

    if (typeof txReceipt === "string" || !txReceipt) {
      receipt.reason = !txReceipt ? "Error" : txReceipt;
      receipt.status = Status.FAILED;
      console.log("Failed to self delegate!");
    } else {
      receipt.hash = txReceipt.hash;
      receipt.blockNumber = txReceipt.blockNumber;
      receipt.explorerURL = isLocal ? "" : `${baseURL}/${txReceipt.hash}`;
      console.log(`${accountName} is delegated!`);
    }

    RECEIPTS.push(receipt);
  }

  if (accounts.length == 3) {
    // Account 1 delegate to account 2
    console.log(`\nVoter is delegating to delegator...`);
    console.log(`Voter: ${account1.address} (account1)`);
    console.log(`Delegator: ${account2.address} (account2)`);

    const txReceipt = await tokenContract
      .connect(account1)
      .delegate(account2.address)
      .then((contract) => contract.wait())
      .catch((error: Error) => error.message);

    const receipt: Receipt = {
      name: "delegate",
      from: {
        name: "account1",
        address: account1.address,
      },
      to: tokenContractAddress,
      params: {
        account: { name: "account2", address: account2.address },
      },
      status: Status.SUCCESS,
    };

    if (typeof txReceipt === "string" || !txReceipt) {
      receipt.status = Status.FAILED;
      receipt.reason = !txReceipt ? "Error" : txReceipt;
      console.log("Failed to delegate!");
    } else {
      receipt.hash = txReceipt.hash;
      receipt.blockNumber = txReceipt.blockNumber;
      receipt.explorerURL = isLocal ? "" : `${baseURL}/${txReceipt.hash}`;
      console.log("Delegated!");
    }

    RECEIPTS.push(receipt);
  }

  // Parameter
  const proposals = PROPOSALS.map((e) => ethers.encodeBytes32String(e));
  const blockNumber = await ethers.provider.getBlockNumber();

  // Deploy ballot contract
  console.log("\nDeploying ballot contract...");

  const ballotContract = await ballotFactory
    .deploy(proposals, tokenContractAddress, BigInt(blockNumber))
    .then((contract) => contract.waitForDeployment());

  const ballotContractAddress = await ballotContract.getAddress();

  console.log(`Ballot contract deployed at ${ballotContractAddress}\n`);

  // Vote more than 1 proposal by deployer (FIXED AMOUNT)
  const votingPower = await ballotContract.votingPower(deployer.address);

  console.log(`Voting all proposals with the random amount of decimal units...`);
  console.log(`Voter: ${deployer.address} (deployer)`);
  console.log(`Voting Power: ${votingPower.toString()} decimal units`);

  let remaining = 1000n;
  for (let i = 0; i < PROPOSALS.length; i++) {
    const proposalName = PROPOSALS[i];

    let random = BigInt(Math.floor((Math.random() / 2) * 1000));
    while (random > remaining) {
      random = BigInt(Math.floor((Math.random() / 2) * 1000));
    }

    const amount = (random * votingPower) / 1000n;
    const txReceipt = await ballotContract
      .connect(deployer)
      .vote(i, amount)
      .then((contract) => contract.wait())
      .catch((error: Error) => error.message);

    remaining -= random;

    const receipt: Receipt = {
      name: "vote",
      from: {
        name: "deployer",
        address: deployer.address,
      },
      to: ballotContractAddress,
      params: {
        proposal: { name: proposalName, index: i },
        amount: amount.toString(),
      },
      status: Status.SUCCESS,
    };

    if (typeof txReceipt === "string" || !txReceipt) {
      receipt.status = Status.FAILED;
      receipt.reason = !txReceipt ? "Error" : txReceipt;
      console.log(`Vote ${PROPOSALS[i]} with ${MINT_VALUE} decimal units is rejected!\n`);
    } else {
      receipt.hash = txReceipt.hash;
      receipt.blockNumber = txReceipt.blockNumber;
      receipt.explorerURL = isLocal ? "" : `${baseURL}/${txReceipt.hash}`;
      console.log(`Voted ${proposalName} with ${amount} decimal units!`);
    }

    RECEIPTS.push(receipt);
  }

  console.log("");

  if (accounts.length == 3) {
    // Vote more than 1 proposal by account 2 (FIXED AMOUNT)
    const votingPower = await ballotContract.votingPower(account2.address);

    console.log(`Voting all proposals with the same amount of decimal units...`);
    console.log(`Voter: ${account2.address} (account2)`);
    console.log(`Voting Power: ${votingPower} decimal units`);

    const total = BigInt(PROPOSALS.length);
    const amount = votingPower / total;

    for (let i = 0; i < PROPOSALS.length; i++) {
      const proposalName = PROPOSALS[i];
      const txReceipt = await ballotContract
        .connect(account2)
        .vote(i, amount)
        .then((contract) => contract.wait())
        .catch((error: Error) => error.message);

      const receipt: Receipt = {
        name: "vote",
        from: {
          name: "account2",
          address: account2.address,
        },
        to: ballotContractAddress,
        params: {
          proposal: { name: proposalName, index: i },
          amount: amount.toString(),
        },
        status: Status.SUCCESS,
      };

      if (typeof txReceipt === "string" || !txReceipt) {
        receipt.status = Status.FAILED;
        receipt.reason = !txReceipt ? "Error" : txReceipt;
        console.log(`Vote ${PROPOSALS[i]} with ${MINT_VALUE} decimal units is rejected!\n`);
      } else {
        receipt.hash = txReceipt.hash;
        receipt.blockNumber = txReceipt.blockNumber;
        receipt.explorerURL = isLocal ? "" : `${baseURL}/${txReceipt.hash}`;
        console.log(`Voted ${proposalName} with ${amount} decimal units!`);
      }

      RECEIPTS.push(receipt);
    }
  }

  // Rejected vote by account 1
  const votingPower1 = await ballotContract.votingPower(account1.address);

  console.log(`\nVoting a random proposal...`);
  console.log(`Voter: ${account1.address} (account1)`);
  console.log(`Voting Power: ${votingPower1.toString()} decimal units`);

  const idx = Math.floor(Math.random() * PROPOSALS.length);
  const txReceipt = await ballotContract
    .connect(account1)
    .vote(idx, MINT_VALUE)
    .then((contract) => contract.wait())
    .catch((error: Error) => error.message);

  const receipt: Receipt = {
    name: "vote",
    from: {
      name: "account1",
      address: account1.address,
    },
    to: ballotContractAddress,
    params: {
      proposal: { name: PROPOSALS[idx], index: idx },
      amount: MINT_VALUE.toString(),
    },
    status: Status.SUCCESS,
  };

  if (typeof txReceipt === "string" || !txReceipt) {
    receipt.status = Status.FAILED;
    receipt.reason = !txReceipt ? "Error" : txReceipt;
    console.log(`Vote ${PROPOSALS[idx]} with ${MINT_VALUE} decimal units is rejected!\n`);
  } else {
    receipt.hash = txReceipt.hash;
    receipt.blockNumber = txReceipt.blockNumber;
    receipt.explorerURL = isLocal ? "" : `${baseURL}/${txReceipt.hash}`;
    console.log(`Voted ${PROPOSALS[idx]} with ${MINT_VALUE} decimal units!\n`);
  }

  RECEIPTS.push(receipt);

  const winningProposal = await ballotContract.winningProposal();
  const proposal = await ballotContract.proposals(winningProposal);

  if (proposal.voteCount > 0n) {
    const winnerName = ethers.decodeBytes32String(proposal.name);
    console.log("Winner:", winnerName);
    console.log("TotalVote:", proposal.voteCount.toString());

    RECORD.winner = {
      name: winnerName,
      totalVote: proposal.voteCount.toString(),
    };
  }

  RECORD.receipts = RECEIPTS;

  const records = JSON.stringify(RECORD, null, 2);
  fs.writeFileSync("records.json", records);
}
