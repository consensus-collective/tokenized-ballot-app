# Homework 3 for Group 6

## Deploy

1. ERC20Votes
   `npx hardhat deploy --tags MyToken  --network sepolia`

2. TokenizedBallotV2
   `npx hardhat deploy --tags TokenizedBallotV2 --network sepolia`

## Contract Address

ERC20Votes: 0x42c9284864A50Ab5e9bE0c87220d829124Ff5d5A

TokenizedBallotV2: 0x7d2381a92ca84C59d7a94244C87B522dF54a94e0

## Changes

We modified the `TokenizedBallot` contract as `TokenizedBallotV2` with following changes:

- Integrated with Openzeppelin's `Ownable` contract.
- Add view function `proposalCount` to get the total number of proposals
- Add a `setTargetBlock` function s.t. the owner could change the `targetBlockNumber`
- Add eventLogs for `vote` function

## Scripts

1. Mint
   `npx hardhat mint [--contract] [--address] [--amount] [--network]`

demo:

```bash
$ npx hardhat mint --network sepolia

{
  hash: '0x3f1b00bcf3af64b3cc81ded23787e728432071f346e35dde6aae47080a3fbcc0',
  block: null,
  from: '0xb66c6D8d96fAa683A4eb2Cb4b854f7bB2295e01E',
  to: '0x1453b498C84875C4cB73A8228Df393475b0535C1',
  explorerURL: 'https://sepolia.etherscan.io/tx/0x3f1b00bcf3af64b3cc81ded23787e728432071f346e35dde6aae47080a3fbcc0'
}
```

2. Delegate
   `$ npx hardhat delegate [--contract] [--address] [--network]`

demo:

```bash
$ npx hardhat delegate --network sepolia

{
  hash: '0x7789cdb736a881da0a8cb30833c811d61847482aa74ecc83ac65b99ba47cbc7e',
  block: null,
  from: '0xb66c6D8d96fAa683A4eb2Cb4b854f7bB2295e01E',
  to: '0x1453b498C84875C4cB73A8228Df393475b0535C1',
  explorerURL: 'https://sepolia.etherscan.io/tx/0x7789cdb736a881da0a8cb30833c811d61847482aa74ecc83ac65b99ba47cbc7e'
}
```

3. Vote
   `$ npx hardhat vote [--signer] [--contract] [--proposal] [--amount] [--network]`

demo:

```bash
$ npx hardhat vote --network sepolia

{
  hash: '0x5626da5c9dcacb166ac757f0b048a45ab39f33caaa48886bd7c3a628695ad50d',
  block: 4074123,
  from: '0x47fd2c10B62716348fc4E4052f870930946C0a19',
  to: '0x54346322023f663b1c1B77A704f5AD273Ca4AfBc',
  explorerURL: 'https://sepolia.etherscan.io/tx/0x5626da5c9dcacb166ac757f0b048a45ab39f33caaa48886bd7c3a628695ad50d'
}
```

4. Record (Deploy, Mint, Delegate, Vote, Winning Name, and Winning Vote Count)
   `$ npx hardhat record [--network]`

demo:

```bash
$ npx hardhat record --network sepolia

Running on network sepolia...

Total accounts: 3
Deployer: 0x33Cb9c62131915C86DFfCb5C853379865Ae7379d
Account1: 0xD22C7a03d8a7f55916A1DF0ae3840B82B46216ae
Account2: 0x47fd2c10B62716348fc4E4052f870930946C0a19

Deploying token contract...
Token contract deployed at 0x67d57C377a1812dd7B8F1EE176ae115FfC66eb78!

Minting...
Minted 1000000000000000000 decimal units to deployer!
Minted 1000000000000000000 decimal units to account1!
Minted 1000000000000000000 decimal units to account2!

Self delegating...
deployer is delegated!
account1 is delegated!
account2 is delegated!

Voter is delegating to delegator...
Voter: 0xD22C7a03d8a7f55916A1DF0ae3840B82B46216ae (account1)
Delegator: 0x47fd2c10B62716348fc4E4052f870930946C0a19 (account2)
Delegated!

Deploying ballot contract...
Ballot contract deployed at 0x54346322023f663b1c1B77A704f5AD273Ca4AfBc

Voting all proposals with the random amount of decimal units...
Voter: 0x33Cb9c62131915C86DFfCb5C853379865Ae7379d (deployer)
Voting Power: 1000000000000000000 decimal units
Voted CAT with 271000000000000000 decimal units!
Voted FISH with 494000000000000000 decimal units!
Voted DOG with 214000000000000000 decimal units!

Voting all proposals with the same amount of decimal units...
Voter: 0x47fd2c10B62716348fc4E4052f870930946C0a19 (account2)
Voting Power: 2000000000000000000 decimal units
Voted CAT with 666666666666666666 decimal units!
Voted FISH with 666666666666666666 decimal units!
Voted DOG with 666666666666666666 decimal units!

Voting a random proposal...
Voter: 0xD22C7a03d8a7f55916A1DF0ae3840B82B46216ae (account1)
Voting Power: 0 decimal units
Vote DOG with 1000000000000000000 decimal units is rejected!

Winner: FISH
TotalVote: 1160666666666666666
```

The [result](records.json) will be recorded at `records.json`

## Test ang Coverage

```
------------------------|----------|----------|----------|----------|----------------|
File                    |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------------|----------|----------|----------|----------|----------------|
 contracts/             |    82.61 |       75 |    82.35 |    82.05 |                |
  MyToken.sol           |    83.33 |       50 |       80 |    83.33 |             41 |
  TokenizedBallot.sol   |    57.14 |       50 |       60 |    57.14 |... 59,60,61,67 |
  TokenizedBallotV2.sol |      100 |      100 |      100 |      100 |                |
------------------------|----------|----------|----------|----------|----------------|
All files               |    82.61 |       75 |    82.35 |    82.05 |                |
------------------------|----------|----------|----------|----------|----------------|

> Istanbul reports written to ./coverage/ and ./coverage.json
```
