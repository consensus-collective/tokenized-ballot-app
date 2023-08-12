import fs from "fs"

import { ethers } from "hardhat"
import { MyToken__factory, TokenizedBallot__factory } from "../typechain-types"

const PROPOSALS = ["CAT", "FISH", "DOG"]
const MINT_VALUE = ethers.parseUnits("1")
const RECEIPTS: any[] = []
const HISTORY = {
  network: "localhost",
  receipts: RECEIPTS,
  winner: { name: "none", totalVote: "0" },
}

async function main() {
  const allAccounts = await ethers.getSigners()
  const accounts = allAccounts.slice(0, 3)
  const [deployer, account1, account2] = accounts
  const network = await ethers.provider.getNetwork()

  console.log(`Running on network ${network.name}...\n`)
  console.log(`Total accounts: ${accounts.length}`)
  console.log(`Deployer: ${deployer.address}`) 
  console.log(`Account1: ${account1?.address}`)
  console.log(`Account2: ${account2?.address}\n`)

  HISTORY.network = network.name

  // Initiate contract factory
  const tokenFactory = new MyToken__factory(deployer)
  const ballotFactory = new TokenizedBallot__factory(deployer)

  // Deploy token contract
  console.log("Deploying token contract...")

  const tokenContract = await tokenFactory.deploy().then((contract) => contract.waitForDeployment())

  const tokenContractAddress = await tokenContract.getAddress()

  console.log(`Token contract deployed at ${tokenContractAddress}!\n`)

  // Minting
  console.log(`Minting...`)

  const connectedContract = tokenContract.connect(deployer)
  const mintingReceipts = await Promise.all(
    accounts.map(async (account, idx) => {
      const address = account.address
      const mint = connectedContract.mint(address, MINT_VALUE)
      const receipt = await mint.then((contract) => contract.wait())
      if (!receipt) return null
      const accountName = idx === 0 ? "deployer" : `account${idx}`
      const explorer =
        network.name === "localhost" || network.name === "hardhat"
          ? ""
          : `https://${network.name}.etherscan.io/tx/${receipt.hash}`

      return {
        name: "mint",
        from: {
          name: "deployer",
          address: receipt.from,
        },
        to: receipt.to,
        params: {
          account: { name: accountName, address },
          amount: MINT_VALUE.toString(),
        },
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerURL: explorer,
      }
    })
  )

  console.log(`Minted ${MINT_VALUE} decimal units!\n`)

  RECEIPTS.push(...mintingReceipts)

  // Delegating
  console.log("Self delegating...")

  const delegateRecipt = await Promise.all(
    accounts.map(async (account, idx) => {
      const address = account.address
      const connectedContract = tokenContract.connect(account)
      const delegate = connectedContract.delegate(address)
      const receipt = await delegate.then((contract) => contract.wait())
      if (!receipt) return null
      const accountName = idx === 0 ? "deployer" : `account${idx}`
      const explorer =
        network.name === "localhost" || network.name === "hardhat"
          ? ""
          : `https://${network.name}.etherscan.io/tx/${receipt.hash}`

      return {
        name: "delegate (self delegate)",
        from: {
          name: accountName,
          address: receipt.from,
        },
        to: receipt.to,
        params: {
          account: { name: accountName, address },
        },
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerURL: explorer,
      }
    })
  )

  console.log(`Delegated!\n`)

  RECEIPTS.push(...delegateRecipt)

  if (accounts.length == 3) {
    // Account 1 delegate to account 2
    console.log(`Voter is delegating to delegator...`)
    console.log(`Voter: ${account1.address} (account1)`)
    console.log(`Delegator: ${account2.address} (account2)`)

    const receipt = await tokenContract
      .connect(account1)
      .delegate(account2.address)
      .then((contract) => contract.wait())

    if (receipt) {
      const explorer =
        network.name === "localhost" || network.name === "hardhat"
          ? ""
          : `https://${network.name}.etherscan.io/tx/${receipt.hash}`

      RECEIPTS.push({
        name: "delegate",
        from: {
          name: "account1",
          address: receipt.from,
        },
        to: receipt.to,
        params: {
          account: { name: "account2", address: account2.address },
        },
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerURL: explorer,
      })
    }

    console.log("Delegated!\n")
  }

  // Parameter
  const proposals = PROPOSALS.map((e) => ethers.encodeBytes32String(e))
  const blockNumber = await ethers.provider.getBlockNumber()

  // Deploy ballot contract
  console.log("Deploying ballot contract...")

  const ballotContract = await ballotFactory
    .deploy(proposals, tokenContractAddress, BigInt(blockNumber))
    .then((contract) => contract.waitForDeployment())

  const ballotContractAddress = await ballotContract.getAddress()

  console.log(`Ballot contract deployed at ${ballotContractAddress}\n`)

  // Vote more than 1 proposal by deployer (FIXED AMOUNT)
  const votingPower = await ballotContract.votingPower(deployer.address)

  console.log(`Voting all proposals with the random amount of decimal units...`)
  console.log(`Voter: ${deployer.address} (deployer)`)
  console.log(`Voting Power: ${votingPower.toString()} decimal units`)

  let remaining = 1000n
  for (let i = 0; i < PROPOSALS.length; i++) {
    const proposalName = PROPOSALS[i]
    
    let random = BigInt(Math.floor((Math.random() / 2) * 1000))   
    while (random > remaining) {
      random = BigInt(Math.floor((Math.random() / 2) * 1000))
    }

    const amount = (random * votingPower) / 1000n
    const receipt = await ballotContract
      .connect(deployer)
      .vote(i, amount)
      .then((contract) => contract.wait())

    remaining -= random
    if (!receipt) continue
    const explorer =
      network.name === "localhost" || network.name === "hardhat"
        ? ""
        : `https://${network.name}.etherscan.io/tx/${receipt.hash}`

    RECEIPTS.push({
      name: "vote",
      from: {
        name: "deployer",
        address: receipt.from,
      },
      to: receipt.to,
      params: {
        proposal: { name: proposalName, index: i },
        amount: amount.toString(),
      },
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerURL: explorer,
    })

    console.log(`Voted ${proposalName} with ${amount} decimal units!`)
  }

  console.log("")

  if (accounts.length == 3) {
    // Vote more than 1 proposal by account 2 (FIXED AMOUNT)
    const votingPower = await ballotContract.votingPower(account2.address)

    console.log(`Voting all proposals with the same amount of decimal units...`)
    console.log(`Voter: ${account2.address} (account2)`)
    console.log(`Voting Power: ${votingPower} decimal units`)

    const total = BigInt(PROPOSALS.length)
    const amount = MINT_VALUE / total

    const receipts = await Promise.all(
      PROPOSALS.map(async (_, idx) => {
        const receipt = await ballotContract
          .connect(account2)
          .vote(idx, amount)
          .then((contract) => contract.wait())

        if (!receipt) return null
        const explorer =
          network.name === "localhost" || network.name === "hardhat"
            ? ""
            : `https://${network.name}.etherscan.io/tx/${receipt.hash}`

        return {
          name: "vote",
          from: {
            name: "account2",
            address: receipt.from,
          },
          to: receipt.to,
          params: {
            proposalIndex: idx,
            amount: amount.toString(),
          },
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          explorerURL: explorer,
        }
      })
    )

    console.log(`Voted all proposals with ${amount} decimal units!\n`)

    RECEIPTS.push(...receipts)
  }

  const winningProposal = await ballotContract.winningProposal()
  const proposal = await ballotContract.proposals(winningProposal)

  if (proposal.voteCount > 0n) {
    const winnerName = ethers.decodeBytes32String(proposal.name)
    console.log("Winner:", winnerName)
    console.log("TotalVote:", proposal.voteCount.toString())

    HISTORY.winner = {
      name: winnerName,
      totalVote: proposal.voteCount.toString(),
    }
  }

  HISTORY.receipts = RECEIPTS

  const receipts = JSON.stringify(HISTORY, null, 2)
  fs.writeFileSync("receipts.json", receipts)
}

main().catch((err) => {
  console.log(err)
  process.exit(1)
})
