import { ethers } from '@rsksmart/bridges-core-sdk'

export const BOLTZ_ETHER_SWAP_ABI = new ethers.utils.Interface([
  'function claim(bytes32 preimage, uint256 amount, address claimAddress, address refundAddress, uint256 timelock) public',
  'function lock(bytes32 preimageHash, address claimAddress, uint256 timelock) external payable'
])
