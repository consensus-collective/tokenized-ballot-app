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

## Test ang Coverage

```
------------------------|----------|----------|----------|----------|----------------|
File                    |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------------|----------|----------|----------|----------|----------------|
 contracts/             |    82.61 |    64.29 |    77.78 |       80 |                |
  MyToken.sol           |    83.33 |       50 |       80 |    83.33 |             41 |
  TokenizedBallot.sol   |    57.14 |    33.33 |       50 |    53.33 |... 60,61,67,72 |
  TokenizedBallotV2.sol |      100 |      100 |      100 |      100 |                |
------------------------|----------|----------|----------|----------|----------------|
All files               |    82.61 |    64.29 |    77.78 |       80 |                |
------------------------|----------|----------|----------|----------|----------------|

> Istanbul reports written to ./coverage/ and ./coverage.json
```
