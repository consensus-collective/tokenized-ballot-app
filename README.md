# hardhat-base-template

Starter repo to create Hardhat projects. Includes Hardhat, Mocha, Chai

## To create a Hardhat project with this template

1. `git clone https://github.com/consensus-collective/hardhat-base-template`
2. `yarn install`
3. `yarn hardhat init`
4. `yarn hardhat compile` : Check if tests compile

## Libraries included:

- hardhat
- ethers
- chai
- typescript
- ts-node
- typechain
- @nomicfoundation/hardhat-chai-matchers
- @nomicfoundation/hardhat-ethers
- @nomicfoundation/hardhat-network-helpers
- @nomicfoundation/hardhat-toolbox
- @nomicfoundation/hardhat-verify
- @typechain/ethers-v6
- @typechain/hardhat
- @types/chai
- @types/mocha
- @types/node
- hardhat-gas-reporter
- solidity-coverage

## Deployment

1. ERC20Votes
   `npx hardhat deploy --tags MyToken  --network sepolia`

2. TokenizedBallot
   `npx hardhat deploy --tags TokenizedBallot --network sepolia`

## Contract Address

ERC20Votes: 0x42c9284864A50Ab5e9bE0c87220d829124Ff5d5A

TokenizedBallot: to be deployed after everyone is delegated

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
