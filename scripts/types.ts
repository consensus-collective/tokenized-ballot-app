export type AddressLike = `0x${string}`;

export interface Contract {
  signer: string;
  contract: string;
}

export interface VoteArgument extends Contract {
  proposal: string;
  amount: string;
}

export interface VotingPowerArgument extends Contract {
  address: string;
}
