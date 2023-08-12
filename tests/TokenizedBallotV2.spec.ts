import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MyToken, MyToken__factory, TokenizedBallotV2, TokenizedBallotV2__factory } from "../typechain-types";
import chai from "chai";
import { mine, mineUpTo } from "@nomicfoundation/hardhat-network-helpers";
import _ from "lodash";
import { BigNumberish, parseEther } from "ethers";

const { expect } = chai;

const DEFALUT_MINT_AMOUNT = parseEther("100000");
async function massMint(
  tokenContract: MyToken,
  receipient: SignerWithAddress[],
  amount: BigNumberish = DEFALUT_MINT_AMOUNT
) {
  for (const r of receipient) {
    await tokenContract.mint(r.address, amount);
  }
}

async function massDelegate(tokenContract: MyToken, users: SignerWithAddress[]) {
  let block;
  for (const user of users) {
    const txn = await tokenContract.connect(user).delegate(user.address);
    await txn.wait();
    block = txn.blockNumber;
  }

  return block;
}

describe("Ballot2", function () {
  let owner: SignerWithAddress;
  let users: SignerWithAddress[];
  let tokenContract: MyToken;
  let ballotContract: TokenizedBallotV2;
  let proposals: string[];
  let delegateBlock: number;
  let targetBlock: number;

  beforeEach(async function () {
    // Get Factories
    const [first, ...rest] = await ethers.getSigners();
    owner = first;
    users = rest;

    proposals = _.range(10).map((i) => {
      return ethers.encodeBytes32String("Proposal" + i);
    });

    const ballotFactory = new TokenizedBallotV2__factory(owner);
    const tokenFactory = new MyToken__factory(owner);

    tokenContract = await tokenFactory.deploy();
    await tokenContract.waitForDeployment();

    // mint tokens to all users
    await massMint(tokenContract, users);

    // let users 0 and 1 self delegate, store the blockNumber of the transaction
    delegateBlock = (await massDelegate(tokenContract, users.slice(0, 2))) ?? (await ethers.provider.getBlockNumber());

    targetBlock = delegateBlock + 1000;

    ballotContract = (await ballotFactory
      .connect(owner)
      .deploy(proposals, await tokenContract.getAddress(), targetBlock)) as TokenizedBallotV2;

    await ballotContract.waitForDeployment();
  });

  describe("[Ownable]", function () {
    it("shd be able to return correct owner", async function () {
      expect(await ballotContract.owner()).to.equal(owner.address);
    });

    it("shd able to transferOwnership", async function () {
      const receipt = await ballotContract.connect(owner).transferOwnership(users[0].address);

      expect(await ballotContract.owner()).to.equal(users[0].address);
      await expect(receipt).to.emit(ballotContract, "OwnershipTransferred").withArgs(owner.address, users[0].address);
    });
  });

  describe("[BallotV2]", function () {
    describe("[#votes]", function () {
      it("shd able to revert for future lookup", async function () {
        // ensure targetBlock is not mined yet
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(currentBlock).to.lessThan(targetBlock);

        // shd revert for future lookup
        await expect(ballotContract.votingPower(users[0].address)).to.be.revertedWith("ERC20Votes: future lookup");
      });

      it("shd be able to return correct voting power", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        const votingPower = await ballotContract.votingPower(users[0].address);
        await expect(votingPower).to.be.equal(DEFALUT_MINT_AMOUNT);
      });

      it("shd be able to vote", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        const txn = await ballotContract.connect(users[0]).vote(1, parseEther("10"));
        await expect(txn).to.emit(ballotContract, "Vote").withArgs(users[0].address, 1, parseEther("10"));
      });

      it("shd be able to vote for multiple times", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        const currVotingPower = await ballotContract.votingPower(users[0].address); // 100_000
        await expect(currVotingPower).to.eq(parseEther("100000"));
        const currVotingSpent = await ballotContract.votingPowerSpent(users[0].address); // 0
        await expect(currVotingSpent).to.eq(0);

        const votingAmount = parseEther("20000");
        // let's for 20_000 each for 5 times
        for (let i = 0; i < 5; ++i) {
          const txn = await ballotContract.connect(users[0]).vote(0, votingAmount);
          await expect(txn).to.emit(ballotContract, "Vote").withArgs(users[0].address, 0, votingAmount);
        }

        const afterVotingPower = await ballotContract.votingPower(users[0].address); // 100_000
        await expect(afterVotingPower).to.eq(0);
        const afterVotingSpent = await ballotContract.votingPowerSpent(users[0].address); // 0
        await expect(afterVotingSpent).to.eq(parseEther("100000"));

        // voting count of proposal0
        const votingCount = (await ballotContract.proposals(0))[1];
        await expect(votingCount).to.eq(parseEther("100000"));
      });

      it("shd be able to vote for multiple proposals", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        const votingStrategies = _.range(10).map((i) => {
          return { proposal: i, amount: _.random(100, false) };
        });

        for (const strategy of votingStrategies) {
          const amountBN = parseEther(strategy.amount.toString());
          const txn = await ballotContract.connect(users[0]).vote(strategy.proposal, amountBN);
          await expect(txn).to.emit(ballotContract, "Vote").withArgs(users[0].address, strategy.proposal, amountBN);
        }
      });

      it("shd be reverted when exceeding votingPower", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        const amountBN = parseEther("100001");

        await expect(ballotContract.connect(users[0]).vote(0, amountBN)).to.be.revertedWith(
          "TokenizedBallot: trying to vote more than allowed"
        );
      });
    });

    describe("[#views]", function () {
      it("shd return correct proposal length", async function () {
        const proposalLength = proposals.length;

        expect(await ballotContract.proposalCount()).to.eq(proposalLength);
      });

      it("shd return correct winning proposal 1/ ", async function () {
        // shd return the first proposal at init stage
        expect(await ballotContract.winningProposal()).to.eq(0);
      });

      it("shd return correct winning proposal 2/ ", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        //lets vote for proposal 9
        await ballotContract.connect(users[0]).vote(9, parseEther("10"));
        expect(await ballotContract.winningProposal()).to.eq(9);
      });

      it("shd return correct winning proposal name", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        //lets vote for proposal 9
        await ballotContract.connect(users[0]).vote(9, parseEther("10"));
        expect(await ballotContract.winnerName()).to.eq(ethers.encodeBytes32String("Proposal9"));
      });
    });

    describe("[#setTargetBlock]", function () {
      it("shd be able to setTargetBlock", async function () {
        const prevTargetBlock = await ballotContract.targetBlockNumber();
        const newTargetBlock = 100_000;

        // set the targetBlockNumber to 100_000
        const txn = await ballotContract.connect(owner).setTargetBlockNumber(newTargetBlock);

        expect(await ballotContract.targetBlockNumber()).to.eq(newTargetBlock);
        await expect(txn)
          .to.emit(ballotContract, "SetTargetBlock")
          .withArgs(owner.address, prevTargetBlock, newTargetBlock);
      });

      it("shd be reverted for non-owner", async function () {
        await expect(ballotContract.connect(users[0]).setTargetBlockNumber(100_000)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      it("shd be able to update pastVote after setTargetBlock 1/", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        const prevVotingPower = await ballotContract.votingPower(users[0].address); // 100_000
        await expect(prevVotingPower).to.eq(parseEther("100000"));

        // now we set the targetBlock to the block before users[0] delegate
        // remark: since we do `delegate` in a for loop, users[0] may not be delegate at the block right before the delegateBlock
        await ballotContract.connect(owner).setTargetBlockNumber(delegateBlock - 10);

        // 0 votingPower after change targetBlock
        const afterVotingPower = await ballotContract.votingPower(users[0].address);
        await expect(afterVotingPower).to.eq(0);
      });

      it("shd be able to update pastVote after setTargetBlock 2/", async function () {
        // mine up to the block right after targetBlock
        await mineUpTo(targetBlock + 1);

        const prevVotingPower = await ballotContract.votingPower(users[0].address); // 100_000
        await expect(prevVotingPower).to.eq(parseEther("100000"));

        // mint more token to users[0] to increase his voting power
        await massMint(tokenContract, [users[0]]);
        const newDelegateBlock = await massDelegate(tokenContract, [users[0]]);

        // since we havent update the targetBlock yet, his voting power shd be remain unchanged
        const newVotingPower = await ballotContract.votingPower(users[0].address); // 100_000
        await expect(newVotingPower).to.eq(parseEther("100000"));

        // now we set the targetBlock to the block right after our 2nd delegate
        await mineUpTo(newDelegateBlock! + 1);
        await ballotContract.connect(owner).setTargetBlockNumber(newDelegateBlock! + 1);

        // 0 votingPower after change targetBlock
        const afterVotingPower = await ballotContract.votingPower(users[0].address);
        await expect(afterVotingPower).to.eq(parseEther("200000"));
      });
    });
  });
});
