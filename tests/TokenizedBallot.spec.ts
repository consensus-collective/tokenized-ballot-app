import { expect } from "chai";
import { ethers } from "hardhat";
import { MyToken, MyToken__factory, TokenizedBallot, TokenizedBallot__factory } from "../typechain-types";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const PROPOSALS = ["CAT", "FISH", "DOG"];
const MINT_VALUE = ethers.parseUnits("1");
const TARGET_BLOCK_NUMBER = ethers.toBigInt("10");

async function deployContract(): Promise<[MyToken, TokenizedBallot]> {
  const [deployer] = await ethers.getSigners();

  // Initialize factory
  const tokenFactory = new MyToken__factory(deployer);
  const ballotFactory = new TokenizedBallot__factory(deployer);

  // Intialize token contract
  const tokenContract = await tokenFactory.deploy().then((contract) => contract.waitForDeployment());

  // Initialize params
  const proposals = PROPOSALS.map((e) => ethers.encodeBytes32String(e));
  const tokenAddress = await tokenContract.getAddress();

  const ballotContract = await ballotFactory
    .deploy(proposals, tokenAddress, TARGET_BLOCK_NUMBER)
    .then((contract) => contract.waitForDeployment());

  return [tokenContract, ballotContract];
}

describe("Tokenized Ballot", async () => {
  // Contracts
  let tokenContract: MyToken;
  let ballotContract: TokenizedBallot;

  // Accounts
  let deployer: HardhatEthersSigner;
  let account1: HardhatEthersSigner;
  let account2: HardhatEthersSigner;

  beforeEach(async () => {
    [deployer, account1, account2] = await ethers.getSigners();
    [tokenContract, ballotContract] = await loadFixture(deployContract);
  });

  describe("When the TokenizedBallot contract is deployed", async () => {
    it("has the provided proposals", async () => {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const expected = PROPOSALS[index];
        const proposal = await ballotContract.proposals(index);
        expect(ethers.decodeBytes32String(proposal.name)).to.eq(expected);
      }
    });

    it("has zero votes for all proposals", async () => {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(proposal.voteCount).to.eq(0);
      }
    });

    it("uses a valid ERC20 as token vote", async () => {
      const contractAddr = await ballotContract.tokenContract();
      const tokenContract = await ethers.getContractAt("MyToken", contractAddr);
      const balanceOf = tokenContract.balanceOf(ethers.ZeroAddress);
      const totalSupply = tokenContract.totalSupply();
      await expect(balanceOf).not.to.be.reverted;
      await expect(totalSupply).not.to.be.reverted;
    });
  });

  describe("when the voter interact with the vote function in the contract", async () => {
    it("can not vote when the voter do not having votepower", async () => {
      // Make block timestamp in the future
      await mine(1000);

      // Rejected vote
      const vote = ballotContract.connect(account1).vote(0, MINT_VALUE);
      const error = "TokenizedBallot: trying to vote more than allowed";
      await expect(vote).to.be.revertedWith(error);

      // Voting power
      const votingPower = await ballotContract.votingPower(account1.address);
      expect(votingPower).to.equal(0n);
    });

    it("can not vote even though the voter has token to vote", async () => {
      // Make block timestamp in the future
      await mine(1000);

      // Mint
      await tokenContract.connect(deployer).mint(account1.address, MINT_VALUE);
      const balance = await tokenContract.balanceOf(account1.address);
      expect(balance).to.equal(MINT_VALUE);

      // Rejected vote
      const vote = ballotContract.connect(account1).vote(0, MINT_VALUE);
      const error = "TokenizedBallot: trying to vote more than allowed";
      await expect(vote).to.be.revertedWith(error);

      // Voting power
      const votingPower = await ballotContract.votingPower(account1.address);
      expect(votingPower).to.equal(0n);
    });

    it("should register the vote when the voter has the voting power", async () => {
      const account = account1.address;

      // Mint and delegate
      await tokenContract.connect(deployer).mint(account, MINT_VALUE);
      const balance = await tokenContract.balanceOf(account);
      expect(balance).to.equal(MINT_VALUE);
      await tokenContract.connect(account1).delegate(account);

      // Make block timestamp in the future
      await mine(1000);

      // Before Voting power
      const beforeVotingPower = await ballotContract.votingPower(account);
      expect(beforeVotingPower).to.equal(MINT_VALUE);

      // Vote
      await ballotContract.connect(account1).vote(1, MINT_VALUE);
      const proposal = await ballotContract.proposals(1);
      const votingPowerSpent = await ballotContract.votingPowerSpent(account);
      expect(votingPowerSpent).to.equal(MINT_VALUE);
      expect(proposal.voteCount).to.equal(MINT_VALUE);

      // After Voting power
      const afterVotingPower = await ballotContract.votingPower(account);
      expect(afterVotingPower).to.equal(0n);
    });

    it("can not cast vote if all the voting power is used", async () => {
      const account = account1.address;

      // Mint and delegate
      await tokenContract.connect(deployer).mint(account1.address, MINT_VALUE);
      const balance = await tokenContract.balanceOf(account1.address);
      expect(balance).to.equal(MINT_VALUE);
      await tokenContract.connect(account1).delegate(account1.address);

      // Make block timestamp in the future
      await mine(1000);

      // Before Voting power
      const beforeVotingPower = await ballotContract.votingPower(account);
      expect(beforeVotingPower).to.equal(MINT_VALUE);

      // Vote
      await ballotContract.connect(account1).vote(1, MINT_VALUE);
      const proposal = await ballotContract.proposals(1);
      const votingPowerSpent = await ballotContract.votingPowerSpent(account);
      expect(votingPowerSpent).to.equal(MINT_VALUE);
      expect(proposal.voteCount).to.equal(MINT_VALUE);

      // After Voting power
      const afterVotingPower = await ballotContract.votingPower(account);
      expect(afterVotingPower).to.equal(0n);

      // Rejected vote
      const vote = ballotContract.connect(account1).vote(1, MINT_VALUE);
      const error = "TokenizedBallot: trying to vote more than allowed";
      await expect(vote).to.be.revertedWith(error);
    });

    it("can vote to more than 1 proposal", async () => {
      const account = account1.address;

      // Mint and delegate
      await tokenContract.connect(deployer).mint(account, MINT_VALUE);
      const balance = await tokenContract.balanceOf(account);
      expect(balance).to.equal(MINT_VALUE);
      await tokenContract.connect(account1).delegate(account);

      // Make block timestamp in the future
      await mine(1000);

      // Before Voting power
      const beforeVotingPower = await ballotContract.votingPower(account);
      expect(beforeVotingPower).to.equal(MINT_VALUE);

      // Vote
      const total = ethers.toBigInt(PROPOSALS.length);
      const amount = MINT_VALUE / total;
      for (let i = 0; i < PROPOSALS.length; i++) {
        await ballotContract.connect(account1).vote(i, amount);

        const proposal = await ballotContract.proposals(i);
        const votingPowerSpent = await ballotContract.votingPowerSpent(account);
        expect(votingPowerSpent).to.equal(amount * (BigInt(i) + 1n));
        expect(proposal.voteCount).to.equal(amount);
      }

      // After Voting power
      const afterVotingPower = await ballotContract.votingPower(account);
      const expected = MINT_VALUE - total * amount;
      expect(afterVotingPower).to.equal(expected);
    });
  });

  describe("when the voter delegate to the other voter", async () => {
    it("should transfer voting power and the delegator able to vote", async () => {
      const account = account1.address;
      const delegator = account2.address;

      // Mint
      await tokenContract.connect(deployer).mint(account, MINT_VALUE);
      const balance = await tokenContract.balanceOf(account);
      expect(balance).to.equal(MINT_VALUE);

      // Self delegate to achive voting power
      await tokenContract.connect(account1).delegate(account1);

      // Delegate to delegator
      await tokenContract.connect(account1).delegate(delegator);

      // Make block timestamp in the future
      await mine(1000);

      // Voting power of account
      const accountVotingPower = await ballotContract.votingPower(account);
      expect(accountVotingPower).to.equal(0n);

      // Voting power of delegator
      const delegatorVotingPower = await ballotContract.votingPower(delegator);
      expect(delegatorVotingPower).to.equal(MINT_VALUE);

      // Vote by the delegator
      await ballotContract.connect(account2).vote(1, MINT_VALUE);
      const proposal = await ballotContract.proposals(1);
      const votingPowerSpent = await ballotContract.votingPowerSpent(delegator);
      expect(votingPowerSpent).to.equal(MINT_VALUE);
      expect(proposal.voteCount).to.equal(MINT_VALUE);
    });
  });
});
