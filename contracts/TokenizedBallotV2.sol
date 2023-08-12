// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
/// @title Voting with delegation.

interface IMyToken {
    function getPastVotes(address, uint256) external view returns (uint256);
}

contract TokenizedBallotV2 is Ownable{
    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    Proposal[] public proposals;

    IMyToken public tokenContract;

    uint256 public targetBlockNumber;

    mapping(address => uint256) public votingPowerSpent;


    // events
    event SetTargetBlock(address indexed sender, uint256 prevTargetBlock, uint256 newTargetBlock);
    event Vote(address indexed sender, uint proposal, uint amount);

    /// Create a new ballot to choose one of `proposalNames`.
    constructor(
        bytes32[] memory proposalNames,
        address _tokenContract,
        uint256 _targetBlockNumber
    ) {
        tokenContract = IMyToken(_tokenContract);
        targetBlockNumber = _targetBlockNumber;

        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
        }
    }

    function vote(uint proposal, uint amount) external {
        //todo
        // require voting power to be higher than amount
        // update the proposal vote count
        require(
            votingPower(msg.sender) >= amount,
            "TokenizedBallot: trying to vote more than allowed"
        );
        votingPowerSpent[msg.sender] += amount;
        proposals[proposal].voteCount += amount;

        emit Vote(msg.sender, proposal, amount);
    }

    function votingPower(address account) public view returns(uint256) {
        return (
            tokenContract.getPastVotes(account, targetBlockNumber) - votingPowerSpent[account]
        );
    }

    function winningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }

    // return total number of proposals
    function proposalCount() external view returns (uint count){
        count = proposals.length;
    }

    function setTargetBlockNumber(uint256 newBlockNumber) external onlyOwner {
        uint256 prevTargetBlock = targetBlockNumber;
        targetBlockNumber = newBlockNumber;

        emit SetTargetBlock(msg.sender, prevTargetBlock, newBlockNumber);
    }
}
