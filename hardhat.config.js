require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config();

const CHAIN_IDS = {
  hardhat: 31337
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
      hardhat: {
          chainId: CHAIN_IDS.hardhat,
          forking: {
              url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_TOKEN}`
          }
      }
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
      },
      {
        version: "0.4.18",
      }
    ],
  },
  
};
