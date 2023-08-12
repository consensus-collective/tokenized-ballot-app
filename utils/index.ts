import { HardhatRuntimeEnvironment } from "hardhat/types";

export function logTransaction(hre: HardhatRuntimeEnvironment, txn: any): void {
  if (txn) {
    console.log({
      hash: txn.hash,
      block: txn.blockNumber,
      from: txn.from,
      to: txn.to,
      explorerURL:
        hre.network.config.chainId === 31337
          ? ""
          : `https://${hre.network.name}.etherscan.io/tx/${txn.hash}`,
    });
  }
}
